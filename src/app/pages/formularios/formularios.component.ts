import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { FormulariosService } from '../../core/services/formularios.service';
import {
  Formulario, FormularioDetalle, FormularioPregunta, TipoFormulario,
  CreateFormularioRequest, CreatePreguntaRequest, TipoRespuesta,
  TIPO_RESPUESTA_LABELS
} from '../../core/models/formulario.model';

type Vista = 'lista' | 'editor' | 'detalle';

interface PreguntaUI extends CreatePreguntaRequest {
  _id: number;                    // id local para tracking
  opcionesTexto: string;          // join de opciones para SELECT/MULTISELECT (etiquetas separadas por coma)
}

@Component({
  selector: 'app-formularios',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './formularios.component.html'
})
export class FormulariosComponent implements OnInit {

  // ── Vista ──────────────────────────────────────────────────────────────────
  vista: Vista = 'lista';
  errorMsg  = '';
  successMsg = '';

  // ── Lista ──────────────────────────────────────────────────────────────────
  formularios: Formulario[] = [];
  isLoading = false;

  // ── Detalle ────────────────────────────────────────────────────────────────
  detalle: FormularioDetalle | null = null;
  isLoadingDetalle = false;

  // ── Editor ─────────────────────────────────────────────────────────────────
  editingId: number | null = null;   // null = crear, número = editar
  isSubmitting = false;

  formNombre      = '';
  formDescripcion = '';
  formTipoId      = 0;

  preguntas: PreguntaUI[] = [];
  private _nextId = 0;

  tiposFormulario: TipoFormulario[] = [];

  readonly TIPOS_RESPUESTA = Object.entries(TIPO_RESPUESTA_LABELS) as [TipoRespuesta, string][];
  readonly TIPO_LABELS = TIPO_RESPUESTA_LABELS;

  constructor(private svc: FormulariosService) {}

  ngOnInit(): void {
    this.loadList();
    this.svc.listTipos().subscribe({ next: t => this.tiposFormulario = t });
  }

  // ── Lista ──────────────────────────────────────────────────────────────────

