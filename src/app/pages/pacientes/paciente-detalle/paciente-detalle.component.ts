import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { PacientesService } from '../../../core/services/pacientes.service';
import { AgendaService } from '../../../core/services/agenda.service';
import { NutricionService } from '../../../core/services/nutricion.service';
import { FormulariosService, HistoriaRespuestaRow } from '../../../core/services/formularios.service';
import { Paciente, CreatePacienteRequest } from '../../../core/models/pacientes.model';
import { Cita, ESTADO_COLORS, ESTADO_LABELS } from '../../../core/models/agenda.model';
import { NutricionDietaPaciente, PacienteImagen } from '../../../core/models/nutricion.model';
import { environment } from '../../../../environments/environment';

export type TabId = 'datos' | 'historias' | 'nutricion' | 'citas' | 'imagenes';

export interface HistoriaGroup {
  id: number;
  nombre: string;
  fecha: string;
  respuestas: HistoriaRespuestaRow[];
}

@Component({
  selector: 'app-paciente-detalle',
  imports: [RouterLink, FormsModule, NgClass],
  templateUrl: './paciente-detalle.component.html'
})
export class PacienteDetalleComponent implements OnInit {
  paciente: Paciente | null = null;
  isLoading = false;
  isEditing = false;
  isSaving = false;
  successMsg = '';
  errorMsg = '';
  pacienteId = 0;

  activeTab: TabId = 'datos';

  // Historias
  historiaGroups: HistoriaGroup[] = [];
  historiasLoading = false;
  expandedHistorias = new Set<number>();

  // Nutrición
  dietas: NutricionDietaPaciente[] = [];
  dietasLoading = false;

  // Citas
  citas: Cita[] = [];
  citasLoading = false;

  // Imágenes
  imagenes: PacienteImagen[] = [];
  imagenesLoading = false;
  isUploadingImagen = false;
  readonly apiBase = environment.apiUrl.replace(/\/api\/v\d+$/, '');

  @ViewChild('imagenInput') imagenInput!: ElementRef<HTMLInputElement>;

  // Re-expose for template
  readonly ESTADO_COLORS = ESTADO_COLORS;
  readonly ESTADO_LABELS = ESTADO_LABELS;

  form: Partial<CreatePacienteRequest> = {};

