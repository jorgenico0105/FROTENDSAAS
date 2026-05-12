import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, DecimalPipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NutricionService } from '../../../core/services/nutricion.service';
import { PacientesService } from '../../../core/services/pacientes.service';
import { NutricionRegistroComida, NutricionRegistroEjercicio, NutricionProgreso } from '../../../core/models/nutricion.model';
import { Paciente } from '../../../core/models/pacientes.model';
import { SkeletonComponent } from '../../../common/skeleton/skeleton.component';
import { environment } from '../../../../environments/environment';

interface AccesoStats {
  paciente_id: number;
  total_accesos: number;
  ultimo_acceso: string;
}

interface PacienteStats {
  paciente: Paciente;
  accesos: number;
  ultimoAcceso: string;
}

interface DiaBar {
  short: string;
  comidas: number;
  ejercicios: number;
  total: number;
  barH: number;
  comidasPct: number;
  ejerciciosPct: number;
}

@Component({
  selector: 'app-registros-dashboard',
  standalone: true,
  imports: [FormsModule, NgClass, DecimalPipe, SkeletonComponent],
  templateUrl: './registros-dashboard.component.html'
})
export class RegistrosDashboardComponent implements OnInit {
  readonly Math = Math;
  isLoading = false;

  pacientes: Paciente[] = [];
  statsMap: PacienteStats[] = [];

  activeTab: 'paciente' | 'frecuencia' = 'paciente';
  fechaDesde = '';
  fechaHasta = '';

  // ── Per-patient mode ────────────────────────────────────────────────────────
  selectedPacienteId: number | null = null;
  isPacienteLoading = false;
  pacienteComidas: NutricionRegistroComida[] = [];
  pacienteEjercicios: NutricionRegistroEjercicio[] = [];
  pacienteProgreso: NutricionProgreso[] = [];
  pacienteSearch = '';
  pacienteDropdownOpen = false;
  selectedImage: string | null = null;
  readonly apiBase = environment.apiUrl.replace(/\/api\/v\d+$/, '');

  private readonly TIPO_NOMBRES: Record<number, string> = {
    1: 'Desayuno', 2: 'Almuerzo', 3: 'Cena', 4: 'Merienda', 5: 'Snack', 6: 'Otro'
  };
  private readonly TIPO_COLORS: Record<number, string> = {
    1: '#f59e0b', 2: '#3b82f6', 3: '#8b5cf6', 4: '#10b981', 5: '#f97316', 6: '#6b7280'
  };

  constructor(
    private nutricionSvc: NutricionService,
    private pacientesSvc: PacientesService,
  ) {
    const now = new Date();
    const hoy = now.toISOString().split('T')[0];
    const hace30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    this.fechaDesde = hace30;
    this.fechaHasta = hoy;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.statsMap = [];

    this.pacientesSvc.listAll().subscribe({
      next: res => {
        this.pacientes = res.data;
        if (this.pacientes.length === 0) { this.isLoading = false; return; }

        const accesoRequests = this.pacientes.map(p =>
          this.pacientesSvc.getAccesoStats(p.id, this.fechaDesde, this.fechaHasta)
            .pipe(catchError(() => of({ paciente_id: p.id, total_accesos: 0, ultimo_acceso: '' })))
        );

        forkJoin(accesoRequests).subscribe({
          next: accesos => {
            this.buildStats(accesos);
            this.isLoading = false;
          },
          error: () => { this.isLoading = false; }
        });
      },
      error: () => { this.isLoading = false; }
    });
  }

  private buildStats(accesos: AccesoStats[]): void {
    this.statsMap = this.pacientes.map((p, idx) => {
      const acc = accesos[idx] ?? { total_accesos: 0, ultimo_acceso: '' };
      return { paciente: p, accesos: acc.total_accesos, ultimoAcceso: acc.ultimo_acceso };
    }).sort((a, b) => b.accesos - a.accesos);
  }

  // ── Global stats ─────────────────────────────────────────────────────────────

  get totalAccesos(): number {
    return this.statsMap.reduce((s, x) => s + x.accesos, 0);
  }

  get pacientesConAcceso(): number {
    return this.statsMap.filter(s => s.accesos > 0).length;
  }

  get maxAccesos(): number {
    return Math.max(1, this.statsMap[0]?.accesos ?? 1);
  }

  // ── Per-patient helpers ─────────────────────────────────────────────────────

