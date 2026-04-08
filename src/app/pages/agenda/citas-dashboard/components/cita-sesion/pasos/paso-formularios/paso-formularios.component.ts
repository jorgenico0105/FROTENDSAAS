import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormulariosService } from '../../../../../../../core/services/formularios.service';
import { NutricionService } from '../../../../../../../core/services/nutricion.service';
import { PacientesService } from '../../../../../../../core/services/pacientes.service';
import {
  FormularioCitaAsignacion, CreateHistoriaRequest, CreateHistoriaRespuestaRequest
} from '../../../../../../../core/models/formulario.model';
import {
  CalcularFormulasRequest, CreateProgresoRequest, DatosNutricionales, NutricionFormulasResult
} from '../../../../../../../core/models/nutricion.model';
import { Paciente } from '../../../../../../../core/models/pacientes.model';

@Component({
  selector: 'app-paso-formularios',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './paso-formularios.component.html'
})
export class PasoFormulariosComponent implements OnInit {
  @Input() pacienteId = 0;
  @Input() medicoId   = 0;
  @Input() formularios: FormularioCitaAsignacion[] = [];

  @Output() guardadoOk         = new EventEmitter<void>();
  @Output() guardadoError      = new EventEmitter<string>();
  @Output() caloriasCalculadas = new EventEmitter<number>();
  @Output() datosNutricionales = new EventEmitter<DatosNutricionales>();

  // ── Sub-navegación entre formularios ────────────────────────────────────
  formularioActualIdx = 0;

  get formularioActual(): FormularioCitaAsignacion | null {
    return this.formularios[this.formularioActualIdx] ?? null;
  }
  get esPrimerFormulario(): boolean { return this.formularioActualIdx === 0; }
  get esUltimoFormulario(): boolean { return this.formularioActualIdx === this.formularios.length - 1; }

  siguienteFormulario(): void {
    if (!this.esUltimoFormulario) this.formularioActualIdx++;
  }

  anteriorFormulario(): void {
    if (!this.esPrimerFormulario) this.formularioActualIdx--;
  }

  // ── Estado ───────────────────────────────────────────────────────────────
  respuestasMap: Record<number, string>  = {};
  observacionMap: Record<number, string> = {};
  isBusy   = false;
  guardado = false;

  // ── Detección de mediciones ──────────────────────────────────────────────
  alturaQId       = 0;
  pesoQId         = 0;
  cinturaQId      = 0;
  caderaQId       = 0;
  imcQId          = 0;
  iccQId          = 0;
  rmbQId          = 0;
  grasaQId        = 0;
  masaMuscularQId = 0;
  pechoQId        = 0;
  brazoQId        = 0;
  musloQId        = 0;

  /** IDs de preguntas de medición que pertenecen a cada formulario */
  private medicionesPerForm: Record<number, boolean> = {};

  isAutoCalcRunning = false;
  sexoPaciente: 'M' | 'F' = 'M';
  edadPaciente?: number;
  factorActividad = 1.55;

  get hasMedicionesTotal(): boolean { return this.alturaQId > 0 || this.pesoQId > 0; }

  /** ¿El formulario ACTIVO contiene campos de medición? */
  get hasMedicionesActual(): boolean {
    return !!(this.formularioActual && this.medicionesPerForm[this.formularioActual.formulario_id]);
  }

  get hasFormulario(): boolean { return this.formularios.length > 0; }

  constructor(
    private formulariosSvc: FormulariosService,
    private nutricionSvc:   NutricionService,
    private pacientesSvc:   PacientesService
  ) {}

  ngOnInit(): void {
    this.buildMedicionesRoleMap();
    if (this.pacienteId > 0) this.autoFillPaciente();
  }

  // ── Detección ────────────────────────────────────────────────────────────

