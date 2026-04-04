import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { FormulariosService } from '../../../../../../../core/services/formularios.service';
import { NutricionService } from '../../../../../../../core/services/nutricion.service';
import {
  FormularioDetalle, CreateHistoriaRequest, CreateHistoriaRespuestaRequest
} from '../../../../../../../core/models/formulario.model';
import {
  CalcularFormulasRequest, CreateProgresoRequest, DatosNutricionales, NutricionFormulasResult
} from '../../../../../../../core/models/nutricion.model';

@Component({
  selector: 'app-paso-mediciones',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './paso-mediciones.component.html'
})
export class PasoMedicionesComponent implements OnChanges {
  @Input() pacienteId = 0;
  @Input() medicoId   = 0;
  @Input() set activo(val: boolean) {
    if (val && !this.formulario && !this.isLoading) this.cargar();
  }

  @Output() guardadoOk          = new EventEmitter<void>();
  @Output() guardadoError       = new EventEmitter<string>();
  @Output() caloriasCalculadas  = new EventEmitter<number>();
  @Output() datosNutricionales  = new EventEmitter<DatosNutricionales>();

  formulario: FormularioDetalle | null = null;
  isLoading  = false;
  isBusy     = false;
  guardado   = false;
  respuestasMap: Record<number, string> = {};

  isAutoCalcRunning = false;
  formulasResult: NutricionFormulasResult | null = null;

  sexoPaciente: 'M' | 'F' = 'M';
  edadPaciente?: number;
  factorActividad = 1.55;

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

  // Bienestar fields (not part of the formulario, saved directly to progreso)
  progresoSueno?: number;
  progresoHidratacion?: number;
  progresoEnergia?: number;
  progresoPctCumplimiento?: number;
  progresoNotas = '';

  get hasFormulario(): boolean { return this.formulario !== null; }