  get pacientesFiltradosList(): Paciente[] {
    if (!this.pacienteSearch) return this.pacientes;
    const q = this.pacienteSearch.toLowerCase();
    return this.pacientes.filter(p =>
      p.nombres.toLowerCase().includes(q) || p.apellidos.toLowerCase().includes(q)
    );
  }

  get selectedPaciente(): Paciente | null {
    return this.pacientes.find(p => p.id === this.selectedPacienteId) ?? null;
  }

  selectPaciente(id: number): void {
    this.selectedPacienteId = id;
    this.pacienteDropdownOpen = false;
    this.loadPacienteData();
  }

  clearPaciente(): void {
    this.selectedPacienteId = null;
    this.pacienteSearch = '';
    this.pacienteComidas = [];
    this.pacienteEjercicios = [];
    this.pacienteProgreso = [];
  }

  loadPacienteData(): void {
    if (!this.selectedPacienteId) return;
    this.isPacienteLoading = true;
    const params = { desde: this.fechaDesde, hasta: this.fechaHasta };
    forkJoin({
      comidas: this.nutricionSvc.listRegistrosComida(this.selectedPacienteId, params).pipe(catchError(() => of([]))),
      ejercicios: this.nutricionSvc.listRegistrosEjercicio(this.selectedPacienteId, params).pipe(catchError(() => of([]))),
      progreso: this.nutricionSvc.listProgreso(this.selectedPacienteId).pipe(catchError(() => of([]))),
    }).subscribe({
      next: res => {
        this.pacienteComidas = res.comidas;
        this.pacienteEjercicios = res.ejercicios;
        this.pacienteProgreso = res.progreso;
        this.isPacienteLoading = false;
      },
      error: () => { this.isPacienteLoading = false; }
    });
  }

  // ── Comida charts ───────────────────────────────────────────────────────────

  get pacienteFrecSemana(): DiaBar[] {
    const SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const cArr = [0, 0, 0, 0, 0, 0, 0];
    const eArr = [0, 0, 0, 0, 0, 0, 0];
    this.pacienteComidas.forEach(r => {
      cArr[new Date(r.fecha.substring(0, 10) + 'T12:00:00').getDay()]++;
    });
    this.pacienteEjercicios.forEach(r => {
      eArr[new Date(r.fecha.substring(0, 10) + 'T12:00:00').getDay()]++;
    });
    const totals = SHORT.map((_, i) => cArr[i] + eArr[i]);
    const max = Math.max(1, ...totals);
    return SHORT.map((short, i) => ({
      short, comidas: cArr[i], ejercicios: eArr[i], total: totals[i],
      barH: Math.max(2, Math.round((totals[i] / max) * 100)),
      comidasPct: totals[i] > 0 ? Math.round((cArr[i] / totals[i]) * 100) : 0,
      ejerciciosPct: totals[i] > 0 ? Math.round((eArr[i] / totals[i]) * 100) : 0,
    }));
  }

  get pacientePorTipo(): { id: number; label: string; count: number; pct: number; color: string }[] {
    const map: Record<number, number> = {};
    this.pacienteComidas.forEach(r => { map[r.tipo_comida_id] = (map[r.tipo_comida_id] ?? 0) + 1; });
    const total = this.pacienteComidas.length || 1;
    return Object.entries(map)
      .map(([id, count]) => ({
        id: +id, label: this.TIPO_NOMBRES[+id] ?? `Tipo ${id}`, count,
        pct: Math.round((count / total) * 100),
        color: this.TIPO_COLORS[+id] ?? '#6b7280',
      }))
      .sort((a, b) => b.count - a.count);
  }

  get pacienteEnPlan(): { enPlan: number; fuera: number; pctEnPlan: number } {
    const fuera = this.pacienteComidas.filter(r => r.fuera_de_plan).length;
    const enPlan = this.pacienteComidas.length - fuera;
    const pctEnPlan = this.pacienteComidas.length > 0
      ? Math.round((enPlan / this.pacienteComidas.length) * 100) : 0;
    return { enPlan, fuera, pctEnPlan };
  }

  get donutEnPlanDash(): string {
    const pct = this.pacienteEnPlan.pctEnPlan;
    const c = 2 * Math.PI * 40;
    return `${(pct / 100) * c} ${c}`;
  }

  get donutFueraDash(): string {
    const pct = 100 - this.pacienteEnPlan.pctEnPlan;
    const c = 2 * Math.PI * 40;
    return `${(pct / 100) * c} ${c}`;
  }

