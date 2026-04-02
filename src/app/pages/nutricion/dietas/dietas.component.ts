import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, DecimalPipe } from '@angular/common';
import { NutricionService } from '../../../core/services/nutricion.service';
import { PacientesService } from '../../../core/services/pacientes.service';
import { forkJoin } from 'rxjs';
import { NutricionDietaPaciente, NutricionMenu, CreateDietaRequest } from '../../../core/models/nutricion.model';
import { Paciente } from '../../../core/models/pacientes.model';

interface DietaConPaciente extends NutricionDietaPaciente {
  paciente?: Paciente;
  menus?: NutricionMenu[];
}

@Component({
  selector: 'app-dietas',
  standalone: true,
  imports: [RouterLink, FormsModule, NgClass, DecimalPipe],
  templateUrl: './dietas.component.html'
})
export class DietasComponent implements OnInit {
  isLoading = false;
  successMsg = '';
  errorMsg = '';

  pacientes: Paciente[] = [];
  dietasConPaciente: DietaConPaciente[] = [];

  filtroEstado = 'ACTIVA';
  search = '';

  showDietaModal = false;
  selectedPacienteId = 0;
  isSubmitting = false;
  dietaForm: CreateDietaRequest = {
    nombre: '', fecha_inicio: new Date().toISOString().split('T')[0],
    duracion_dias: 28, num_comidas: 5
  };

  constructor(
    private nutricionSvc: NutricionService,
    private pacientesSvc: PacientesService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.pacientesSvc.list().subscribe({
      next: res => {
        this.pacientes = res.data;
        this.loadDietas();
      },
      error: () => { this.isLoading = false; }
    });
  }

  private loadDietas(): void {
    if (this.pacientes.length === 0) { this.isLoading = false; return; }

    const dietaReqs = this.pacientes.map(p => this.nutricionSvc.listDietasByPaciente(p.id));

    forkJoin(dietaReqs).subscribe({
      next: results => {
        const dietas: DietaConPaciente[] = results.flatMap((ds, idx) =>
          ds.map(d => ({ ...d, paciente: this.pacientes[idx], menus: [] }))
        );

        if (dietas.length === 0) { this.dietasConPaciente = []; this.isLoading = false; return; }

        const menuReqs = dietas.map(d => this.nutricionSvc.listMenusByDieta(d.paciente_id, d.id));
        forkJoin(menuReqs).subscribe({
          next: menus => {
            menus.forEach((ms, i) => { dietas[i].menus = ms; });
            this.dietasConPaciente = dietas;
            this.isLoading = false;
          },
          error: () => {
            this.dietasConPaciente = dietas;
            this.isLoading = false;
          }
        });
      },
      error: () => { this.isLoading = false; }
    });
  }

  get dietasFiltradas(): DietaConPaciente[] {
    let list = this.dietasConPaciente;
    if (this.filtroEstado) list = list.filter(d => d.estado === this.filtroEstado);
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(d =>
        d.nombre.toLowerCase().includes(q) ||
        (d.paciente?.nombres ?? '').toLowerCase().includes(q) ||
        (d.paciente?.apellidos ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  menuActivo(dieta: DietaConPaciente): NutricionMenu | null {
    if (!dieta.menus || dieta.menus.length === 0) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    // Buscar el menú cuyo rango de 7 días contiene hoy
    const activo = dieta.menus.find(m => {
      const inicio = new Date(m.fecha_inicio);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 6);
      return hoy >= inicio && hoy <= fin;
    });
    if (activo) return activo;
    // Si no hay uno activo exacto, mostrar el más reciente
    return [...dieta.menus].sort((a, b) =>
      new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
    )[0];
  }

  verDetalle(dieta: DietaConPaciente): void {
    this.router.navigate(['/dashboard/nutricion/dietas', dieta.paciente_id, dieta.id]);
  }

  abrirMenuBuilder(dieta: DietaConPaciente): void {
    this.router.navigate(['/dashboard/nutricion/pacientes', dieta.paciente_id, 'menu-builder', dieta.id]);
  }

  abrirCrearDieta(): void {
    this.dietaForm = {
      nombre: '', fecha_inicio: new Date().toISOString().split('T')[0],
      duracion_dias: 28, num_comidas: 5
    };
    this.selectedPacienteId = 0;
    this.errorMsg = '';
    this.showDietaModal = true;
  }

  saveDieta(): void {
    if (!this.selectedPacienteId) { this.errorMsg = 'Selecciona un paciente.'; return; }
    if (!this.dietaForm.nombre.trim()) { this.errorMsg = 'El nombre es requerido.'; return; }
    this.isSubmitting = true;
    this.errorMsg = '';
    this.nutricionSvc.createDieta(this.selectedPacienteId, this.dietaForm).subscribe({
      next: () => {
        this.showDietaModal = false;
        this.isSubmitting = false;
        this.successMsg = 'Dieta creada correctamente.';
        setTimeout(() => this.successMsg = '', 3000);
        this.load();
      },
      error: err => {
        this.errorMsg = err?.error?.message || 'Error al crear la dieta.';
        this.isSubmitting = false;
      }
    });
  }

  estadoBadge(estado: string): string {
    const map: Record<string, string> = {
      ACTIVA:     'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      COMPLETADA: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      CANCELADA:  'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
      PAUSADA:    'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-600';
  }

  estadoDot(estado: string): string {
    const map: Record<string, string> = {
      ACTIVA: 'bg-success-500', COMPLETADA: 'bg-gray-400',
      CANCELADA: 'bg-danger-500', PAUSADA: 'bg-warning-500',
    };
    return map[estado] ?? 'bg-gray-400';
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateShort(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  nombrePaciente(dieta: DietaConPaciente): string {
    if (dieta.paciente) return `${dieta.paciente.nombres} ${dieta.paciente.apellidos}`;
    return `Paciente #${dieta.paciente_id}`;
  }

  inicialesPaciente(dieta: DietaConPaciente): string {
    if (dieta.paciente)
      return (dieta.paciente.nombres.charAt(0) + dieta.paciente.apellidos.charAt(0)).toUpperCase();
    return '?';
  }

  addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  diasRestantes(dieta: DietaConPaciente): number | null {
    if (!dieta.fecha_inicio || !dieta.duracion_dias) return null;
    const inicio = new Date(dieta.fecha_inicio);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + dieta.duracion_dias);
    const hoy = new Date();
    const diff = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }
}
