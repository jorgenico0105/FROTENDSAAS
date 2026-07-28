import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PlantillaMenuService } from '../../../core/services/plantilla-menu.service';
import { NutricionService } from '../../../core/services/nutricion.service';
import {
  PlantillaSemana,
  NutricionAlimento,
  CreatePlantillaSemanaRequest,
  AddAlimentoPlantillaRequest,
} from '../../../core/models/nutricion.model';

interface PlantillaGridAlimento {
  id: number;
  alimento_id: number;
  nombre: string;
  gramos: number;
  gramosEdit?: number;
  unidadesEdit?: number;
  cuartoEdit?: string;
  editando?: boolean;
  saving?: boolean;
  calorias: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  unidad?: boolean;
  gramos_unidad?: number;
  medida?: string;
}

interface PlantillaGridCell {
  dia_numero: number;
  tipo_comida_id: number;
  detalle_id: number | null;
  alimentos: PlantillaGridAlimento[];
  calorias: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  isDragOver: boolean;
  nombre_receta: string;
}

const TIPOS_COMIDA_MAP: Record<number, string> = {
  1: 'Desayuno', 2: 'Media Mañana', 3: 'Almuerzo', 4: 'Media Tarde', 5: 'Cena'
};
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

@Component({
  selector: 'app-plantillas-menu',
  standalone: true,
  imports: [RouterLink, FormsModule, NgClass, DecimalPipe],
  templateUrl: './plantillas-menu.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-hidden' },
})
export class PlantillasMenuComponent implements OnInit {
  readonly DIAS = DIAS;
  readonly CUARTOS = [
    { label: '1/8', val: 0.125 }, { label: '1/4', val: 0.25  },
    { label: '1/2', val: 0.5   }, { label: '3/4', val: 0.75  },
    { label: '1',   val: 1     }, { label: '1 1/4', val: 1.25 },
    { label: '1 1/2', val: 1.5 }, { label: '2',   val: 2     },
  ];

  plantillas: PlantillaSemana[] = [];
  selectedPlantilla: PlantillaSemana | null = null;

  grid: PlantillaGridCell[][] = [];
  tiposComidaActivos: { id: number; nombre: string }[] = [];

  isLoading = false;
  isLoadingDetail = false;
  successMsg = '';
  errorMsg = '';

  // Create modal
  showCreateModal = false;
  isCreating = false;
  createForm: CreatePlantillaSemanaRequest = {
    semana_numero: 1, num_comidas: 5, nombre: '', calorias_dia: 1800
  };
  createError = '';

  // Delete
  confirmDeleteId: number | null = null;
  isDeleting = false;

  // Duplicate
  isDuplicando = false;
  duplicandoId: number | null = null;

  // Food catalog (left panel)
  allAlimentos: NutricionAlimento[] = [];
  filteredCatalog: NutricionAlimento[] = [];
  alimentoSearch = '';
  dragAlimento: NutricionAlimento | null = null;

  // Add food to cell (modal fallback)
  showAddFoodModal = false;
  addFoodCell: PlantillaGridCell | null = null;
  filteredAlimentos: NutricionAlimento[] = [];
  foodSearch = '';
  addFoodGramos = 100;
  isAddingFood = false;

  // Cell detail modal (double-click)
  showCellModal = false;
  selectedCell: PlantillaGridCell | null = null;
  cellRecetaEdit = '';
  cellSavingReceta = false;

  // Filter
  filterNumComidas = 0;