  private buildMedicionesRoleMap(): void {
    for (const asig of this.formularios) {
      let tieneMediciones = false;
      for (const p of asig.formulario.preguntas) {
        const q = p.pregunta.toLowerCase();
        if      (q.includes('estatura') || q.includes('altura'))  { this.alturaQId       = p.id; tieneMediciones = true; }
        else if (q.includes('peso'))                               { this.pesoQId         = p.id; tieneMediciones = true; }
        else if (q.includes('cintura'))                            { this.cinturaQId      = p.id; tieneMediciones = true; }
        else if (q.includes('cadera'))                             { this.caderaQId       = p.id; tieneMediciones = true; }
        else if (q.includes('imc'))                                { this.imcQId          = p.id; }
        else if (q.includes('icc'))                                { this.iccQId          = p.id; }
        else if (q.includes('rmb') || q.includes('tmb'))           { this.rmbQId          = p.id; }
        else if (q.includes('grasa'))                              { this.grasaQId        = p.id; tieneMediciones = true; }
        else if (q.includes('masa') || q.includes('muscul'))       { this.masaMuscularQId = p.id; tieneMediciones = true; }
        else if (q.includes('pecho'))                              { this.pechoQId        = p.id; tieneMediciones = true; }
        else if (q.includes('brazo'))                              { this.brazoQId        = p.id; tieneMediciones = true; }
        else if (q.includes('muslo'))                              { this.musloQId        = p.id; tieneMediciones = true; }
      }
      if (tieneMediciones) this.medicionesPerForm[asig.formulario_id] = true;
    }
  }

  // ── Auto-relleno ─────────────────────────────────────────────────────────

  private autoFillPaciente(): void {
    this.pacientesSvc.get(this.pacienteId).subscribe({
      next: (p: Paciente) => this.fillFromPaciente(p),
      error: () => {}
    });
  }

  private fillFromPaciente(p: Paciente): void {
    for (const asig of this.formularios) {
      for (const pregunta of asig.formulario.preguntas) {
        if (this.respuestasMap[pregunta.id]) continue;
        const q = pregunta.pregunta.toLowerCase();
        if (p.fecha_nacimiento && (q.includes('nacimiento') || q.includes('fecha nac'))) {
          this.respuestasMap[pregunta.id] = p.fecha_nacimiento.substring(0, 10);
        } else if (p.fecha_nacimiento && q.includes('edad')) {
          this.respuestasMap[pregunta.id] = String(this.calcEdad(p.fecha_nacimiento));
        } else if (p.sexo && (q.includes('sexo') || q.includes('género') || q.includes('genero'))) {
          this.respuestasMap[pregunta.id] = p.sexo;
        } else if (p.telefono && (q.includes('telefono') || q.includes('teléfono') || q.includes('celular') || q.includes('móvil') || q.includes('movil'))) {
          this.respuestasMap[pregunta.id] = p.telefono;
        } else if (p.direccion && (q.includes('dirección') || q.includes('direccion') || q.includes('domicilio'))) {
          this.respuestasMap[pregunta.id] = p.direccion;
        }
      }
    }
  }

  private calcEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  // ── Auto-cálculo ─────────────────────────────────────────────────────────

  onMedicionInput(qId: number): void {
    const triggerIds = [this.alturaQId, this.pesoQId, this.cinturaQId, this.caderaQId].filter(id => id > 0);
    if (!triggerIds.includes(qId)) return;
    const altura = parseFloat(this.respuestasMap[this.alturaQId] ?? '');
    const peso   = parseFloat(this.respuestasMap[this.pesoQId]   ?? '');
    if (!altura || !peso) return;

    const req: CalcularFormulasRequest = {
      sexo:             this.sexoPaciente,
      edad_anos:        this.edadPaciente,
      altura_cm:        altura,
      peso_kg:          peso,
      factor_actividad: this.factorActividad,
    };
    const cintura = parseFloat(this.respuestasMap[this.cinturaQId] ?? '');
    const cadera  = parseFloat(this.respuestasMap[this.caderaQId]  ?? '');
    if (cintura > 0) req.cintura_cm = cintura;
    if (cadera  > 0) req.cadera_cm  = cadera;

    this.isAutoCalcRunning = true;
    this.nutricionSvc.calcularFormulas(req).subscribe({
      next: (res: NutricionFormulasResult) => {
        if (res.imc != null && this.imcQId) this.respuestasMap[this.imcQId] = res.imc.toFixed(1);
        if (res.icc != null && this.iccQId) this.respuestasMap[this.iccQId] = res.icc.toFixed(2);
        const cal = res.tmb;
        if (cal != null && this.rmbQId) this.respuestasMap[this.rmbQId] = Math.round(cal).toString();
        if (cal != null) this.caloriasCalculadas.emit(Math.round(cal));
        this.datosNutricionales.emit({
          get_diario: Math.round(res.get ?? res.geb ?? res.tmb ?? 0),
          tmb:        Math.round(res.tmb ?? 0),
          peso_kg:    parseFloat(this.respuestasMap[this.pesoQId] ?? '0'),
          imc:        res.imc ?? undefined,
          sexo:       this.sexoPaciente,
          edad:       this.edadPaciente,
        });
        this.isAutoCalcRunning = false;
      },
      error: () => { this.isAutoCalcRunning = false; }
    });
  }

