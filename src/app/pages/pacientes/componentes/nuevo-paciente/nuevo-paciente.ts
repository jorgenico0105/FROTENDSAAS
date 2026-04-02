import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { Paciente, CreatePacienteRequest } from '../../../../core/models/pacientes.model';

@Component({
  selector: 'app-nuevo-paciente',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './nuevo-paciente.html',
})
export class NuevoPaciente implements OnChanges {
  @Input() isOpen    = false;
  @Input() isEditing = false;
  @Input() paciente: Paciente | null = null;

  @Output() closed          = new EventEmitter<void>();
  @Output() pacienteGuardado = new EventEmitter<Paciente>();

  form: CreatePacienteRequest = this.emptyForm();
  isLoading = false;
  errorMsg  = '';

  constructor(private svc: PacientesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.errorMsg = '';
      this.form = this.isEditing && this.paciente
        ? this.fromPaciente(this.paciente)
        : this.emptyForm();
    }
  }

  save(): void {
    if (!this.form.nombres.trim() || !this.form.apellidos.trim()) {
      this.errorMsg = 'Nombres y apellidos son requeridos.';
      return;
    }
    this.isLoading = true;
    this.errorMsg  = '';

    const obs = this.isEditing && this.paciente
      ? this.svc.update(this.paciente.id, this.form)
      : this.svc.create(this.form);

    obs.subscribe({
      next: (p: Paciente) => { this.isLoading = false; this.pacienteGuardado.emit(p); },
      error: (err: { error?: { message?: string } }) => {
        this.errorMsg  = err?.error?.message || 'Error al guardar.';
        this.isLoading = false;
      }
    });
  }

  close(): void { this.closed.emit(); }

  private emptyForm(): CreatePacienteRequest {
    return {
      nombres: '', apellidos: '', sexo: '', fecha_nacimiento: '',
      telefono: '', correo: '', numero_documento: '', tipo_sangre: '',
      contacto_emergencia: '', telefono_emergencia: '', direccion: ''
    };
  }

  private fromPaciente(p: Paciente): CreatePacienteRequest {
    return {
      nombres:              p.nombres,
      apellidos:            p.apellidos,
      sexo:                 p.sexo              || '',
      fecha_nacimiento:     p.fecha_nacimiento ? p.fecha_nacimiento.split('T')[0] : '',
      telefono:             p.telefono          || '',
      correo:               p.correo            || '',
      numero_documento:     p.numero_documento  || '',
      tipo_sangre:          p.tipo_sangre       || '',
      contacto_emergencia:  p.contacto_emergencia  || '',
      telefono_emergencia:  p.telefono_emergencia  || '',
      direccion:            p.direccion         || ''
    };
  }
}