  get donutFueraOffset(): number {
    const pct = this.pacienteEnPlan.pctEnPlan;
    const c = 2 * Math.PI * 40;
    return -(pct / 100) * c;
  }

  get pacienteKcalTrend(): { fecha: string; kcal: number; x: number; y: number }[] {
    if (!this.fechaDesde || !this.fechaHasta) return [];
    const start = new Date(this.fechaDesde + 'T12:00:00');
    const end = new Date(this.fechaHasta + 'T12:00:00');
    const dates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    if (dates.length < 2) return [];
    const kcalMap: Record<string, number> = {};
    dates.forEach(d => (kcalMap[d] = 0));
    this.pacienteComidas.forEach(r => {
      const d = r.fecha.substring(0, 10);
      if (d in kcalMap) kcalMap[d] += r.calorias_consumidas ?? 0;
    });
    const maxVal = Math.max(1, ...dates.map(d => kcalMap[d]));
    const W = 560, H = 90, padX = 4, padY = 10;
    return dates.map((fecha, i) => ({
      fecha, kcal: kcalMap[fecha],
      x: padX + (i / (dates.length - 1)) * (W - padX * 2),
      y: H - padY - Math.round((kcalMap[fecha] / maxVal) * (H - padY * 2)),
    }));
  }

  get pacienteKcalPolyline(): string { return this.pacienteKcalTrend.map(p => `${p.x},${p.y}`).join(' '); }
  get pacienteKcalMax(): number { return Math.max(0, ...this.pacienteKcalTrend.map(p => p.kcal)); }
  get pacienteKcalArea(): string {
    const pts = this.pacienteKcalTrend;
    if (pts.length < 2) return '';
    const bl = 90 - 10;
    return `M ${pts[0].x},${bl} ${pts.map(p => `L ${p.x},${p.y}`).join(' ')} L ${pts[pts.length - 1].x},${bl} Z`;
  }

  // ── Progreso de peso ─────────────────────────────────────────────────────────

  get pacientePesoTrend(): { fecha: string; peso: number; x: number; y: number }[] {
    const recs = this.pacienteProgreso.filter(r => r.peso_kg != null)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (recs.length === 0) return [];
    if (recs.length === 1) return [{ fecha: recs[0].fecha.substring(0, 10), peso: recs[0].peso_kg!, x: 280, y: 45 }];
    const min = Math.min(...recs.map(r => r.peso_kg!));
    const max = Math.max(...recs.map(r => r.peso_kg!));
    const range = max - min || 1;
    const W = 560, H = 90, padX = 4, padY = 10;
    return recs.map((r, i) => ({
      fecha: r.fecha.substring(0, 10), peso: r.peso_kg!,
      x: padX + (i / (recs.length - 1)) * (W - padX * 2),
      y: H - padY - Math.round(((r.peso_kg! - min) / range) * (H - padY * 2)),
    }));
  }

  get pacientePesoPolyline(): string { return this.pacientePesoTrend.map(p => `${p.x},${p.y}`).join(' '); }
  get pacientePesoArea(): string {
    const pts = this.pacientePesoTrend;
    if (pts.length < 2) return '';
    const bl = 90 - 10;
    return `M ${pts[0].x},${bl} ${pts.map(p => `L ${p.x},${p.y}`).join(' ')} L ${pts[pts.length - 1].x},${bl} Z`;
  }
  get pacientePesoActual(): number | null {
    const recs = this.pacientePesoTrend;
    return recs.length > 0 ? recs[recs.length - 1].peso : null;
  }
  get pacientePesoInicial(): number | null {
    return this.pacientePesoTrend.length > 0 ? this.pacientePesoTrend[0].peso : null;
  }
  get pacienteDeltaPeso(): number | null {
    const a = this.pacientePesoActual, b = this.pacientePesoInicial;
    return (a != null && b != null) ? +(a - b).toFixed(1) : null;
  }

  // ── Ejercicio charts ─────────────────────────────────────────────────────────

