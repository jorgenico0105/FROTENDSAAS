import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { FormulariosService } from '../../../../../../../core/services/formularios.service';
import { PacientesService } from '../../../../../../../core/services/pacientes.service';
import {
  Formulario, FormularioDetalle, CreateHistoriaRequest, CreateHistoriaRespuestaRequest
} from '../../../../../../../core/models/formulario.model';
import { Paciente } from '../../../../../../../core/models/pacientes.model';

@Component({
  selector: 'app-paso-historia',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './paso-historia.component.html'
})
export class PasoHistoriaComponent implements OnInit {
  @Input() pacienteId = 0;
  @Input() medicoId   = 0;

  @Output() guardadoOk    = new EventEmitter<void>();
  @Output() guardadoError = new EventEmitter<string>();

  formulario: FormularioDetalle | null = null;
  isLoading  = false;
  isBusy     = false;
  guardado   = false;
  respuestasMap: Record<number, string> = {};
  observacion = '';

  get hasFormulario(): boolean { return this.formulario !== null; }

  constructor(
    private formulariosSvc: FormulariosService,
    private pacientesSvc: PacientesService
  ) {}

  ngOnInit(): void {
    if (this.pacienteId > 0) this.cargar();
  }

  cargar(): void {
    this.isLoading = true;
    this.formulariosSvc.getHistoriaClinicaForm().subscribe({
      next: (forms: Formulario[]) => {
        if (forms.length === 0) { this.isLoading = false; return; }
        this.formulariosSvc.get(forms[0].id).subscribe({
          next: (d: FormularioDetalle) => {
            this.formulario = d;
            this.isLoading = false;
            this.autoFillPaciente();
          },
          error: () => { this.isLoading = false; }
        });
      },
      error: () => { this.isLoading = false; }
    });
  }

  private autoFillPaciente(): void {
    if (!this.formulario || !this.pacienteId) return;
    this.pacientesSvc.get(this.pacienteId).subscribe({
      next: (p: Paciente) => this.fillFromPaciente(p),
      error: () => {}
    });
  }

  private fillFromPaciente(p: Paciente): void {
    for (const pregunta of (this.formulario?.preguntas ?? [])) {
      if (this.respuestasMap[pregunta.id]) continue; // no sobreescribir
      const q = pregunta.pregunta.toLowerCase();
      if (p.fecha_nacimiento && (q.includes('nacimiento') || q.includes('fecha nac'))) {
        this.respuestasMap[pregunta.id] = p.fecha_nacimiento.substring(0, 10);
      } else if (p.fecha_nacimiento && q.includes('edad')) {
        this.respuestasMap[pregunta.id] = String(this.calcEdad(p.fecha_nacimiento));
      } else if (p.sexo && (q.includes('sexo') || q.includes('género') || q.includes('genero'))) {
        this.respuestasMap[pregunta.id] = p.sexo;
      } else if (p.telefono && (q.includes('telefono') || q.includes('teléfono') || q.includes('celular') || q.includes('móvil') || q.includes('movil'))) {
        this.respuestasMap[pregunta.id] = p.telefono;
      } else if (p.direccion && (q.includes('dirección') || q.includes('direccion') || q.includes('domicilio') || q.includes('residencia'))) {
        this.respuestasMap[pregunta.id] = p.direccion;
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

  iniciarGuardado(): void {
    if (!this.formulario) { this.guardadoOk.emit(); return; }
    this.isBusy = true;
    const req: CreateHistoriaRequest = {
      medico_id: this.medicoId,
      formulario_id: this.formulario.formulario.id,
      fecha: this.todayStr(),
      observacion_general: this.observacion,
      preguntas: this.buildRespuestas()
    };
    this.formulariosSvc.submitHistoria(this.pacienteId, req).subscribe({
      next: () => { this.isBusy = false; this.guardado = true; this.guardadoOk.emit(); },
      error: (err: { error?: { message?: string } }) => {
        this.isBusy = false;
        this.guardadoError.emit(err?.error?.message || 'Error al guardar la historia clínica.');
      }
    });
  }

  omitir(): void { this.guardado = true; }

  toggleMulti(preguntaId: number, valor: string, checked: boolean): void {
    const parts = (this.respuestasMap[preguntaId] ?? '').split(',').filter(Boolean);
    if (checked) { if (!parts.includes(valor)) parts.push(valor); }
    else { const i = parts.indexOf(valor); if (i >= 0) parts.splice(i, 1); }
    this.respuestasMap[preguntaId] = parts.join(',');
  }

  isChecked(preguntaId: number, valor: string): boolean {
    return (this.respuestasMap[preguntaId] ?? '').split(',').includes(valor);
  }

  private buildRespuestas(): CreateHistoriaRespuestaRequest[] {
    return (this.formulario?.preguntas ?? []).map((p: FormularioDetalle['preguntas'][0]) => {
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