  constructor(
    private formulariosSvc: FormulariosService,
    private nutricionSvc:   NutricionService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pacienteId'] && changes['pacienteId'].currentValue > 0
        && changes['pacienteId'].previousValue === 0 && this.formulario === null) {
      // no auto-load: mediciones loads lazily via activo input
    }
  }

  cargar(): void {
    this.isLoading = true;
    this.formulariosSvc.getMedicionesForm().subscribe({
      next: (d: FormularioDetalle) => {
        this.formulario = d;
        this.buildRoleMap(d);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  private buildRoleMap(form: FormularioDetalle): void {
    this.alturaQId = 0; this.pesoQId = 0; this.cinturaQId = 0;
    this.caderaQId = 0; this.imcQId  = 0; this.iccQId    = 0; this.rmbQId = 0;
    this.grasaQId = 0; this.masaMuscularQId = 0; this.pechoQId = 0;
    this.brazoQId = 0; this.musloQId = 0;
    for (const p of form.preguntas) {
      const q = p.pregunta.toLowerCase();
      if      (q.includes('estatura') || q.includes('altura'))  this.alturaQId       = p.id;
      else if (q.includes('peso'))                               this.pesoQId         = p.id;
      else if (q.includes('cintura'))                            this.cinturaQId      = p.id;
      else if (q.includes('cadera'))                             this.caderaQId       = p.id;
      else if (q.includes('imc'))                                this.imcQId          = p.id;
      else if (q.includes('icc'))                                this.iccQId          = p.id;
      else if (q.includes('rmb') || q.includes('tmb'))           this.rmbQId          = p.id;
      else if (q.includes('grasa'))                              this.grasaQId        = p.id;
      else if (q.includes('masa') || q.includes('muscul'))       this.masaMuscularQId = p.id;
      else if (q.includes('pecho'))                              this.pechoQId        = p.id;
      else if (q.includes('brazo'))                              this.brazoQId        = p.id;
      else if (q.includes('muslo'))                              this.musloQId        = p.id;
    }
  }

  onMedicionInput(qId: number): void {
    const triggerIds = [this.alturaQId, this.pesoQId, this.cinturaQId, this.caderaQId].filter(id => id > 0);
    if (!triggerIds.includes(qId)) return;
    const altura = parseFloat(this.respuestasMap[this.alturaQId] ?? '');
    const peso   = parseFloat(this.respuestasMap[this.pesoQId]   ?? '');
    if (!altura || !peso) return;

    const req: CalcularFormulasRequest = {
      sexo: this.sexoPaciente,
      edad_anos: this.edadPaciente,
      altura_cm: altura,
      peso_kg: peso,
      factor_actividad: this.factorActividad,
    };
    const cintura = parseFloat(this.respuestasMap[this.cinturaQId] ?? '');
    const cadera  = parseFloat(this.respuestasMap[this.caderaQId]  ?? '');
    if (cintura > 0) req.cintura_cm = cintura;
    if (cadera  > 0) req.cadera_cm  = cadera;

    this.isAutoCalcRunning = true;
    this.nutricionSvc.calcularFormulas(req).subscribe({
      next: (res: NutricionFormulasResult) => {
        this.formulasResult = res;
        if (res.imc != null && this.imcQId) this.respuestasMap[this.imcQId] = res.imc.toFixed(1);
        if (res.icc != null && this.iccQId) this.respuestasMap[this.iccQId] = res.icc.toFixed(2);
        const cal = res.tmb ?? res.tmb;
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

  toggleMulti(preguntaId: number, valor: string, checked: boolean): void {
    const parts = (this.respuestasMap[preguntaId] ?? '').split(',').filter(Boolean);
    if (checked) { if (!parts.includes(valor)) parts.push(valor); }
    else { const i = parts.indexOf(valor); if (i >= 0) parts.splice(i, 1); }
    this.respuestasMap[preguntaId] = parts.join(',');
  }

  isChecked(preguntaId: number, valor: string): boolean {
    return (this.respuestasMap[preguntaId] ?? '').split(',').includes(valor);
  }

  omitir(): void { this.guardado = true; }

  iniciarGuardado(): void {
    if (!this.formulario) {
      this.saveProgreso();
      return;
    }
    this.isBusy = true;
    const req: CreateHistoriaRequest = {
      medico_id: this.medicoId,
      formulario_id: this.formulario.formulario.id,
      fecha: this.todayStr(),
      preguntas: this.buildRespuestas()
    };
    this.formulariosSvc.submitHistoria(this.pacienteId, req).subscribe({
      next: () => {
        this.isBusy = false;
        this.guardado = true;
        this.saveProgreso();
      },
      error: (err: { error?: { message?: string } }) => {
        this.isBusy = false;
        this.guardadoError.emit(err?.error?.message || 'Error al guardar las mediciones.');
      }
    });
  }

  private saveProgreso(): void {
    if (!this.pacienteId) { this.guardadoOk.emit(); return; }
    const req = this.buildProgresoRequest();
    this.nutricionSvc.addProgreso(this.pacienteId, req).subscribe({
      next: () => this.guardadoOk.emit(),
      error: () => this.guardadoOk.emit(), // progreso failure shouldn't block the wizard
    });
  }

  private buildProgresoRequest(): CreateProgresoRequest {
    const parseF = (id: number): number | undefined => {
      const v = parseFloat(this.respuestasMap[id] ?? '');
      return isNaN(v) ? undefined : v;
    };
    return {
      fecha:                 this.todayStr(),
      peso_kg:               this.pesoQId         ? parseF(this.pesoQId)         : undefined,
      altura_cm:             this.alturaQId        ? parseF(this.alturaQId)       : undefined,
      cintura_cm:            this.cinturaQId       ? parseF(this.cinturaQId)      : undefined,
      cadera_cm:             this.caderaQId        ? parseF(this.caderaQId)       : undefined,
      grasa_corporal_pct:    this.grasaQId         ? parseF(this.grasaQId)        : undefined,
      masa_muscular_kg:      this.masaMuscularQId  ? parseF(this.masaMuscularQId) : undefined,
      pecho_cm:              this.pechoQId         ? parseF(this.pechoQId)        : undefined,
      brazo_cm:              this.brazoQId         ? parseF(this.brazoQId)        : undefined,
      muslo_cm:              this.musloQId         ? parseF(this.musloQId)        : undefined,
      hidratacion_litros:    this.progresoHidratacion,
      sueno_horas:           this.progresoSueno,
      energia_nivel:         this.progresoEnergia,
      pct_cumplimiento_dieta: this.progresoPctCumplimiento,
      notas:                 this.progresoNotas || undefined,
    };
  }

  private buildRespuestas(): CreateHistoriaRespuestaRequest[] {
    return (this.formulario?.preguntas ?? []).map(p => {
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
