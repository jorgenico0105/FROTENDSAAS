import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { AgendaService } from '../../../../../core/services/agenda.service';
import { FormulariosService } from '../../../../../core/services/formularios.service';
import { Cita, Sesion } from '../../../../../core/models/agenda.model';
import { Paciente } from '../../../../../core/models/pacientes.model';
import { DatosNutricionales, NutricionDietaPaciente, NutricionPreferencia, PacienteImagen } from '../../../../../core/models/nutricion.model';
import { FormularioCitaAsignacion } from '../../../../../core/models/formulario.model';
import { environment } from '../../../../../../environments/environment';
import { NuevoPaciente } from '../../../../pacientes/componentes/nuevo-paciente/nuevo-paciente';
import { PasoFormulariosComponent } from './pasos/paso-formularios/paso-formularios.component';
import { PasoDietaComponent } from './pasos/paso-dieta/paso-dieta.component';
import { PasoPreferenciasComponent } from './pasos/paso-preferencias/paso-preferencias.component';
import { SesionSeguimientoComponent } from './sesion-seguimiento/sesion-seguimiento.component';

@Component({
  selector: 'app-cita-sesion',
  standalone: true,
  imports: [
    NgClass,
    NuevoPaciente,
    PasoFormulariosComponent,
    PasoDietaComponent,
    PasoPreferenciasComponent,
    SesionSeguimientoComponent,
  ],
  templateUrl: './cita-sesion.component.html'
})
export class CitaSesionComponent implements OnInit {
  @Input() cita!: Cita;
  @Input() sesion: Sesion | null = null;
  @Input() medicoId = 0;

  @Output() back             = new EventEmitter<void>();
  @Output() sesionCompletada = new EventEmitter<Cita>();
  @Output() citaActualizada  = new EventEmitter<Cita>();

  @ViewChild(PasoFormulariosComponent) stepFormularios!: PasoFormulariosComponent;
  @ViewChild(PasoDietaComponent)       stepDieta!: PasoDietaComponent;
  @ViewChild('imagenCitaInput')        imagenCitaInput!: ElementRef<HTMLInputElement>;

  get esPrimeraConsulta(): boolean {
    return this.cita.tipo_cita?.need_historia === true;
  }

  // ── Wizard ────────────────────────────────────────────────────────────────
  // Pasos siempre internos: 1 = Formularios, 2 = Dieta, 3 = Imágenes
  // Si no hay formularios asignados, el wizard arranca en paso 2
  paso = 2;

  formulariosCita: FormularioCitaAsignacion[] = [];
  formulariosLoaded = false;

  get tieneFormularios(): boolean { return this.formulariosCita.length > 0; }

  get wizardSteps(): number[] {
    return this.tieneFormularios ? [1, 2, 3] : [2, 3];
  }

  get wizardLabels(): string[] {
    return this.tieneFormularios ? ['Formularios', 'Dieta', 'Imágenes'] : ['Dieta', 'Imágenes'];
  }

  // ── Shared state between steps ───────────────────────────────────────────
  pacienteId          = 0;
  isCrearPacienteOpen = false;
  caloriasObjetivo    = 2000;
  preferencias:   NutricionPreferencia[] = [];
  dieta:          NutricionDietaPaciente | null = null;
  datosNutricion: DatosNutricionales | null = null;

  // Imágenes (paso 3)
  uploadedImages:    PacienteImagen[] = [];
  isUploadingImagen = false;
  readonly apiBase  = environment.apiUrl.replace(/\/api\/v\d+$/, '');

  errorMsg      = '';
  isFinalizando = false;

  private shouldNavigateToDieta = false;

  constructor(
    private agendaSvc:      AgendaService,
    private router:         Router,
    private formulariosSvc: FormulariosService,
  ) {}

  ngOnInit(): void {
    this.pacienteId = this.cita.id_paciente;
    if (this.esPrimeraConsulta) {
      const tipoCitaId = this.cita.tipo_cita?.id ?? this.cita.tipo_cita_id;
      this.formulariosSvc.getFormulariosPorTipoCita(tipoCitaId).subscribe({
        next: (forms) => {
          this.formulariosCita  = forms;
          this.formulariosLoaded = true;
          this.paso = this.tieneFormularios ? 1 : 2;
        },
        error: () => {
          this.formulariosCita  = [];
          this.formulariosLoaded = true;
          this.paso = 2;
        }
      });
    }
  }

