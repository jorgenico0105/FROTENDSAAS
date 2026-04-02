import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cita, ESTADO_COLORS, ESTADO_DOT } from '../../../../../core/models/agenda.model';

type Filtro = 'hoy' | 'semanal' | 'mensual';

@Component({
  selector: 'app-citas-lista',
  standalone: true,
  imports: [NgClass, FormsModule],
  templateUrl: './citas-lista.component.html'
})
export class CitasListaComponent {
  @Input() citas: Cita[]   = [];
  @Input() isLoading       = false;
  @Input() totalItems      = 0;
  @Input() statHoy         = 0;
  @Input() statPendientes  = 0;
  @Input() statConfirmadas = 0;
  @Input() statAtendidas   = 0;

  @Output() confirmar     = new EventEmitter<Cita>();
  @Output() cancelar      = new EventEmitter<Cita>();
  @Output() iniciarSesion = new EventEmitter<Cita>();
  @Output() eliminar      = new EventEmitter<Cita>();

  filtro: Filtro = 'hoy';
  search = '';
  estadoFilter = '';

  // Pagination
  page = 1;
  pageSize = 15;

  readonly ESTADO_COLORS = ESTADO_COLORS;
  readonly ESTADO_DOT    = ESTADO_DOT;

  setFiltro(f: Filtro): void {
    this.filtro = f;
    this.page = 1;
  }

  onSearchChange(): void { this.page = 1; }
  onEstadoChange(): void { this.page = 1; }

  // ── Filtrado client-side ───────────────────────────────────────────────────
  get citasFiltradas(): Cita[] {
    const today     = this.dateStr(new Date());
    const mesPrefix = today.substring(0, 7);

    const monDate = new Date();
    monDate.setDate(monDate.getDate() - (monDate.getDay() + 6) % 7);
    const semStart = this.dateStr(monDate);
    const sunDate = new Date(monDate);
    sunDate.setDate(sunDate.getDate() + 6);
    const semEnd = this.dateStr(sunDate);

    let result = this.citas;

    switch (this.filtro) {
      case 'hoy':
        result = result.filter(c => c.fecha.substring(0, 10) === today);
        break;
      case 'semanal':
        result = result.filter(c => {
          const f = c.fecha.substring(0, 10);
          return f >= semStart && f <= semEnd;
        });
        break;
      case 'mensual':
        result = result.filter(c => c.fecha.startsWith(mesPrefix));
        break;
    }

    if (this.search) {
      const q = this.search.toLowerCase();
      result = result.filter(c => this.nombrePaciente(c).toLowerCase().includes(q));
    }

    if (this.estadoFilter) {
      result = result.filter(c => c.estado_cita?.codigo === this.estadoFilter);
    }

    return result;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.citasFiltradas.length / this.pageSize));
  }

  get citasPaginadas(): Cita[] {
    const start = (this.page - 1) * this.pageSize;
    return this.citasFiltradas.slice(start, start + this.pageSize);
  }

  get pageRange(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const cur = this.page;
    let start = Math.max(1, cur - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goTo(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.page = p;
  }

  get filtroLabel(): string {
    const n = this.citasFiltradas.length;
    return `${n} cita${n !== 1 ? 's' : ''}`;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  estadoClass(c: Cita): string { return ESTADO_COLORS[c.estado_cita?.codigo ?? ''] ?? 'bg-gray-100 text-gray-600'; }
  dotClass(c: Cita): string    { return ESTADO_DOT[c.estado_cita?.codigo ?? ''] ?? 'bg-gray-400'; }

  nombrePaciente(c: Cita): string {
    if (c.paciente) return `${c.paciente.nombres} ${c.paciente.apellidos}`;
    if (c.id_paciente === 0 && c.pre_paciente_id != null) return `${c['pre-paciente']?.nombres} ${c['pre-paciente']?.apellidos}`;
    if (c.id_paciente === 0) return 'Sin paciente asignado';
    return `Paciente #${c.id_paciente}`;
  }

  inicialesPaciente(c: Cita): string {
    if (c.paciente) return (c.paciente.nombres.charAt(0) + c.paciente.apellidos.charAt(0)).toUpperCase();
    return '?';
  }

  formatHora(h: string): string  { return h?.substring(0, 5) ?? '—'; }

  formatFecha(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  puedeConfirmar(c: Cita): boolean { return c.estado_cita?.codigo === 'PE'; }
  puedeIniciar(c: Cita): boolean   { return ['PE','CF'].includes(c.estado_cita?.codigo ?? ''); }
  puedeCancelar(c: Cita): boolean  { return ['PE','CF'].includes(c.estado_cita?.codigo ?? ''); }

  private dateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}
