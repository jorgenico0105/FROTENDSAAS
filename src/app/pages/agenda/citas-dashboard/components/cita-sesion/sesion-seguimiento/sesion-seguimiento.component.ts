import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Cita, Sesion } from '../../../../../../core/models/agenda.model';
import { NutricionService } from '../../../../../../core/services/nutricion.service';
import { FormulariosService } from '../../../../../../core/services/formularios.service';
import {
  NutricionDietaPaciente, NutricionProgreso, CreateProgresoRequest,
  NutricionRegistroComida, NutricionRegistroEjercicio,
  NutricionPreferencia, NutricionMenu, PacienteImagen
} from '../../../../../../core/models/nutricion.model';
import { AgendaService } from '../../../../../../core/services/agenda.service';
import { environment } from '../../../../../../../environments/environment';

type Tab = 'dieta' | 'registros' | 'progreso' | 'imagenes';

@Component({
  selector: 'app-sesion-seguimiento',
  standalone: true,
  imports: [NgClass, DecimalPipe, FormsModule],
  templateUrl: './sesion-seguimiento.component.html'
})
export class SesionSeguimientoComponent implements OnInit {
  @Input() cita!: Cita;
  @Input() sesion: Sesion | null = null;
  @Input() medicoId = 0;

  @Output() sesionCompletada = new EventEmitter<Cita>();

  activeTab: Tab = 'dieta';
  isLoading = false;
  isFinalizando = false;
  errorMsg = '';
  successMsg = '';

  // Datos del paciente
  dietaActiva: NutricionDietaPaciente | null = null;
  menuActivo: NutricionMenu | null = null;
  progreso: NutricionProgreso[] = [];
  registrosComida: NutricionRegistroComida[] = [];
  registrosEjercicio: NutricionRegistroEjercicio[] = [];
  preferencias: NutricionPreferencia[] = [];
  imagenes: PacienteImagen[] = [];
  imagenesLoading = false;

  // Progreso form
  showProgresoForm = false;
  isSavingProgreso = false;
  progresoFoto: File | null = null;
  progresoFotoPreview: string | null = null;
  progresoForm: CreateProgresoRequest = { fecha: new Date().toISOString().split('T')[0] };

  // Imagen sesión upload
  isUploadingImagen = false;

  @ViewChild('progresoFotoInput') progresoFotoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('sesionImagenInput') sesionImagenInput!: ElementRef<HTMLInputElement>;

  readonly apiBase = environment.apiUrl.replace(/\/api\/v\d+$/, '');

  get pacienteId(): number { return this.cita.id_paciente; }

  constructor(
    private nutricionSvc: NutricionService,
    private agendaSvc: AgendaService,
    private formulariosSvc: FormulariosService,
  ) {}