  constructor(
    private route: ActivatedRoute,
    private svc: PacientesService,
    private agendaSvc: AgendaService,
    private nutricionSvc: NutricionService,
    private formulariosSvc: FormulariosService
  ) {}

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPaciente();
  }

  loadPaciente(): void {
    this.isLoading = true;
    this.svc.get(this.pacienteId).subscribe({
      next: (p) => {
        this.paciente = p;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab as TabId;
    if (tab === 'historias' && this.historiaGroups.length === 0 && !this.historiasLoading) {
      this.loadHistorias();
    }
    if (tab === 'nutricion' && this.dietas.length === 0 && !this.dietasLoading) {
      this.loadDietas();
    }
    if (tab === 'citas' && this.citas.length === 0 && !this.citasLoading) {
      this.loadCitas();
    }
    if (tab === 'imagenes' && this.imagenes.length === 0 && !this.imagenesLoading) {
      this.loadImagenes();
    }
  }

  loadHistorias(): void {
    this.historiasLoading = true;
    this.formulariosSvc.getHistoriasRespuestas(this.pacienteId).subscribe({
      next: (rows) => {
        const map = new Map<number, HistoriaGroup>();
        for (const row of rows) {
          if (!map.has(row.id_historia_clinica)) {
            map.set(row.id_historia_clinica, { id: row.id_historia_clinica, nombre: row.nombre_formulario, fecha: row.fecha_registro, respuestas: [] });
          }
          map.get(row.id_historia_clinica)!.respuestas.push(row);
        }
        this.historiaGroups = Array.from(map.values()).sort((a, b) => a.id - b.id);
        // Auto-expand the first group
        if (this.historiaGroups.length > 0) this.expandedHistorias.add(this.historiaGroups[0].id);
        this.historiasLoading = false;
      },
      error: () => { this.historiasLoading = false; }
    });
  }

  toggleHistoria(id: number): void {
    if (this.expandedHistorias.has(id)) {
      this.expandedHistorias.delete(id);
    } else {
      this.expandedHistorias.add(id);
    }
  }

  countNonEmpty(grupo: HistoriaGroup): number {
    return grupo.respuestas.filter(r => !this.isRespuestaEmpty(r)).length;
  }

  loadDietas(): void {
    this.dietasLoading = true;
    this.nutricionSvc.listDietasByPaciente(this.pacienteId).subscribe({
      next: (d) => { this.dietas = d; this.dietasLoading = false; },
      error: () => { this.dietasLoading = false; }
    });
  }

  loadImagenes(): void {
    this.imagenesLoading = true;
    this.formulariosSvc.listImagenesPaciente(this.pacienteId).subscribe({
      next: imgs => { this.imagenes = imgs; this.imagenesLoading = false; },
      error: () => { this.imagenesLoading = false; }
    });
  }

  onImagenChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.isUploadingImagen = true;
    this.formulariosSvc.uploadImagenPaciente(this.pacienteId, file).subscribe({
      next: img => {
        this.imagenes = [img, ...this.imagenes];
        this.isUploadingImagen = false;
        if (this.imagenInput?.nativeElement) this.imagenInput.nativeElement.value = '';
      },
      error: () => { this.isUploadingImagen = false; }
    });
  }

  imageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${this.apiBase}/${path}`;
  }

  loadCitas(): void {
    this.citasLoading = true;
    this.agendaSvc.listCitas({ size: 50 }).subscribe({
      next: (res) => {
        this.citas = (res.data ?? []).filter(c => c.id_paciente === this.pacienteId);
        this.citasLoading = false;
      },
      error: () => { this.citasLoading = false; }
    });
  }

  startEdit(): void {
    if (!this.paciente) return;
    this.form = {
      nombres: this.paciente.nombres,
      apellidos: this.paciente.apellidos,
      sexo: this.paciente.sexo || '',
      fecha_nacimiento: this.paciente.fecha_nacimiento ? this.paciente.fecha_nacimiento.split('T')[0] : '',
      telefono: this.paciente.telefono || '',
      correo: this.paciente.correo || '',
      numero_documento: this.paciente.numero_documento || '',
      tipo_sangre: this.paciente.tipo_sangre || '',
      contacto_emergencia: this.paciente.contacto_emergencia || '',
      telefono_emergencia: this.paciente.telefono_emergencia || '',
      direccion: this.paciente.direccion || ''
    };
    this.isEditing = true;
    this.errorMsg = '';
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.errorMsg = '';
  }

  save(): void {
    this.isSaving = true;
    this.errorMsg = '';
    this.svc.update(this.pacienteId, this.form).subscribe({
      next: (p) => {
        this.paciente = p;
        this.isEditing = false;
        this.isSaving = false;
        this.successMsg = 'Datos actualizados correctamente.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al guardar.';
        this.isSaving = false;
      }
    });
  }

  calcAge(fechaNac?: string): string {
    if (!fechaNac) return '—';
    const diff = Date.now() - new Date(fechaNac).getTime();
    return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} años`;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  formatRespuesta(row: HistoriaRespuestaRow): string {
    const txt = row.respuesta_text?.trim() ?? '';
    if (txt === 'true')  return 'Sí';
    if (txt === 'false') return 'No';
    if (txt && txt !== '0') return txt;
    if (row.respuesta_numero !== null && row.respuesta_numero !== undefined) return String(row.respuesta_numero);
    return '—';
  }

  isRespuestaEmpty(row: HistoriaRespuestaRow): boolean {
    const txt = row.respuesta_text?.trim() ?? '';
    return (!txt || txt === '0' || txt === 'false') && (row.respuesta_numero === null || row.respuesta_numero === 0);
  }

  historiaBadgeIcon(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('medic') || n.includes('fisic')) return 'ri-heart-pulse-line';
    if (n.includes('nutri') || n.includes('aliment')) return 'ri-leaf-line';
    if (n.includes('ejerc')) return 'ri-run-line';
    return 'ri-file-text-line';
  }

  dietaEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      ACTIVA:     'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
      COMPLETADA: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
      CANCELADA:  'bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400',
      PAUSADA:    'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
}
