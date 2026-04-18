import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, DecimalPipe, SlicePipe } from '@angular/common';
import { NutricionService } from '../../../core/services/nutricion.service';
import { PacientesService } from '../../../core/services/pacientes.service';
import { PlantillaMenuService } from '../../../core/services/plantilla-menu.service';
import { Paciente } from '../../../core/models/pacientes.model';
import {
  NutricionDietaPaciente, CreateDietaRequest,
  NutricionProgreso, CreateProgresoRequest,
  NutricionPreferencia,
  PlantillaSemana,
  AssignMenuFromPlantillaRequest,
  PlantillaDetalleInput,
  PlantillaAlimentoInput,
} from '../../../core/models/nutricion.model';
import { SkeletonComponent } from '../../../common/skeleton/skeleton.component';

interface AssignAlimento {
  alimento_id: number;
  nombre: string;
  gramos_asignados: number;
  gramosEdit?: number;
  editando?: boolean;
  calorias_calc: number;
  proteinas_g_calc: number;
  carbohidratos_g_calc: number;
  grasas_g_calc: number;
}

interface AssignCell {
  dia_numero: number;
  tipo_comida_id: number;
  nombre_comida: string;
  nombre_comida_display: string;
  instrucciones: string;
  nombre_receta: string;
  calorias_total: number;
  proteinas_g_total: number;
  carbohidratos_g_total: number;
  grasas_g_total: number;
  alimentos: AssignAlimento[];
}

const TIPOS_COMIDA_MAP: Record<number, string> = {
  1: 'Desayuno', 2: 'Media Mañana', 3: 'Almuerzo', 4: 'Media Tarde', 5: 'Cena'
};
const DIAS_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

type Tab = string;

@Component({
  selector: 'app-detalle-paciente-nutricion',
  imports: [RouterLink, FormsModule, NgClass, DecimalPipe, SlicePipe, SkeletonComponent],
  templateUrl: './detalle-paciente-nutricion.component.html'
})
export class DetallePacienteNutricionComponent implements OnInit {
  readonly DIAS_NAMES = DIAS_NAMES;

  pacienteId = 0;
  paciente: Paciente | null = null;
  activeTab: Tab = 'dietas';
  isLoading = false;
  successMsg = '';
  errorMsg = '';

  // Dietas
  dietas: NutricionDietaPaciente[] = [];
  showDietaModal = false;
  dietaForm: CreateDietaRequest = { nombre: '', fecha_inicio: '', duracion_dias: 7, num_comidas: 5 };
  confirmDeleteDietaId: number | null = null;
  isDeletingDieta = false;

  // Progreso
  progreso: NutricionProgreso[] = [];
  preferencias: NutricionPreferencia[] = [];
  showProgresoModal = false;
  progresoForm: CreateProgresoRequest = { fecha: new Date().toISOString().split('T')[0] };

  // ─── Asignación de menú ───────────────────────────────────────────────────
  showAsignarModal = false;
  asignarDietaId = 0;
  asignarDieta: NutricionDietaPaciente | null = null;
  asignarStep: 1 | 2 = 1;
  plantillas: PlantillaSemana[] = [];
  isLoadingPlantillas = false;
  isLoadingPlantillaDetail = false;
  selectedPlantillaId = 0;
  assignCells: AssignCell[] = [];
  assignTiposComida: { id: number; nombre: string }[] = [];
  assignForm = { semana_numero: 1, fecha_inicio: new Date().toISOString().split('T')[0], nombre: '' };
  isAssigning = false;