  get pacienteEjerciciosPorNombre(): { nombre: string; count: number; pct: number; minutos: number; kcal: number }[] {
    const map: Record<string, { count: number; minutos: number; kcal: number }> = {};
    this.pacienteEjercicios.forEach(r => {
      const nombre = r.nombre_libre?.trim() || `Ejercicio #${r.ejercicio_id ?? '?'}`;
      if (!map[nombre]) map[nombre] = { count: 0, minutos: 0, kcal: 0 };
      map[nombre].count++;
      map[nombre].minutos += r.duracion_min_real ?? 0;
      map[nombre].kcal += r.calorias_quemadas ?? 0;
    });
    const total = this.pacienteEjercicios.length || 1;
    return Object.entries(map)
      .map(([nombre, v]) => ({
        nombre, count: v.count,
        pct: Math.round((v.count / total) * 100),
        minutos: Math.round(v.minutos),
        kcal: Math.round(v.kcal),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }

  get pacienteEsfuerzoDistrib(): { nivel: number; label: string; color: string; count: number; pct: number }[] {
    const LABELS: Record<number, string> = { 1: 'Muy suave', 2: 'Suave', 3: 'Moderado', 4: 'Intenso', 5: 'Máximo' };
    const COLORS: Record<number, string> = { 1: '#10b981', 2: '#3b82f6', 3: '#f59e0b', 4: '#f97316', 5: '#ef4444' };
    const map: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.pacienteEjercicios.forEach(r => {
      const n = r.nivel_esfuerzo;
      if (n && n >= 1 && n <= 5) map[n]++;
    });
    const total = this.pacienteEjercicios.length || 1;
    return [1, 2, 3, 4, 5].map(n => ({
      nivel: n, label: LABELS[n], color: COLORS[n], count: map[n],
      pct: Math.round((map[n] / total) * 100),
    }));
  }

  get pacienteKcalQuemadaTrend(): { fecha: string; kcal: number; x: number; y: number }[] {
    if (!this.fechaDesde || !this.fechaHasta) return [];
    const start = new Date(this.fechaDesde + 'T12:00:00');
    const end = new Date(this.fechaHasta + 'T12:00:00');
    const dates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    if (dates.length < 2) return [];
    const map: Record<string, number> = {};
    dates.forEach(d => (map[d] = 0));
    this.pacienteEjercicios.forEach(r => {
      const d = r.fecha.substring(0, 10);
      if (d in map) map[d] += r.calorias_quemadas ?? 0;
    });
    const maxVal = Math.max(1, ...dates.map(d => map[d]));
    const W = 560, H = 90, padX = 4, padY = 10;
    return dates.map((fecha, i) => ({
      fecha, kcal: Math.round(map[fecha]),
      x: padX + (i / (dates.length - 1)) * (W - padX * 2),
      y: H - padY - Math.round((map[fecha] / maxVal) * (H - padY * 2)),
    }));
  }

  get pacienteKcalQuemadaPolyline(): string { return this.pacienteKcalQuemadaTrend.map(p => `${p.x},${p.y}`).join(' '); }
  get pacienteKcalQuemadaMax(): number { return Math.max(0, ...this.pacienteKcalQuemadaTrend.map(p => p.kcal)); }
  get pacienteKcalQuemadaArea(): string {
    const pts = this.pacienteKcalQuemadaTrend;
    if (pts.length < 2) return '';
    const bl = 90 - 10;
    return `M ${pts[0].x},${bl} ${pts.map(p => `L ${p.x},${p.y}`).join(' ')} L ${pts[pts.length - 1].x},${bl} Z`;
  }

  get pacienteDuracionTrend(): { fecha: string; min: number; x: number; y: number }[] {
    if (!this.fechaDesde || !this.fechaHasta) return [];
    const start = new Date(this.fechaDesde + 'T12:00:00');
    const end = new Date(this.fechaHasta + 'T12:00:00');
    const dates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    if (dates.length < 2) return [];
    const map: Record<string, number> = {};
    dates.forEach(d => (map[d] = 0));
    this.pacienteEjercicios.forEach(r => {
      const d = r.fecha.substring(0, 10);
      if (d in map) map[d] += r.duracion_min_real ?? 0;
    });
    const maxVal = Math.max(1, ...dates.map(d => map[d]));
    const W = 560, H = 90, padX = 4, padY = 10;
    return dates.map((fecha, i) => ({
      fecha, min: Math.round(map[fecha]),
      x: padX + (i / (dates.length - 1)) * (W - padX * 2),
      y: H - padY - Math.round((map[fecha] / maxVal) * (H - padY * 2)),
    }));
  }

  get pacienteDuracionPolyline(): string { return this.pacienteDuracionTrend.map(p => `${p.x},${p.y}`).join(' '); }
  get pacienteDuracionMax(): number { return Math.max(0, ...this.pacienteDuracionTrend.map(p => p.min)); }
  get pacienteDuracionArea(): string {
    const pts = this.pacienteDuracionTrend;
    if (pts.length < 2) return '';
    const bl = 90 - 10;
    return `M ${pts[0].x},${bl} ${pts.map(p => `L ${p.x},${p.y}`).join(' ')} L ${pts[pts.length - 1].x},${bl} Z`;
  }

  get pacienteEjerciciosRecientes(): NutricionRegistroEjercicio[] {
    return [...this.pacienteEjercicios].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 15);
  }

  get pacienteTotalMinutos(): number {
    return Math.round(this.pacienteEjercicios.reduce((s, r) => s + (r.duracion_min_real ?? 0), 0));
  }

  get pacienteTotalKcalQuemadas(): number {
    return Math.round(this.pacienteEjercicios.reduce((s, r) => s + (r.calorias_quemadas ?? 0), 0));
  }

  // ── Heatmap ──────────────────────────────────────────────────────────────────

  get pacienteHeatmap(): { date: string; label: string; level: 0 | 1 | 2 | 3 }[] {
    const today = new Date();
    const result: { date: string; label: string; level: 0 | 1 | 2 | 3 }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const cCount = this.pacienteComidas.filter(r => r.fecha.substring(0, 10) === dateStr).length;
      const eCount = this.pacienteEjercicios.filter(r => r.fecha.substring(0, 10) === dateStr).length;
      const total = cCount + eCount;
      const level: 0 | 1 | 2 | 3 = total === 0 ? 0 : total <= 2 ? 1 : total <= 5 ? 2 : 3;
      result.push({ date: dateStr, label: `${d.getDate()}/${d.getMonth() + 1}: ${total} registros`, level });
    }
    return result;
  }
  imageUrl(path: string): string {
    if (!path || path.startsWith('http')) return path;
    return `${this.apiBase}/${path}`;
  }

  get pacienteComidasRecientes(): NutricionRegistroComida[] {
    return [...this.pacienteComidas].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 15);
  }

