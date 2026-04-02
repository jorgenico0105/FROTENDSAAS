import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgendaService } from '../../../../../core/services/agenda.service';
import { PacientesService } from '../../../../../core/services/pacientes.service';
import { Cita, TipoCita, CreateCitaRequest } from '../../../../../core/models/agenda.model';
import { Paciente } from '../../../../../core/models/pacientes.model';
import { NuevoPaciente } from '../../../../pacientes/componentes/nuevo-paciente/nuevo-paciente';

@Component({
  selector: 'app-nueva-cita-modal',
  standalone: true,
  imports: [FormsModule, NuevoPaciente],
  templateUrl: './nueva-cita-modal.component.html'
})
export class NuevaCitaModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() tiposCita: TipoCita[] = [];
  @Input() medicoId = 0;
  @Input() clinicaId = 0;
  @Input() initialFecha = '';

  @Output() closed = new EventEmitter<void>();
  @Output() citaCreada = new EventEmitter<Cita>();

  form: CreateCitaRequest = {
    fecha: '', hora: '09:00', duracion_min: 30,
    id_medico: 0, id_paciente: 0, id_clinica: 0,
    tipo_cita_id: 0, motivo: ''
  };

  searchQuery = '';
  searchResults: Paciente[] = [];
  isSearching = false;
  selectedPaciente: Paciente | null = null;
  isAnonymous = false;

  isSubmitting = false;
  errorMsg = '';
  isCrearPacienteOpen = false;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private agendaSvc: AgendaService, private pacientesSvc: PacientesService) {}

  ngOnChanges(): void {
    if (this.isOpen) {
      this.form.id_medico  = this.medicoId;
      this.form.id_clinica = this.clinicaId;
      if (!this.form.fecha) this.form.fecha = this.initialFecha || this.todayStr();
    }
  }

  close(): void { this.reset(); this.closed.emit(); }

  onSearchInput(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (this.searchQuery.trim().length < 2) { this.searchResults = []; return; }
    this.searchTimer = setTimeout(() => this.doSearch(), 350);
  }

  private doSearch(): void {
    this.isSearching = true;
    this.pacientesSvc.list(this.searchQuery, 1, 8).subscribe({
      next: res => { this.searchResults = res.data; this.isSearching = false; },
      error: () => { this.isSearching = false; }
    });
  }

  selectPaciente(p: Paciente): void {
    this.selectedPaciente = p;
    this.form.id_paciente = p.id;
    this.searchQuery = `${p.nombres} ${p.apellidos}`;
    this.searchResults = [];
    this.isAnonymous = false;
  }

  clearPaciente(): void {
    this.selectedPaciente = null;
    this.form.id_paciente = 0;
    this.searchQuery = '';
    this.searchResults = [];
    this.isAnonymous = false;
  }

  useAnonymous(): void {
    this.selectedPaciente = null;
    this.form.id_paciente = 0;
    this.searchQuery = '';
    this.searchResults = [];
    this.isAnonymous = true;
  }

  onPacienteCreado(p: Paciente): void {
    this.selectPaciente(p);
    this.isCrearPacienteOpen = false;
  }

  submit(): void {
    if (!this.form.fecha || !this.form.hora) { this.errorMsg = 'Fecha y hora son requeridos.'; return; }
    if (!this.form.tipo_cita_id)             { this.errorMsg = 'Selecciona el tipo de cita.'; return; }
    if (!this.selectedPaciente && !this.isAnonymous) {
      this.errorMsg = 'Selecciona un paciente, crea uno nuevo o usa el modo anónimo.';
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';

    const payload: CreateCitaRequest = {
      ...this.form,
      id_medico:   this.medicoId,
      id_clinica:  this.clinicaId,
      id_paciente: this.selectedPaciente ? this.selectedPaciente.id : 0,
      tipo_cita_id: +this.form.tipo_cita_id   // garantiza número entero
    };
    this.agendaSvc.createCita(payload).subscribe({
      next: cita => { this.isSubmitting = false; this.citaCreada.emit(cita); this.reset(); },
      error: err => {
        this.errorMsg = err?.error?.message || 'Error al crear la cita.';
        this.isSubmitting = false;
      }
    });
  }

  private reset(): void {
    this.form = {
      fecha: this.todayStr(), hora: '09:00', duracion_min: 30,
      id_medico: this.medicoId, id_paciente: 0, id_clinica: this.clinicaId,
      tipo_cita_id: 0, motivo: ''
    };
    this.selectedPaciente = null;
    this.searchQuery = '';
    this.searchResults = [];
    this.isAnonymous = false;
    this.errorMsg = '';
    this.isSubmitting = false;
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}
    