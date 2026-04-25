import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Cita, Sesion } from '../../../../../../core/models/agenda.model';
import { NutricionService } from '../../../../../../core/services/nutricion.service';
import { FormulariosService, HistoriaRespuestaRow } from '../../../../../../core/services/formularios.service';
import {
  NutricionDietaPaciente, NutricionProgreso, CreateProgresoRequest,
  NutricionRegistroComida, NutricionRegistroEjercicio,
  NutricionPreferencia, NutricionMenu, PacienteImagen
} from '../../../../../../core/models/nutricion.model';
import { FormularioCitaAsignacion } from '../../../../../../core/models/formulario.model';
import { AgendaService } from '../../../../../../core/services/agenda.service';
import { environment } from '../../../../../../../environments/environment';
import { PasoFormulariosComponent } from '../pasos/paso-formularios/paso-formularios.component';

type Tab = 'formularios' | 'dieta' | 'registros' | 'progreso' | 'imagenes';

interface HistoriaGroup {
  id: number;
  nombre: string;
  fecha: string;
  observacion_general?: string | null;
  respuestas: HistoriaRespuestaRow[];
}

@Component({
  selector: 'app-sesion-seguimiento',
  standalone: true,
  imports: [NgClass, DecimalPipe, DatePipe, FormsModule, PasoFormulariosComponent],
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

  // Formularios de la sesión
  formulariosCita: FormularioCitaAsignacion[] = [];
  formulariosLoaded = false;

  // Progreso form
  showProgresoForm = false;
  isSavingProgreso = false;
  progresoFoto: File | null = null;
  progresoFotoPreview: string | null = null;
  progresoForm: CreateProgresoRequest = { fecha: new Date().toISOString().split('T')[0] };

  // Imagen sesión upload
  isUploadingImagen = false;

  // Historias clínicas modal
  showHistoriasModal = false;
  historiasLoading = false;
  historiaGroups: HistoriaGroup[] = [];
  expandedHistorias = new Set<number>();

  @ViewChild('pasoFormularios') pasoFormularios!: PasoFormulariosComponent;
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
    this.loadFormularios();
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'dieta'     && !this.dietaActiva)                  this.loadDietas();
    if (tab === 'progreso'  && this.progreso.length === 0)         this.loadProgreso();
    if (tab === 'registros' && this.registrosComida.length === 0)  this.loadRegistros();
    if (tab === 'imagenes'  && this.imagenes.length === 0)         this.loadImagenes();
  }

  private loadFormularios(): void {
    const tipoCitaId = this.cita.tipo_cita?.id ?? this.cita.tipo_cita_id;
    if (!tipoCitaId) { this.formulariosLoaded = true; return; }
    this.formulariosSvc.getFormulariosPorTipoCita(tipoCitaId).subscribe({
      next: (forms) => {
        this.formulariosCita = forms;
        this.formulariosLoaded = true;
        if (forms.length > 0) this.activeTab = 'formularios';
      },
      error: () => { this.formulariosLoaded = true; }
    });
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

  // ── Formularios de sesión ─────────────────────────────────────────────────

  get tieneFormularios(): boolean { return this.formulariosCita.length > 0; }

  onFormulariosGuardados(): void {
    this.successMsg = 'Formularios guardados correctamente.';
    setTimeout(() => { this.successMsg = ''; }, 3000);
  }

  onFormulariosError(msg: string): void { this.errorMsg = msg; }

  // ── Historias clínicas modal ──────────────────────────────────────────────

  openHistoriasModal(): void {
    this.showHistoriasModal = true;
    if (this.historiaGroups.length > 0) return;
    this.historiasLoading = true;
    this.formulariosSvc.getHistoriasRespuestas(this.pacienteId).subscribe({
      next: (rows) => {
        const map = new Map<number, HistoriaGroup>();
        for (const row of rows) {
          if (!map.has(row.id_historia_clinica)) {
            map.set(row.id_historia_clinica, {
              id: row.id_historia_clinica,
              nombre: row.nombre_formulario,
              fecha: row.fecha_registro,
              observacion_general: row.observacion_general,
              respuestas: [],
            });
          }
          map.get(row.id_historia_clinica)!.respuestas.push(row);
        }
        this.historiaGroups = Array.from(map.values()).sort((a, b) => a.id - b.id);
        if (this.historiaGroups.length > 0) this.expandedHistorias.add(this.historiaGroups[0].id);
        this.historiasLoading = false;
      },
      error: () => { this.historiasLoading = false; }
    });
  }

  toggleHistoria(id: number): void {
    if (this.expandedHistorias.has(id)) this.expandedHistorias.delete(id);
    else this.expandedHistorias.add(id);
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