  onPacienteCreado(paciente: Paciente): void {
    this.isCrearPacienteOpen = false;
    this.pacienteId = paciente.id;
    this.agendaSvc.updateCitaPaciente(this.cita.id, paciente.id).subscribe({
      next: (updated: Cita) => this.citaActualizada.emit(updated),
      error: () => {}
    });
  }

  // ── Navegación ───────────────────────────────────────────────────────────

  irASiguiente(): void {
    this.errorMsg = '';

    // Paso 1: formularios
    if (this.paso === 1) {
      if (this.stepFormularios?.hasFormulario && !this.stepFormularios.guardado) {
        this.stepFormularios.iniciarGuardado();
      } else {
        this.paso = 2;
      }
      return;
    }

    // Paso 2: dieta
    if (this.paso === 2) {
      if (!this.stepDieta?.guardado) {
        this.shouldNavigateToDieta = true;
        this.stepDieta?.iniciarGuardado();
      } else {
        this.paso = 3;
      }
      return;
    }
  }

  irAnterior(): void {
    if (this.paso > (this.tieneFormularios ? 1 : 2)) {
      this.paso--;
      this.errorMsg = '';
    }
  }

  omitirFormularios(): void {
    this.stepFormularios?.omitir();
    this.paso = 2;
  }

  omitirDieta(): void {
    this.stepDieta?.omitir();
    this.paso = 3;
  }

  // ── Step event handlers ──────────────────────────────────────────────────

  onFormulariosGuardados(): void    { this.paso = 2; }
  onFormulariosError(msg: string): void { this.errorMsg = msg; }

  onDietaGuardada(dieta: NutricionDietaPaciente): void {
    this.dieta = dieta;
    if (this.shouldNavigateToDieta) {
      this.shouldNavigateToDieta = false;
      this.paso = 3;
    }
  }

  onDietaError(msg: string): void { this.errorMsg = msg; }

  onCaloriasCalculadas(kcal: number): void  { this.caloriasObjetivo = kcal; }
  onDatosNutricionales(datos: DatosNutricionales): void { this.datosNutricion = datos; }

  // ── Imagen upload (paso 3) ────────────────────────────────────────────────

  onImagenCitaChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.pacienteId) return;
    this.isUploadingImagen = true;
    this.formulariosSvc.uploadImagenPaciente(this.pacienteId, file).subscribe({
      next: img => {
        this.uploadedImages = [img, ...this.uploadedImages];
        this.isUploadingImagen = false;
        if (this.imagenCitaInput?.nativeElement) this.imagenCitaInput.nativeElement.value = '';
      },
      error: () => { this.isUploadingImagen = false; }
    });
  }

  imageUrl(path: string): string {
    if (!path || path.startsWith('http')) return path;
    return `${this.apiBase}/${path}`;
  }

  finalizarSesion(): void {
    this.isFinalizando = true;
    this.agendaSvc.updateEstado(this.cita.id, { estado_codigo: 'AT' }).subscribe({
      next: (updated: Cita) => {
        this.isFinalizando = false;
        this.sesionCompletada.emit(updated);
        if (this.dieta && this.pacienteId) {
          this.router.navigate(['/dashboard/nutricion/dietas', this.pacienteId, this.dieta.id]);
        } else if (this.pacienteId) {
          this.router.navigate(['/dashboard/nutricion/pacientes', this.pacienteId]);
        }
      },
      error: () => { this.errorMsg = 'Error al finalizar la sesión.'; this.isFinalizando = false; }
    });
  }

  // ── Nav bar helpers ──────────────────────────────────────────────────────

  get isNavBusy(): boolean {
    if (this.paso === 1) return !!this.stepFormularios?.isBusy;
    if (this.paso === 2) return !!this.stepDieta?.isBusy;
    if (this.paso === 3) return this.isUploadingImagen;
    return false;
  }

  get navShowSave(): boolean {
    if (this.paso === 1) return !!(this.stepFormularios?.hasFormulario && !this.stepFormularios?.guardado);
    if (this.paso === 2) return !this.stepDieta?.guardado;
    return false;
  }

  get esUltimoPaso(): boolean {
    return this.paso === 3;
  }

  get esPrimerPaso(): boolean {
    return this.paso === (this.tieneFormularios ? 1 : 2);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  nombrePaciente(): string {
    if (this.cita.paciente) return `${this.cita.paciente.nombres} ${this.cita.paciente.apellidos}`;
    if (this.cita.id_paciente === 0) return 'Paciente anónimo';
    return `Paciente #${this.cita.id_paciente}`;
  }
}