  loadList(): void {
    this.isLoading = true;
    this.svc.list().subscribe({
      next: data => { this.formularios = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  // ── Detalle ────────────────────────────────────────────────────────────────

  verDetalle(f: Formulario): void {
    this.isLoadingDetalle = true;
    this.vista = 'detalle';
    this.errorMsg = '';
    this.svc.get(f.id).subscribe({
      next: d => { this.detalle = d; this.isLoadingDetalle = false; },
      error: () => { this.isLoadingDetalle = false; this.errorMsg = 'Error al cargar el formulario.'; }
    });
  }

  getPreguntaOpciones(p: FormularioPregunta): string {
    if (!this.detalle) return '';
    const opts = this.detalle.opciones[p.id] ?? [];
    return opts.map(o => o.etiqueta).join(', ');
  }

  // ── Editor: Crear ──────────────────────────────────────────────────────────

  abrirCrear(): void {
    this.editingId      = null;
    this.formNombre     = '';
    this.formDescripcion = '';
    this.formTipoId     = this.tiposFormulario[0]?.id ?? 0;
    this.preguntas      = [];
    this.errorMsg       = '';
    this.vista = 'editor';
  }

  // ── Editor: Editar ─────────────────────────────────────────────────────────

  abrirEditar(f: Formulario): void {
    this.isLoadingDetalle = true;
    this.errorMsg = '';
    this.svc.get(f.id).subscribe({
      next: d => {
        this.editingId       = f.id;
        this.formNombre      = d.formulario.nombre;
        this.formDescripcion = d.formulario.descripcion ?? '';
        this.formTipoId      = d.formulario.tipo_formulario_id;
        this.preguntas       = d.preguntas.map(p => ({
          _id:           this._nextId++,
          pregunta:      p.pregunta,
          tipo_respuesta: p.tipo_respuesta,
          obligatorio:   p.obligatorio,
          orden:         p.orden,
          opciones:      d.opciones[p.id] ?? [],
          opcionesTexto: (d.opciones[p.id] ?? []).map(o => o.etiqueta).join(', ')
        }));
        this.isLoadingDetalle = false;
        this.vista = 'editor';
      },
      error: () => { this.isLoadingDetalle = false; this.errorMsg = 'Error al cargar formulario.'; }
    });
  }

  // ── Editor: Preguntas ──────────────────────────────────────────────────────

  addPregunta(): void {
    this.preguntas.push({
      _id: this._nextId++,
      pregunta: '',
      tipo_respuesta: 'TEXT',
      obligatorio: false,
      orden: this.preguntas.length,
      opciones: [],
      opcionesTexto: ''
    });
  }

  removePregunta(idx: number): void {
    this.preguntas.splice(idx, 1);
  }

  moverArriba(idx: number): void {
    if (idx === 0) return;
    [this.preguntas[idx - 1], this.preguntas[idx]] = [this.preguntas[idx], this.preguntas[idx - 1]];
  }

  moverAbajo(idx: number): void {
    if (idx === this.preguntas.length - 1) return;
    [this.preguntas[idx + 1], this.preguntas[idx]] = [this.preguntas[idx], this.preguntas[idx + 1]];
  }

  necesitaOpciones(tipo: TipoRespuesta): boolean {
    return tipo === 'SELECT' || tipo === 'MULTISELECT';
  }

  // ── Editor: Submit ─────────────────────────────────────────────────────────

  submit(): void {
    if (!this.formNombre.trim()) { this.errorMsg = 'El nombre es requerido.'; return; }
    if (!this.formTipoId)        { this.errorMsg = 'Selecciona el tipo de formulario.'; return; }
    for (const p of this.preguntas) {
      if (!p.pregunta.trim()) { this.errorMsg = 'Todas las preguntas deben tener texto.'; return; }
      if (this.necesitaOpciones(p.tipo_respuesta) && !p.opcionesTexto.trim()) {
        this.errorMsg = `La pregunta "${p.pregunta}" (${p.tipo_respuesta}) requiere opciones separadas por coma.`; return;
      }
    }

    this.isSubmitting = true;
    this.errorMsg = '';

    const preguntasReq: CreatePreguntaRequest[] = this.preguntas.map((p, i) => ({
      pregunta:      p.pregunta.trim(),
      tipo_respuesta: p.tipo_respuesta,
      obligatorio:   p.obligatorio,
      orden:         i,
      opciones:      this.necesitaOpciones(p.tipo_respuesta)
        ? p.opcionesTexto.split(',').map((e, j) => ({ valor: e.trim().toLowerCase().replace(/\s+/g, '_'), etiqueta: e.trim(), orden: j }))
        : []
    }));

    if (this.editingId) {
      this.svc.update(this.editingId, {
        nombre: this.formNombre, descripcion: this.formDescripcion, preguntas: preguntasReq
      }).subscribe({
        next: () => this.onSaved('Formulario actualizado'),
        error: err => { this.errorMsg = err?.error?.message || 'Error al actualizar.'; this.isSubmitting = false; }
      });
    } else {
      const req: CreateFormularioRequest = {
        nombre: this.formNombre, descripcion: this.formDescripcion,
        tipo_formulario_id: this.formTipoId, preguntas: preguntasReq
      };
      this.svc.create(req).subscribe({
        next: () => this.onSaved('Formulario creado'),
        error: err => { this.errorMsg = err?.error?.message || 'Error al crear.'; this.isSubmitting = false; }
      });
    }
  }

  private onSaved(msg: string): void {
    this.isSubmitting = false;
    this.successMsg   = msg;
    this.loadList();
    this.setVista('lista');
    setTimeout(() => this.successMsg = '', 4000);
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────

  eliminar(f: Formulario): void {
    if (!confirm(`¿Eliminar "${f.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.svc.delete(f.id).subscribe({
      next: () => {
        this.formularios = this.formularios.filter(x => x.id !== f.id);
        this.successMsg = 'Formulario eliminado';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.errorMsg = 'Error al eliminar el formulario.'; }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  setVista(v: Vista): void {
    this.vista    = v;
    this.errorMsg = '';
  }

  tipoNombre(id: number): string {
    return this.tiposFormulario.find(t => t.id === id)?.nombre ?? '—';
  }

  formatFecha(s: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  tipoBadgeClass(codigo: string): string {
    const map: Record<string, string> = {
      HCL: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
      ANM: 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
      SEG: 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
      TST: 'bg-info-50 text-info-600 dark:bg-info-900/20 dark:text-info-400',
    };
    return map[codigo] ?? 'bg-gray-100 text-gray-600';
  }

  tipoCodigo(id: number): string {
    return this.tiposFormulario.find(t => t.id === id)?.codigo ?? '';
  }

  tipoIcono(codigo: string): string {
    const map: Record<string, string> = {
      HCL: 'ri-heart-pulse-line',
      ANM: 'ri-mental-health-line',
      SEG: 'ri-shield-cross-line',
      TST: 'ri-test-tube-line',
    };
    return map[codigo] ?? 'ri-file-list-3-line';
  }

  tipoHeaderClass(codigo: string): string {
    const map: Record<string, string> = {
      HCL: 'bg-gradient-to-br from-primary-50 to-primary-100/40 dark:from-primary-900/20 dark:to-primary-900/10 border-primary-100 dark:border-primary-900/30',
      ANM: 'bg-gradient-to-br from-warning-50 to-warning-100/40 dark:from-warning-900/20 dark:to-warning-900/10 border-warning-100 dark:border-warning-900/30',
      SEG: 'bg-gradient-to-br from-success-50 to-success-100/40 dark:from-success-900/20 dark:to-success-900/10 border-success-100 dark:border-success-900/30',
      TST: 'bg-gradient-to-br from-info-50 to-info-100/40 dark:from-info-900/20 dark:to-info-900/10 border-info-100 dark:border-info-900/30',
    };
    return map[codigo] ?? 'bg-gradient-to-br from-gray-50 to-gray-100/40 dark:from-gray-800/20 dark:to-gray-800/10 border-gray-100 dark:border-[#1b2c4f]';
  }

  tipoIconBgClass(codigo: string): string {
    const map: Record<string, string> = {
      HCL: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
      ANM: 'bg-warning-100 dark:bg-warning-900/40 text-warning-600 dark:text-warning-400',
      SEG: 'bg-success-100 dark:bg-success-900/40 text-success-600 dark:text-success-400',
      TST: 'bg-info-100 dark:bg-info-900/40 text-info-600 dark:text-info-400',
    };
    return map[codigo] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400';
  }
}