  get pacienteDiasActivos(): number {
    const dias = new Set([
      ...this.pacienteComidas.map(r => r.fecha.substring(0, 10)),
      ...this.pacienteEjercicios.map(r => r.fecha.substring(0, 10)),
    ]);
    return dias.size;
  }
  openImage(url: string) {
    this.selectedImage = url;
  }
  closeImage() {
    this.selectedImage = null;
  }
  // ── Helpers ──────────────────────────────────────────────────────────────────

  nombrePaciente(s: PacienteStats): string {
    return `${s.paciente.nombres} ${s.paciente.apellidos}`;
  }

  iniciales(s: PacienteStats): string {
    return (s.paciente.nombres.charAt(0) + s.paciente.apellidos.charAt(0)).toUpperCase();
  }

  accesoRing(s: PacienteStats): number {
    return Math.min(100, Math.round((s.accesos / this.maxAccesos) * 100));
  }

  tipoLabel(tipoId: number): string {
    return this.pacientePorTipo.find(t => t.id === tipoId)?.label ?? `Tipo ${tipoId}`;
  }

  tipoColor(tipoId: number): string {
    return this.pacientePorTipo.find(t => t.id === tipoId)?.color ?? '#6b7280';
  }

  esfuerzoLabel(nivel: number): string {
    const LABELS: Record<number, string> = { 1: 'Muy suave', 2: 'Suave', 3: 'Moderado', 4: 'Intenso', 5: 'Máximo' };
    return LABELS[nivel] ?? `Nivel ${nivel}`;
  }

  heatmapColor(level: 0 | 1 | 2 | 3): string {
    return ['bg-gray-100 dark:bg-[#172036]', 'bg-primary-200 dark:bg-primary-900/40',
      'bg-primary-400 dark:bg-primary-700', 'bg-primary-600 dark:bg-primary-500'][level];
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateShort(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  avatarColor(idx: number): string {
    const colors = [
      'from-primary-400 to-primary-600', 'from-success-400 to-success-600',
      'from-warning-400 to-warning-600', 'from-secondary-400 to-secondary-600',
      'from-danger-400 to-danger-600',
    ];
    return colors[idx % colors.length];
  }

  deltaPesoColor(delta: number | null): string {
    if (delta == null) return 'text-gray-400';
    if (delta < 0) return 'text-success-500';
    if (delta > 0) return 'text-danger-500';
    return 'text-gray-400';
  }

  deltaPesoIcon(delta: number | null): string {
    if (delta == null) return 'ri-minus-line';
    if (delta < 0) return 'ri-arrow-down-line';
    if (delta > 0) return 'ri-arrow-up-line';
    return 'ri-minus-line';
  }
}
