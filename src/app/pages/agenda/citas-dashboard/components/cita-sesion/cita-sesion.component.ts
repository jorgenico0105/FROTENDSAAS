import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { AgendaService } from '../../../../../core/services/agenda.service';
import { FormulariosService } from '../../../../../core/services/formularios.service';
import { Cita, Sesion } from '../../../../../core/models/agenda.model';
import { Paciente } from '../../../../../core/models/pacientes.model';
import { DatosNutricionales, NutricionDietaPaciente, NutricionPreferencia, PacienteImagen } from '../../../../../core/models/nutricion.model';
import { environment } from '../../../../../../environments/environment';
import { NuevoPaciente } from '../../../../pacientes/componentes/nuevo-paciente/nuevo-paciente';
import { PasoHistoriaComponent } from './pasos/paso-historia/paso-historia.component';
import { PasoMedicionesComponent } from './pasos/paso-mediciones/paso-mediciones.component';
import { PasoDietaComponent } from './pasos/paso-dieta/paso-dieta.component';
import { PasoPreferenciasComponent } from './pasos/paso-preferencias/paso-preferencias.component';
import { PasoAlimentosComponent } from './pasos/paso-alimentos/paso-alimentos.component';
import { SesionSeguimientoComponent } from './sesion-seguimiento/sesion-seguimiento.component';

// ID del tipo de cita "Primera consulta"
const TIPO_PRIMERA_CONSULTA = 2;

@Component({
  selector: 'app-cita-sesion',
  standalone: true,
  imports: [
    NgClass,
    NuevoPaciente,
    PasoHistoriaComponent,
    PasoMedicionesComponent,
    PasoDietaComponent,
    PasoPreferenciasComponent,
    PasoAlimentosComponent,
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

  @ViewChild(PasoHistoriaComponent)    step1!: PasoHistoriaComponent;
  @ViewChild(PasoMedicionesComponent)  step2!: PasoMedicionesComponent;
  @ViewChild(PasoDietaComponent)       step3!: PasoDietaComponent;
  @ViewChild(PasoPreferenciasComponent) step4!: PasoPreferenciasComponent;
  @ViewChild(PasoAlimentosComponent)   step5!: PasoAlimentosComponent;
  @ViewChild('imagenCitaInput') imagenCitaInput!: ElementRef<HTMLInputElement>;

  get esPrimeraConsulta(): boolean {
    return this.cita.tipo_cita?.need_historia === true;
  }

  // ── Wizard (solo para primera consulta, 4 pasos) ──────────────────────────
  paso = 1;
  // Primera consulta: 4 pa sos (Historia, Mediciones, Dieta, Imágenes)
  readonly stepsFirstVisit  = [1, 2, 3, 4];
  readonly labelsFirstVisit = ['Historia', 'Mediciones', 'Dieta', 'Imágenes'];
  // Wizard legacy (no se usa en primera consulta, mantenido por compatibilidad)
  readonly steps      = [1, 2, 3, 4, 5];
  readonly stepLabels = ['Historia', 'Mediciones', 'Dieta', 'Preferencias', 'Alimentos'];

  // ── Shared state between steps ───────────────────────────────────────────
  pacienteId          = 0;
  isCrearPacienteOpen = false;
  caloriasObjetivo    = 2000;
  preferencias:         NutricionPreferencia[] = [];
  dieta:                NutricionDietaPaciente | null = null;
  datosNutricion:       DatosNutricionales | null = null;

  // Imágenes (paso 4)
  uploadedImages:    PacienteImagen[] = [];
  isUploadingImagen = false;
  readonly apiBase  = environment.apiUrl.replace(/\/api\/v\d+$/, '');

  errorMsg      = '';
  isFinalizando = false;

  private shouldNavigateToDieta = false;

  constructor(
    private agendaSvc: AgendaService,
    private router: Router,
    private formulariosSvc: FormulariosService,
  ) {}

  ngOnInit(): void {
    this.pacienteId = this.cita.id_paciente;
  }

  onPacienteCreado(paciente: Paciente): void {
    this.isCrearPacienteOpen = false;
    this.pacienteId = paciente.id;
    this.agendaSvc.updateCitaPaciente(this.cita.id, paciente.id).subscribe({
      next: (updated: Cita) => this.citaActualizada.emit(updated),
      error: () => {}
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  irASiguiente(): void {
    this.errorMsg = '';
    if (this.paso === 1) {
      if (this.step1.hasFormulario && !this.step1.guardado) {
        this.step1.iniciarGuardado();
      } else {
        this.avanzarAMediciones();
      }
      return;
    }
    if (this.paso === 2) {
      if (this.step2.hasFormulario && !this.step2.guardado) {
        this.step2.iniciarGuardado();
      } else {
        this.paso = 3;
      }
      return;
    }
    // Paso 3 (Dieta) en primera consulta: guardar dieta y avanzar a imágenes
    if (this.paso === 3 && this.esPrimeraConsulta) {
      if (!this.step3.guardado) {
        this.shouldNavigateToDieta = true;
        this.step3.iniciarGuardado();
      } else {
        this.paso = 4;
      }
      return;
    }
    if (this.paso < 5) this.paso++;
  }

  irAnterior(): void {
    if (this.paso > 1) { this.paso--; this.errorMsg = ''; }
  }

  private avanzarAMediciones(): void {
    this.paso = 2;
  }

  omitirHistoria(): void {
    this.step1.omitir();
    this.avanzarAMediciones();
  }

  omitirMediciones(): void {
    this.step2.omitir();
    this.paso = 3;
  }

  omitirDieta(): void {
    this.step3.omitir();
    this.paso = 4;
  }

  onDietaGuardada(dieta: NutricionDietaPaciente): void {
    this.dieta = dieta;
    if (this.shouldNavigateToDieta) {
      this.shouldNavigateToDieta = false;
      this.paso = 4;
    }
    // else: stay on step 3 so the user can continue filling preferencias
  }

  onDietaError(msg: string): void { this.errorMsg = msg; }

  // ── Step event handlers ──────────────────────────────────────────────────

  onHistoriaGuardada(): void    { this.avanzarAMediciones(); }
  onHistoriaError(msg: string): void { this.errorMsg = msg; }

  onMedicionesGuardadas(): void     { this.paso = 3; }
  onMedicionesError(msg: string): void { this.errorMsg = msg; }

  onCaloriasCalculadas(kcal: number): void { this.caloriasObjetivo = kcal; }

  onDatosNutricionales(datos: DatosNutricionales): void { this.datosNutricion = datos; }

  // ── Imagen upload (paso 4) ────────────────────────────────────────────────

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
        // Navigate to the diet detail if one was created
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
    if (this.paso === 1) return !!(this.step1?.isBusy || this.step1?.isLoading);
    if (this.paso === 2) return !!(this.step2?.isBusy || this.step2?.isLoading);
    if (this.paso === 3) return !!this.step3?.isBusy;
    if (this.paso === 4) return this.isUploadingImagen;
    return false;
  }

  get navShowSave(): boolean {
    if (this.paso === 1) return !!(this.step1?.hasFormulario && !this.step1?.guardado);
    if (this.paso === 2) return !!(this.step2?.hasFormulario && !this.step2?.guardado);
    if (this.paso === 3 && this.esPrimeraConsulta) return !this.step3?.guardado;
    return false;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  nombrePaciente(): string {
    if (this.cita.paciente) return `${this.cita.paciente.nombres} ${this.cita.paciente.apellidos}`;
    if (this.cita.id_paciente === 0) return 'Paciente anónimo';
    return `Paciente #${this.cita.id_paciente}`;
  }
}