  constructor(
    private svc: PlantillaMenuService,
    private nutricionSvc: NutricionService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      plantillas: this.svc.list(),
      alimentos: this.nutricionSvc.listAlimentos(),
    }).subscribe({
      next: ({ plantillas, alimentos }) => {
        this.plantillas = plantillas;
        this.allAlimentos = alimentos;
        this.filteredCatalog = [...alimentos];
        this.filteredAlimentos = [...alimentos];
      },
      error: () => {}
    });
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────

  applyFilter(): void {
    this.isLoading = true;
    const params = this.filterNumComidas > 0 ? { num_comidas: this.filterNumComidas } : undefined;
    this.svc.list(params).subscribe({
      next: (p) => { this.plantillas = p; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  // ─── Catálogo de alimentos ────────────────────────────────────────────────

  filterCatalog(): void {
    const q = this.alimentoSearch.toLowerCase();
    this.filteredCatalog = q
      ? this.allAlimentos.filter(a => a.nombre.toLowerCase().includes(q) || (a.categoria || '').toLowerCase().includes(q))
      : [...this.allAlimentos];
  }

  onDragStart(a: NutricionAlimento): void {
    this.dragAlimento = a;
  }

  onDragOver(e: DragEvent, cell: PlantillaGridCell): void {
    e.preventDefault();
    cell.isDragOver = true;
  }

  onDragLeave(cell: PlantillaGridCell): void {
    cell.isDragOver = false;
  }

  onDrop(e: DragEvent, cell: PlantillaGridCell): void {
    e.preventDefault();
    cell.isDragOver = false;
    if (!this.dragAlimento || !cell.detalle_id || this.isAddingFood) return;
    this.addFoodCell = cell;
    this.addFoodGramos = 100;
    this.confirmAddFood(this.dragAlimento);
    this.dragAlimento = null;
  }

  // ─── Selección de plantilla ───────────────────────────────────────────────

  selectPlantilla(p: PlantillaSemana): void {
    if (this.selectedPlantilla?.id === p.id) return;
    this.isLoadingDetail = true;
    this.errorMsg = '';
    this.svc.getById(p.id).subscribe({
      next: (full) => {
        this.selectedPlantilla = full;
        this.buildGrid(full);
        this.isLoadingDetail = false;
      },
      error: () => { this.isLoadingDetail = false; }
    });
  }

  private buildGrid(p: PlantillaSemana): void {
    const detalles = p.detalles ?? [];
    const tipoIds = [...new Set(detalles.map(d => d.tipo_comida_id))].sort((a, b) => a - b);
    this.tiposComidaActivos = tipoIds.map(id => ({ id, nombre: TIPOS_COMIDA_MAP[id] ?? `Comida ${id}` }));

    this.grid = Array.from({ length: 7 }, (_, i) => {
      const diaN = i + 1;
      return tipoIds.map(tcId => {
        const detalle = detalles.find(d => d.dia_numero === diaN && d.tipo_comida_id === tcId);
        const alimentos: PlantillaGridAlimento[] = (detalle?.alimentos ?? []).map(a => ({
          id: a.id,
          alimento_id: a.alimento_id,
          nombre: a.Alimento?.nombre || (a as any).alimento?.nombre || `#${a.alimento_id}`,
          gramos: a.gramos_asignados,
          calorias: a.calorias_calc,
          proteinas_g: a.proteinas_g_calc,
          carbohidratos_g: a.carbohidratos_g_calc,
          grasas_g: a.grasas_g_calc,
          unidad: a.Alimento?.unidad,
          gramos_unidad: a.Alimento?.gramos_unidad,
          medida: a.Alimento?.medida,
        }));
        return this.makeCell(diaN, tcId, detalle?.id ?? null, alimentos, detalle?.nombre_receta ?? '');
      });
    });
  }

  private makeCell(dia: number, tcId: number, detalleId: number | null, alimentos: PlantillaGridAlimento[], nombreReceta = ''): PlantillaGridCell {
    return {
      dia_numero: dia,
      tipo_comida_id: tcId,
      detalle_id: detalleId,
      alimentos,
      calorias: alimentos.reduce((s, a) => s + a.calorias, 0),
      proteinas_g: alimentos.reduce((s, a) => s + a.proteinas_g, 0),
      carbohidratos_g: alimentos.reduce((s, a) => s + a.carbohidratos_g, 0),
      grasas_g: alimentos.reduce((s, a) => s + a.grasas_g, 0),
      isDragOver: false,
      nombre_receta: nombreReceta,
    };
  }

  private recalcCell(cell: PlantillaGridCell): void {
    cell.calorias = cell.alimentos.reduce((s, a) => s + a.calorias, 0);
    cell.proteinas_g = cell.alimentos.reduce((s, a) => s + a.proteinas_g, 0);
    cell.carbohidratos_g = cell.alimentos.reduce((s, a) => s + a.carbohidratos_g, 0);
    cell.grasas_g = cell.alimentos.reduce((s, a) => s + a.grasas_g, 0);
  }

  // ─── Cell detail modal ────────────────────────────────────────────────────

  openCellModal(cell: PlantillaGridCell): void {
    this.selectedCell = cell;
    this.cellRecetaEdit = cell.nombre_receta;
    this.foodSearch = '';
    this.filteredAlimentos = [...this.allAlimentos];
    this.showCellModal = true;
  }

  saveCellReceta(): void {
    if (!this.selectedCell?.detalle_id) return;
    this.cellSavingReceta = true;
    this.svc.updateDetalle(this.selectedCell.detalle_id, { nombre_receta: this.cellRecetaEdit }).subscribe({
      next: () => {
        this.selectedCell!.nombre_receta = this.cellRecetaEdit;
        this.cellSavingReceta = false;
      },
      error: () => { this.cellSavingReceta = false; this.errorMsg = 'Error al guardar receta.'; }
    });
  }

  filterFoodModal(): void {
    const q = this.foodSearch.toLowerCase();
    this.filteredAlimentos = q
      ? this.allAlimentos.filter(a => a.nombre.toLowerCase().includes(q) || (a.categoria || '').toLowerCase().includes(q))
      : [...this.allAlimentos];
  }

  addFromModal(alimento: NutricionAlimento): void {
    if (!this.selectedCell) return;
    this.addFoodCell = this.selectedCell;
    this.addFoodGramos = 100;
    this.confirmAddFood(alimento);
  }

  // ─── Edición de gramos ────────────────────────────────────────────────────

  startEdit(ca: PlantillaGridAlimento): void {
    if (ca.unidad && ca.gramos_unidad && ca.gramos_unidad > 0) {
      if (ca.medida === 'cuar') {
        const ratio = ca.gramos / ca.gramos_unidad;
        const closest = this.CUARTOS.reduce((a, b) =>
          Math.abs(ratio - b.val) < Math.abs(ratio - a.val) ? b : a
        );
        ca.cuartoEdit = closest.label;
      } else {
        ca.unidadesEdit = Math.ceil(ca.gramos / ca.gramos_unidad);
      }
    } else {
      ca.gramosEdit = ca.gramos;
    }
    ca.editando = true;
  }

  cancelEdit(ca: PlantillaGridAlimento): void {
    ca.editando = false;
    ca.gramosEdit = undefined;
    ca.unidadesEdit = undefined;
    ca.cuartoEdit = undefined;
  }

  saveGramos(cell: PlantillaGridCell, ca: PlantillaGridAlimento): void {
    let gramos: number;
    if (ca.unidad && ca.gramos_unidad && ca.gramos_unidad > 0) {
      if (ca.medida === 'cuar') {
        const cuarto = this.CUARTOS.find(c => c.label === ca.cuartoEdit);
        gramos = (cuarto?.val ?? 1) * ca.gramos_unidad;
      } else {
        gramos = (ca.unidadesEdit ?? 1) * ca.gramos_unidad;
      }
    } else {
      gramos = ca.gramosEdit ?? 0;
    }
    if (gramos <= 0 || !ca.id) return;
    ca.saving = true;
    this.svc.updateAlimento(ca.id, gramos).subscribe({
      next: (res) => {
        ca.gramos = res.gramos_asignados;
        ca.calorias = res.calorias_calc;
        ca.proteinas_g = res.proteinas_g_calc;
        ca.carbohidratos_g = res.carbohidratos_g_calc;
        ca.grasas_g = res.grasas_g_calc;
        ca.editando = false;
        ca.gramosEdit = undefined;
        ca.saving = false;
        this.recalcCell(cell);
      },
      error: () => { ca.saving = false; this.errorMsg = 'Error al actualizar gramos.'; }
    });
  }

  // ─── Eliminar alimento ────────────────────────────────────────────────────

  removeAlimento(cell: PlantillaGridCell, index: number): void {
    const ca = cell.alimentos[index];
    if (!ca.id) return;
    this.svc.deleteAlimento(ca.id).subscribe({
      next: () => {
        cell.alimentos.splice(index, 1);
        this.recalcCell(cell);
      },
      error: () => { this.errorMsg = 'Error al eliminar alimento.'; }
    });
  }

  // ─── Agregar alimento ─────────────────────────────────────────────────────

  openAddFood(cell: PlantillaGridCell): void {
    this.addFoodCell = cell;
    this.foodSearch = '';
    this.addFoodGramos = 100;
    this.filteredAlimentos = [...this.allAlimentos];
    this.showAddFoodModal = true;
  }

  filterFood(): void {
    const q = this.foodSearch.toLowerCase();
    this.filteredAlimentos = q
      ? this.allAlimentos.filter(a => a.nombre.toLowerCase().includes(q) || (a.categoria || '').toLowerCase().includes(q))
      : [...this.allAlimentos];
  }

  confirmAddFood(alimento: NutricionAlimento): void {
    if (!this.addFoodCell?.detalle_id || this.isAddingFood) return;
    this.isAddingFood = true;
    const req: AddAlimentoPlantillaRequest = { alimento_id: alimento.id, gramos_asignados: this.addFoodGramos };
    this.svc.addAlimento(this.addFoodCell.detalle_id, req).subscribe({
      next: (res) => {
        const ratio = res.gramos_asignados / (alimento.gramos_porcion || 100);
        this.addFoodCell!.alimentos.push({
          id: res.id,
          alimento_id: alimento.id,
          nombre: alimento.nombre,
          gramos: res.gramos_asignados,
          calorias: res.calorias_calc ?? alimento.calorias * ratio,
          proteinas_g: res.proteinas_g_calc ?? alimento.proteinas_g * ratio,
          carbohidratos_g: res.carbohidratos_g_calc ?? alimento.carbohidratos_g * ratio,
          grasas_g: res.grasas_g_calc ?? alimento.grasas_g * ratio,
          unidad: alimento.unidad,
          gramos_unidad: alimento.gramos_unidad,
          medida: alimento.medida,
        });
        this.recalcCell(this.addFoodCell!);
        this.isAddingFood = false;
        this.showAddFoodModal = false;
      },
      error: () => { this.isAddingFood = false; this.errorMsg = 'Error al agregar alimento.'; }
    });
  }

  // ─── Duplicar plantilla para hombre ──────────────────────────────────────

  duplicarPlantilla(p: PlantillaSemana): void {
    if (this.isDuplicando) return;
    this.isDuplicando = true;
    this.duplicandoId = p.id;
    this.errorMsg = '';
    this.svc.duplicarParaHombre(p.id).subscribe({
      next: (nueva) => {
        this.plantillas.unshift(nueva);
        this.isDuplicando = false;
        this.duplicandoId = null;
        this.successMsg = `Plantilla "${nueva.nombre}" creada para hombre.`;
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: (err) => {
        this.isDuplicando = false;
        this.duplicandoId = null;
        this.errorMsg = err?.error?.message || 'Error al duplicar la plantilla.';
      }
    });
  }

  // ─── Crear plantilla ──────────────────────────────────────────────────────

  openCreateModal(): void {
    this.createForm = { semana_numero: this.plantillas.length + 1, num_comidas: 5, nombre: '', calorias_dia: 1800 };
    this.createError = '';
    this.showCreateModal = true;
  }

  saveCreate(): void {
    if (!this.createForm.nombre || !this.createForm.calorias_dia) {
      this.createError = 'Nombre y calorías/día son requeridos.';
      return;
    }
    this.isCreating = true;
    this.createError = '';
    this.svc.create(this.createForm).subscribe({
      next: (p) => {
        this.plantillas.unshift(p);
        this.showCreateModal = false;
        this.isCreating = false;
        this.selectPlantilla(p);
      },
      error: (err) => {
        this.createError = err?.error?.message || 'Error al crear plantilla.';
        this.isCreating = false;
      }
    });
  }

  // ─── Eliminar plantilla ───────────────────────────────────────────────────

  confirmDelete(id: number): void {
    this.confirmDeleteId = id;
  }

  cancelConfirmDelete(): void {
    this.confirmDeleteId = null;
  }

  deletePlantilla(id: number): void {
    this.isDeleting = true;
    this.svc.delete(id).subscribe({
      next: () => {
        this.plantillas = this.plantillas.filter(p => p.id !== id);
        if (this.selectedPlantilla?.id === id) {
          this.selectedPlantilla = null;
          this.grid = [];
        }
        this.confirmDeleteId = null;
        this.isDeleting = false;
        this.successMsg = 'Plantilla eliminada.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.isDeleting = false; this.errorMsg = 'Error al eliminar.'; }
    });
  }

  // ─── Formato cantidad con unidades ───────────────────────────────────────

  private toFraccion(n: number): string {
    const FRACS = [
      { val: 1/8, label: '1/8' }, { val: 1/4, label: '1/4' },
      { val: 1/2, label: '1/2' }, { val: 3/4, label: '3/4' },
    ];
    const intPart = Math.floor(n);
    const dec = n - intPart;
    if (dec < 0.06) return intPart > 0 ? `${intPart}` : '1/8';
    const closest = FRACS.reduce((a, b) => Math.abs(dec - b.val) < Math.abs(dec - a.val) ? b : a);
    return intPart > 0 ? `${intPart} ${closest.label}` : closest.label;
  }

  formatCantidad(gramos: number, ca: PlantillaGridAlimento): string {
    if (ca.unidad && ca.gramos_unidad && ca.gramos_unidad > 0) {
      const ratio = gramos / ca.gramos_unidad;
      if (ca.medida === 'cuar') return this.toFraccion(ratio);
      const qty = Math.ceil(ratio);
      const label = ca.medida === 'cdta' ? 'cucharada' : (ca.medida ?? 'uni');
      return `${qty} ${label}`;
    }
    return `${gramos}g`;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  getCell(diaIndex: number, tipoIdx: number): PlantillaGridCell {
    return this.grid[diaIndex]?.[tipoIdx];
  }

  getDayTotal(diaIndex: number): { cal: number; pro: number; carb: number; fat: number } {
    const row = this.grid[diaIndex] ?? [];
    return {
      cal:  row.reduce((s, c) => s + c.calorias, 0),
      pro:  row.reduce((s, c) => s + c.proteinas_g, 0),
      carb: row.reduce((s, c) => s + c.carbohidratos_g, 0),
      fat:  row.reduce((s, c) => s + c.grasas_g, 0),
    };
  }

  get plantillasPorSemana(): { semana: number; femeninas: PlantillaSemana[]; masculinas: PlantillaSemana[] }[] {
    const semanas = [...new Set(this.plantillas.map(p => p.semana_numero))].sort((a, b) => a - b);
    return semanas.map(s => ({
      semana: s,
      femeninas: this.plantillas.filter(p => p.semana_numero === s && p.sexo_menu !== 'M'),
      masculinas: this.plantillas.filter(p => p.semana_numero === s && p.sexo_menu === 'M'),
    }));
  }

  numComidasLabel(n: number): string {
    return `${n} comidas/día`;
  }

  getTipoNombre(tcId: number): string {
    return TIPOS_COMIDA_MAP[tcId] ?? `Comida ${tcId}`;
  }
}