  ngOnInit(): void {
    this.loadDietas();
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'dieta'     && !this.dietaActiva)                  this.loadDietas();
    if (tab === 'progreso'  && this.progreso.length === 0)         this.loadProgreso();
    if (tab === 'registros' && this.registrosComida.length === 0)  this.loadRegistros();
    if (tab === 'imagenes'  && this.imagenes.length === 0)         this.loadImagenes();
  }

  private loadDietas(): void {
    if (!this.pacienteId) return;
    this.isLoading = true;
    this.nutricionSvc.listDietasByPaciente(this.pacienteId).subscribe({
      next: dietas => {
        this.dietaActiva = dietas.find(d => d.estado === 'ACTIVA') ?? null;
        if (this.dietaActiva) {
          this.nutricionSvc.listMenusByDieta(this.pacienteId, this.dietaActiva.id)
            .pipe(catchError(() => of([])))
            .subscribe(menus => {
              const hoy = new Date().toISOString().split('T')[0];
              this.menuActivo = menus.find(m => m.fecha_inicio <= hoy && m.fecha_fin >= hoy)
                ?? menus.sort((a, b) => b.semana_numero - a.semana_numero)[0]
                ?? null;
            });
        }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  private loadProgreso(): void {
    this.isLoading = true;
    this.nutricionSvc.listProgreso(this.pacienteId).subscribe({
      next: d => { this.progreso = d; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  private loadRegistros(): void {
    this.isLoading = true;
    forkJoin({
      comida:       this.nutricionSvc.listRegistrosComida(this.pacienteId),
      ejercicio:    this.nutricionSvc.listRegistrosEjercicio(this.pacienteId),
      preferencias: this.nutricionSvc.listPreferencias(this.pacienteId).pipe(catchError(() => of([]))),
    }).subscribe({
      next: res => {
        this.registrosComida    = res.comida;
        this.registrosEjercicio = res.ejercicio;
        this.preferencias       = res.preferencias;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  // ── Progreso form ────────────────────────────────────────────────────────

  openProgresoForm(): void {
    this.progresoForm = { fecha: new Date().toISOString().split('T')[0] };
    this.progresoFoto = null;
    this.progresoFotoPreview = null;
    this.showProgresoForm = true;
  }

  onProgresoFotoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.progresoFoto = file;
    const reader = new FileReader();
    reader.onload = e => this.progresoFotoPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  saveProgreso(): void {
    if (!this.progresoForm.peso_kg && !this.progresoForm.grasa_corporal_pct && !this.progresoForm.masa_muscular_kg) {
      return;
    }
    this.isSavingProgreso = true;
    this.nutricionSvc.addProgresoMultipart(this.pacienteId, this.progresoForm, this.progresoFoto ?? undefined).subscribe({
      next: (p) => {
        this.progreso = [p, ...this.progreso];
        this.showProgresoForm = false;
        this.isSavingProgreso = false;
      },
      error: () => { this.isSavingProgreso = false; }
    });
  }

  // ── Imágenes del paciente ─────────────────────────────────────────────────

  private loadImagenes(): void {
    this.imagenesLoading = true;
    this.formulariosSvc.listImagenesPaciente(this.pacienteId).subscribe({
      next: imgs => { this.imagenes = imgs; this.imagenesLoading = false; },
      error: () => { this.imagenesLoading = false; }
    });
  }

  onSesionImagenChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.isUploadingImagen = true;
    this.formulariosSvc.uploadImagenPaciente(this.pacienteId, file).subscribe({
      next: img => {
        this.imagenes = [img, ...this.imagenes];
        this.isUploadingImagen = false;
        if (this.sesionImagenInput?.nativeElement) this.sesionImagenInput.nativeElement.value = '';
      },
      error: () => { this.isUploadingImagen = false; }
    });
  }

  imageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${this.apiBase}/${path}`;
  }

  // ── Finalizar ─────────────────────────────────────────────────────────────

  finalizarSesion(): void {
    this.isFinalizando = true;
    this.agendaSvc.updateEstado(this.cita.id, { estado_codigo: 'AT' }).subscribe({
      next: updated => { this.isFinalizando = false; this.sesionCompletada.emit(updated); },
      error: () => { this.errorMsg = 'Error al finalizar la sesión.'; this.isFinalizando = false; }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  get ultimoProgreso(): NutricionProgreso | null {
    return this.progreso.length > 0 ? this.progreso[0] : null;
  }

  get comidasFueraDePlan(): NutricionRegistroComida[] {
    return this.registrosComida.filter(r => r.fuera_de_plan);
  }

  get preferenciasConSintoma(): NutricionPreferencia[] {
    const tiposSintoma = ['ALERGIA', 'INTOLERANCIA', 'SINTOMA', 'EVITAR', 'NO_GUSTA', 'CAUSA_SINTOMA'];
    return this.preferencias.filter(p => tiposSintoma.includes(p.tipo.toUpperCase()));
  }

  estadoBadge(estado: string): string {
    const map: Record<string, string> = {
      ACTIVA:     'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
      COMPLETADA: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      CANCELADA:  'bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400',
      PAUSADA:    'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-600';
  }

  tipoPreferenciaLabel(tipo: string): string {
    const map: Record<string, string> = {
      ALERGIA: 'Alergia', INTOLERANCIA: 'Intolerancia', SINTOMA: 'Síntoma',
      EVITAR: 'Evitar', NO_GUSTA: 'No le gusta', CAUSA_SINTOMA: 'Causa síntoma',
    };
    return map[tipo.toUpperCase()] ?? tipo;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  nombrePaciente(): string {
    if (this.cita.paciente) return `${this.cita.paciente.nombres} ${this.cita.paciente.apellidos}`;
    return `Paciente #${this.cita.id_paciente}`;
  }

  inicialesPaciente(): string {
    if (this.cita.paciente) {
      return (this.cita.paciente.nombres.charAt(0) + this.cita.paciente.apellidos.charAt(0)).toUpperCase();
    }
    return '?';
  }
}