  isAutoCalcField(qId: number): boolean {
    return qId > 0 && [this.imcQId, this.iccQId, this.rmbQId].includes(qId);
  }

  // ── Multi-select helpers ─────────────────────────────────────────────────

  toggleMulti(preguntaId: number, valor: string, checked: boolean): void {
    const parts = (this.respuestasMap[preguntaId] ?? '').split(',').filter(Boolean);
    if (checked) { if (!parts.includes(valor)) parts.push(valor); }
    else { const i = parts.indexOf(valor); if (i >= 0) parts.splice(i, 1); }
    this.respuestasMap[preguntaId] = parts.join(',');
  }

  isChecked(preguntaId: number, valor: string): boolean {
    return (this.respuestasMap[preguntaId] ?? '').split(',').includes(valor);
  }

  // ── Guardar ──────────────────────────────────────────────────────────────

  omitir(): void { this.guardado = true; }

  iniciarGuardado(): void {
    if (this.formularios.length === 0) { this.guardadoOk.emit(); return; }
    this.isBusy = true;

    const saves$ = this.formularios.map(asig => {
      const req: CreateHistoriaRequest = {
        medico_id:           this.medicoId,
        formulario_id:       asig.formulario_id,
        fecha:               this.todayStr(),
        observacion_general: this.observacionMap[asig.formulario_id] || undefined,
        preguntas:           this.buildRespuestasForForm(asig)
      };
      return this.formulariosSvc.submitHistoria(this.pacienteId, req).pipe(
        catchError(() => of(null))
      );
    });

    forkJoin(saves$).subscribe({
      next: () => {
        this.guardado = true;
        if (this.hasMedicionesTotal && this.pacienteId) {
          this.saveProgreso();
        } else {
          this.isBusy = false;
          this.guardadoOk.emit();
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.isBusy = false;
        this.guardadoError.emit(err?.error?.message || 'Error al guardar los formularios.');
      }
    });
  }

  private saveProgreso(): void {
    const req = this.buildProgresoRequest();
    this.nutricionSvc.addProgreso(this.pacienteId, req).subscribe({
      next: () => { this.isBusy = false; this.guardadoOk.emit(); },
      error: () => { this.isBusy = false; this.guardadoOk.emit(); }
    });
  }

  private buildProgresoRequest(): CreateProgresoRequest {
    const parseF = (id: number): number | undefined => {
      if (!id) return undefined;
      const v = parseFloat(this.respuestasMap[id] ?? '');
      return isNaN(v) ? undefined : v;
    };
    return {
      fecha:              this.todayStr(),
      peso_kg:            parseF(this.pesoQId),
      altura_cm:          parseF(this.alturaQId),
      cintura_cm:         parseF(this.cinturaQId),
      cadera_cm:          parseF(this.caderaQId),
      grasa_corporal_pct: parseF(this.grasaQId),
      masa_muscular_kg:   parseF(this.masaMuscularQId),
      pecho_cm:           parseF(this.pechoQId),
      brazo_cm:           parseF(this.brazoQId),
      muslo_cm:           parseF(this.musloQId),
    };
  }

  private buildRespuestasForForm(asig: FormularioCitaAsignacion): CreateHistoriaRespuestaRequest[] {
    return asig.formulario.preguntas.map(p => {
      const val = this.respuestasMap[p.id] ?? '';
      const r: CreateHistoriaRespuestaRequest = { pregunta_id: p.id };
      if      (p.tipo_respuesta === 'NUMBER') r.respuesta_numero = val !== '' ? parseFloat(val) : null;
      else if (p.tipo_respuesta === 'DATE')   r.respuesta_fecha  = val || null;
      else                                    r.respuesta_texto  = val;
      return r;
    });
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}