  constructor(
    private route: ActivatedRoute,
    private nutricionSvc: NutricionService,
    private pacientesSvc: PacientesService,
    private plantillaSvc: PlantillaMenuService,
  ) {}

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('pacienteId'));
    this.isLoading = true;
    this.pacientesSvc.get(this.pacienteId).subscribe({
      next: (p) => {
        this.paciente = p;
        this.loadTab('dietas');
      },
      error: () => { this.isLoading = false; }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.loadTab(tab);
  }

  loadTab(tab: Tab): void {
    this.isLoading = true;
    switch (tab) {
      case 'dietas':
        this.nutricionSvc.listDietasByPaciente(this.pacienteId).subscribe({
          next: (d) => { this.dietas = d; this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
        break;
      case 'progreso':
        this.nutricionSvc.listProgreso(this.pacienteId).subscribe({
          next: (d) => { this.progreso = d; this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
        break;
      case 'prefer':
        this.nutricionSvc.listPreferencias(this.pacienteId).subscribe({
          next: (d) => {this.preferencias = d; this.isLoading = false},
          error: () => {this.isLoading = false}
        })
      break;
      default:
        this.isLoading = false;
    }
  }

  // ─── Dietas ─────────────────────────────────────────────────────────────────

  openDietaModal(): void {
    this.dietaForm = { nombre: '', fecha_inicio: new Date().toISOString().split('T')[0], duracion_dias: 7, num_comidas: 5 };
    this.errorMsg = '';
    this.showDietaModal = true;
  }

  saveDieta(): void {
    if (!this.dietaForm.nombre || !this.dietaForm.fecha_inicio) {
      this.errorMsg = 'Nombre y fecha de inicio son requeridos.';
      return;
    }
    this.isLoading = true;
    this.errorMsg = '';
    this.nutricionSvc.createDieta(this.pacienteId, this.dietaForm).subscribe({
      next: () => {
        this.showDietaModal = false;
        this.successMsg = 'Dieta creada correctamente.';
        this.loadTab('dietas');
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al crear dieta.';
        this.isLoading = false;
      }
    });
  }

  deleteDieta(id: number): void {
    this.isDeletingDieta = true;
    this.nutricionSvc.deleteDieta(this.pacienteId, id).subscribe({
      next: () => {
        this.dietas = this.dietas.filter(d => d.id !== id);
        this.confirmDeleteDietaId = null;
        this.isDeletingDieta = false;
        this.successMsg = 'Dieta eliminada.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.isDeletingDieta = false; this.errorMsg = 'Error al eliminar la dieta.'; }
    });
  }

  // ─── Progreso ────────────────────────────────────────────────────────────────

  openProgresoModal(): void {
    this.progresoForm = { fecha: new Date().toISOString().split('T')[0] };
    this.errorMsg = '';
    this.showProgresoModal = true;
  }

  saveProgreso(): void {
    this.isLoading = true;
    this.errorMsg = '';
    this.nutricionSvc.addProgreso(this.pacienteId, this.progresoForm).subscribe({
      next: () => {
        this.showProgresoModal = false;
        this.successMsg = 'Registro de progreso guardado.';
        this.loadTab('progreso');
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al guardar progreso.';
        this.isLoading = false;
      }
    });
  }

  // ─── Asignación de menú ───────────────────────────────────────────────────

  openAsignarModal(dieta: NutricionDietaPaciente): void {
    this.asignarDietaId = dieta.id;
    this.asignarDieta = dieta;
    this.asignarStep = 1;
    this.selectedPlantillaId = 0;
    this.assignCells = [];
    this.assignForm = {
      semana_numero: 1,
      fecha_inicio: new Date().toISOString().split('T')[0],
      nombre: '',
    };
    this.showAsignarModal = true;
    this.isLoadingPlantillas = true;
    this.plantillaSvc.list({ num_comidas: dieta.num_comidas }).subscribe({
      next: (p) => { this.plantillas = p; this.isLoadingPlantillas = false; },
      error: () => { this.isLoadingPlantillas = false; }
    });
  }

  refetchPlantillasBySemana(): void {
    if (!this.asignarDieta) return;
    this.isLoadingPlantillas = true;
    this.selectedPlantillaId = 0;
    this.assignCells = [];
    this.plantillaSvc.list({
      num_comidas: this.asignarDieta.num_comidas,
      semana_numero: this.assignForm.semana_numero || undefined,
    }).subscribe({
      next: (p) => {
        this.plantillas = p;
        this.isLoadingPlantillas = false;
        if (p.length === 1) this.selectPlantillaForAssign(p[0].id);
      },
      error: () => { this.isLoadingPlantillas = false; }
    });
  }

  selectPlantillaForAssign(id: number): void {
    if (this.selectedPlantillaId === id) return;
    this.selectedPlantillaId = id;
    this.isLoadingPlantillaDetail = true;
    this.plantillaSvc.getById(id).subscribe({
      next: (p) => {
        this.buildAssignCells(p);
        this.assignForm.semana_numero = p.semana_numero;
        this.assignForm.nombre = p.nombre;
        this.isLoadingPlantillaDetail = false;
      },
      error: () => { this.isLoadingPlantillaDetail = false; }
    });
  }

  private buildAssignCells(p: PlantillaSemana): void {
    const detalles = p.detalles ?? [];
    const tipoIds = [...new Set(detalles.map(d => d.tipo_comida_id))].sort((a, b) => a - b);
    this.assignTiposComida = tipoIds.map(id => ({ id, nombre: TIPOS_COMIDA_MAP[id] ?? `Comida ${id}` }));

    this.assignCells = detalles.map(d => {
      const alimentos: AssignAlimento[] = (d.alimentos ?? []).map(a => ({
        alimento_id: a.alimento_id,
        nombre: a.Alimento?.nombre ?? `Alimento #${a.alimento_id}`,
        gramos_asignados: a.gramos_asignados,
        calorias_calc: a.calorias_calc,
        proteinas_g_calc: a.proteinas_g_calc,
        carbohidratos_g_calc: a.carbohidratos_g_calc,
        grasas_g_calc: a.grasas_g_calc,
      }));
      return {
        dia_numero: d.dia_numero,
        tipo_comida_id: d.tipo_comida_id,
        nombre_comida: d.nombre_comida,
        nombre_comida_display: TIPOS_COMIDA_MAP[d.tipo_comida_id] ?? d.nombre_comida,
        instrucciones: d.instrucciones,
        nombre_receta: d.nombre_receta,
        calorias_total: d.calorias_total,
        proteinas_g_total: d.proteinas_g_total,
        carbohidratos_g_total: d.carbohidratos_g_total,
        grasas_g_total: d.grasas_g_total,
        alimentos,
      };
    });
  }

  goToAssignStep2(): void {
    if (!this.selectedPlantillaId) return;
    this.asignarStep = 2;
  }

  startEditAssignGramos(ca: AssignAlimento): void {
    ca.gramosEdit = ca.gramos_asignados;
    ca.editando = true;
  }

  confirmEditAssignGramos(ca: AssignAlimento): void {
    if ((ca.gramosEdit ?? 0) > 0) {
      ca.gramos_asignados = ca.gramosEdit!;
    }
    ca.editando = false;
    ca.gramosEdit = undefined;
  }

  cancelEditAssignGramos(ca: AssignAlimento): void {
    ca.editando = false;
    ca.gramosEdit = undefined;
  }

  getAssignCell(diaN: number, tcId: number): AssignCell | undefined {
    return this.assignCells.find(c => c.dia_numero === diaN && c.tipo_comida_id === tcId);
  }

  submitAssign(): void {
    if (!this.assignForm.fecha_inicio || !this.asignarDietaId) {
      this.errorMsg = 'La fecha de inicio es requerida.';
      return;
    }
    this.isAssigning = true;
    this.errorMsg = '';
    const detalles: PlantillaDetalleInput[] = this.assignCells.map(c => ({
      tipo_comida_id: c.tipo_comida_id,
      dia_numero: c.dia_numero,
      nombre_comida: c.nombre_comida,
      instrucciones: c.instrucciones,
      nombre_receta: c.nombre_receta,
      calorias_total: c.calorias_total,
      proteinas_g_total: c.proteinas_g_total,
      carbohidratos_g_total: c.carbohidratos_g_total,
      grasas_g_total: c.grasas_g_total,
      alimentos: c.alimentos.map((a): PlantillaAlimentoInput => ({
        alimento_id: a.alimento_id,
        gramos_asignados: a.gramos_asignados,
        calorias_calc: a.calorias_calc,
        proteinas_g_calc: a.proteinas_g_calc,
        carbohidratos_g_calc: a.carbohidratos_g_calc,
        grasas_g_calc: a.grasas_g_calc,
      })),
    }));
    const body: AssignMenuFromPlantillaRequest = {
      semana_numero: this.assignForm.semana_numero,
      fecha_inicio: this.assignForm.fecha_inicio,
      nombre: this.assignForm.nombre || undefined,
      detalles,
    };
    this.nutricionSvc.assignMenuFromPlantilla(this.pacienteId, this.asignarDietaId, body).subscribe({
      next: () => {
        this.showAsignarModal = false;
        this.isAssigning = false;
        this.successMsg = 'Menú asignado correctamente.';
        setTimeout(() => this.successMsg = '', 3500);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al asignar el menú.';
        this.isAssigning = false;
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  estadoDietaBadge(estado: string): string {
    const map: Record<string, string> = {
      ACTIVA: 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
      COMPLETADA: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      CANCELADA: 'bg-danger-50 text-danger-600',
      PAUSADA: 'bg-warning-50 text-warning-600'
    };
    return map[estado] || 'bg-gray-100 text-gray-600';
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
