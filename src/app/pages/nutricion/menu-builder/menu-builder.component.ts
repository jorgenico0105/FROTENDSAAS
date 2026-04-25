import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { NutricionService } from '../../../core/services/nutricion.service';
import { PlantillaMenuService } from '../../../core/services/plantilla-menu.service';
import { FormulariosService, HistoriaRespuestaRow } from '../../../core/services/formularios.service';
import {
  NutricionAlimento,
  NutricionMenu,
  NutricionPreferencia,
  NutricionMenuConDetalles,
  NutricionDietaPaciente,
  PlantillaSemana,
  AssignMenuFromPlantillaRequest,
  PlantillaDetalleInput,
  PlantillaAlimentoInput,
} from '../../../core/models/nutricion.model';

interface AssignAlimento {
  alimento_id: number;
  nombre: string;
  gramos_asignados: number;
  calorias_calc: number;
  proteinas_g_calc: number;
  carbohidratos_g_calc: number;
  grasas_g_calc: number;
}

interface AssignCell {
  dia_numero: number;
  tipo_comida_id: number;
  nombre_comida: string;
  instrucciones: string;
  nombre_receta: string;
  calorias_total: number;
  proteinas_g_total: number;
  carbohidratos_g_total: number;
  grasas_g_total: number;
  alimentos: AssignAlimento[];
}

interface CellAlimento {
  db_id?: number;        // NutricionMenuAlimento.ID — necesario para editar/eliminar
  alimento_id: number;
  nombre: string;
  gramos: number;
  gramosEdit?: number;   // valor temporal mientras se edita (modo gramos)
  unidadesEdit?: number; // valor temporal mientras se edita (modo unidades)
  cuartoEdit?: string;   // valor temporal para medida 'cuar' (ej: '1/2')
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

interface GridCell {
  dia_numero: number;
  tipo_comida_id: number;
  alimentos: CellAlimento[];
  detalle_id?: number;
  calorias: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  isDragOver: boolean;
  caloriasTarget?: number;
  proteinasTarget?: number;
  carbohidratosTarget?: number;
  grasasTarget?: number;
  nombre_receta?: string;
  recetaEdit?: string;
  editandoReceta?: boolean;
  savingReceta?: boolean;
  recetaGuardada?: boolean;
}

interface HistoriaGroup {
  id: number;
  nombre: string;
  fecha: string;
  observacion_general?: string | null;
  respuestas: HistoriaRespuestaRow[];
}

const ALL_DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_DEFAULT   = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function diasDesde(fechaInicio: string): string[] {
  const [y, m, d] = fechaInicio.substring(0, 10).split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return `${ALL_DAY_NAMES[date.getDay()]} ${date.getDate()} ${meses[date.getMonth()]}`;
  });
}

const TIPOS_COMIDA_DEFAULT = [
  { id: 1, codigo: 'DES', nombre: 'Desayuno' },
  { id: 2, codigo: 'MMA', nombre: 'Media Mañana' },
  { id: 3, codigo: 'ALM', nombre: 'Almuerzo' },
  { id: 4, codigo: 'MTA', nombre: 'Media Tarde' },
  { id: 5, codigo: 'CEN', nombre: 'Cena' }
];

@Component({
  selector: 'app-menu-builder',
  imports: [RouterLink, FormsModule, NgClass, DecimalPipe, DatePipe],
  templateUrl: './menu-builder.component.html',
  styleUrl: './menu-builder.component.scss'
})
export class MenuBuilderComponent implements OnInit, OnDestroy {
  readonly CUARTOS = [
    { label: '1/8', val: 0.125 }, { label: '1/4', val: 0.25  },
    { label: '1/2', val: 0.5   }, { label: '3/4', val: 0.75  },
    { label: '1',   val: 1     }, { label: '1 1/4', val: 1.25 },
    { label: '1 1/2', val: 1.5 }, { label: '2',   val: 2     },
  ];

  pacienteId = 0;
  dietaId = 0;
  isLoading = false;
  isExportingPdf = false;
  isLoadingPreview = false;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  private _pdfBlobUrl: string | null = null;
  successMsg = '';
  errorMsg = '';

  menus: NutricionMenu[] = [];
  selectedMenu: NutricionMenuConDetalles | null = null;

  grid: GridCell[][] = [];
  dias: string[] = DIAS_DEFAULT;
  tiposComida = TIPOS_COMIDA_DEFAULT;

  // Catalog panel
  alimentos: NutricionAlimento[] = [];
  filteredAlimentos: NutricionAlimento[] = [];
  alimentoSearch = '';
  dragAlimento: NutricionAlimento | null = null;
  preferencias: NutricionPreferencia[] = [];
  restriccionIds = new Set<number>();
  disgustoIds = new Set<number>();

  // Selected cell detail
  selectedCell: GridCell | null = null;
  showCellModal = false;

  // Dieta actual
  dieta: NutricionDietaPaciente | null = null;

  // Historias clínicas
  showHistoriasModal = false;
  historiasLoading = false;
  historiaGroups: HistoriaGroup[] = [];
  expandedHistorias = new Set<number>();

  // Asignar semana desde plantilla
  showAsignarModal = false;
  asignarStep: 1 | 2 = 1;
  plantillasAssign: PlantillaSemana[] = [];
  isLoadingPlantillasAssign = false;
  isLoadingPlantillaDetail = false;
  selectedPlantillaId = 0;
  assignCells: AssignCell[] = [];
  assignTiposComida: { id: number; nombre: string }[] = [];
  assignForm = { semana_numero: 1, fecha_inicio: new Date().toISOString().split('T')[0], nombre: '' };
  isAssigning = false;
  assignError = '';

  constructor(
    private route: ActivatedRoute,
    private svc: NutricionService,
    private plantillaSvc: PlantillaMenuService,
    private formulariosSvc: FormulariosService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnDestroy(): void {
    this._revokePdfUrl();
  }

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('pacienteId'));
    this.dietaId = Number(this.route.snapshot.paramMap.get('dietaId'));
    this.initGrid();
    this.isLoading = true;
    forkJoin({
      menus: this.svc.listMenusByDieta(this.pacienteId, this.dietaId),
      alimentos: this.svc.listAlimentos(),
      preferencias: this.svc.listPreferencias(this.pacienteId),
      dieta: this.svc.getDieta(this.pacienteId, this.dietaId),
    }).subscribe({
      next: (res) => {
        this.dieta = res.dieta;
        this.preferencias = res.preferencias;
        this.restriccionIds = new Set(
          res.preferencias
            .filter(p => p.tipo === 'RESTRICCION' && p.alimento_id != null)
            .map(p => p.alimento_id!)
        );
        this.disgustoIds = new Set(
          res.preferencias
            .filter(p => p.tipo === 'DISGUSTO' && p.alimento_id != null)
            .map(p => p.alimento_id!)
        );
        this.alimentos = res.alimentos.filter(a => !this.restriccionIds.has(a.id));
        this.filteredAlimentos = [...this.alimentos];
        this.menus = res.menus;
        if (res.menus.length > 0) {
          this.selectMenu(res.menus[0]);
        } else {
          this.isLoading = false;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  initGrid(): void {
    this.grid = Array.from({ length: 7 }, (_, d) =>
      this.tiposComida.map(tc => ({
        dia_numero: d + 1,
        tipo_comida_id: tc.id,
        alimentos: [],
        calorias: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0,
        isDragOver: false
      }))
    );
  }

  // ─── Menu management ──────────────────────────────────────────────────────

  selectMenu(menu: NutricionMenu): void {
    this.initGrid();
    this.isLoading = true;
    this.svc.getMenuConDetalles(this.pacienteId, menu.id).subscribe({
      next: (fullMenu) => {
        console.log(fullMenu.detalles)
        this.selectedMenu = fullMenu;
        this.dias = fullMenu.fecha_inicio ? diasDesde(fullMenu.fecha_inicio) : DIAS_DEFAULT;
        this.menus = this.menus.map(m => m.id === fullMenu.id ? fullMenu : m);
        this.populateGridFromDetalles(fullMenu);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  private populateGridFromDetalles(menu: NutricionMenuConDetalles): void {
    for (const detalle of menu.detalles ?? []) {

      const cell = this.getCell(detalle.dia_numero, detalle.tipo_comida_id);
      if (!cell) continue;
      cell.detalle_id = detalle.id;
      cell.caloriasTarget = detalle.calorias_total;
      cell.proteinasTarget = detalle.proteinas_g_total;
      cell.carbohidratosTarget = detalle.carbohidratos_g_total;
      cell.grasasTarget = detalle.grasas_g_total;
      cell.nombre_receta = detalle.nombre_receta;
      for (const da of detalle.alimentos ?? []) {
        const alim = da.Alimento;
        if (!alim) continue;
        const gramos = da.gramos_asignados;
        const ratio = gramos / (alim.gramos_porcion || 100);
        cell.alimentos.push({
          db_id: da.id,
          alimento_id: alim.id,
          nombre: alim.nombre,
          gramos,
          calorias: alim.calorias * ratio,
          proteinas_g: alim.proteinas_g * ratio,
          carbohidratos_g: alim.carbohidratos_g * ratio,
          grasas_g: alim.grasas_g * ratio,
          unidad: alim.unidad,
          gramos_unidad: alim.gramos_unidad,
          medida: alim.medida,
        });
      }
      this.recalcCell(cell);
    }
  }

  // ─── Grid helpers ─────────────────────────────────────────────────────────

  getCell(dia: number, tipoComidaId: number): GridCell | null {
    const tcIndex = this.tiposComida.findIndex(tc => tc.id === tipoComidaId);
    return this.grid[dia - 1]?.[tcIndex] ?? null;
  }

  tipoComidaNombre(id: number): string {
    return this.tiposComida.find(t => t.id === id)?.nombre ?? '';
  }

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  onDragStart(alimento: NutricionAlimento): void {
    this.dragAlimento = alimento;
  }

  onDragOver(event: DragEvent, cell: GridCell): void {
    event.preventDefault();
    cell.isDragOver = true;
  }

  onDragLeave(cell: GridCell): void {
    cell.isDragOver = false;
  }

  onDrop(event: DragEvent, cell: GridCell): void {
    event.preventDefault();
    cell.isDragOver = false;
    if (!this.dragAlimento || !this.selectedMenu) return;
    const alimento = this.dragAlimento;
    this.dragAlimento = null;
    const gramos = 100;

    const saveAlimento = (detalleId: number) => {
      this.svc.addAlimentoDetalle(this.pacienteId, detalleId, {
        alimento_id: alimento.id,
        gramos_asignados: gramos
      }).subscribe({
        next: (res) => {
          const ratio = gramos / (alimento.gramos_porcion || 100);
          cell.alimentos.push({
            db_id: res.id,
            alimento_id: alimento.id,
            nombre: alimento.nombre,
            gramos,
            calorias: alimento.calorias * ratio,
            proteinas_g: alimento.proteinas_g * ratio,
            carbohidratos_g: alimento.carbohidratos_g * ratio,
            grasas_g: alimento.grasas_g * ratio,
            unidad: alimento.unidad,
            gramos_unidad: alimento.gramos_unidad,
            medida: alimento.medida,
          });
          this.recalcCell(cell);
        },
        error: () => { this.errorMsg = 'Error al agregar alimento.'; }
      });
    };

    if (cell.detalle_id) {
      saveAlimento(cell.detalle_id);
    } else {
      this.svc.addDetalleMenu(this.pacienteId, this.selectedMenu.id, {
        tipo_comida_id: cell.tipo_comida_id,
        dia_numero: cell.dia_numero
      }).subscribe({
        next: (detalle) => {
          cell.detalle_id = detalle.id;
          saveAlimento(detalle.id);
        },
        error: () => { this.errorMsg = 'Error al crear el espacio de comida.'; }
      });
    }
  }

  removeAlimento(cell: GridCell, index: number): void {
    const ca = cell.alimentos[index];
    if (!ca.db_id || !cell.detalle_id) {
      cell.alimentos.splice(index, 1);
      this.recalcCell(cell);
      return;
    }
    this.svc.removeAlimentoDetalle(this.pacienteId, cell.detalle_id, ca.db_id).subscribe({
      next: () => {
        cell.alimentos.splice(index, 1);
        this.recalcCell(cell);
      },
      error: () => { this.errorMsg = 'Error al eliminar el alimento.'; }
    });
  }

  startEditGramos(ca: CellAlimento): void {
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

  cancelEditGramos(ca: CellAlimento): void {
    ca.editando = false;
    ca.gramosEdit = undefined;
    ca.unidadesEdit = undefined;
    ca.cuartoEdit = undefined;
  }

  saveGramos(cell: GridCell, ca: CellAlimento): void {
    let gramosToSave: number;
    if (ca.unidad && ca.gramos_unidad && ca.gramos_unidad > 0) {
      if (ca.medida === 'cuar') {
        const cuarto = this.CUARTOS.find(c => c.label === ca.cuartoEdit);
        gramosToSave = (cuarto?.val ?? 1) * ca.gramos_unidad;
      } else {
        gramosToSave = (ca.unidadesEdit ?? 1) * ca.gramos_unidad;
      }
    } else {
      gramosToSave = ca.gramosEdit ?? 0;
    }
    if (!ca.db_id || !cell.detalle_id || gramosToSave <= 0) return;
    ca.saving = true;
    this.svc.updateAlimentoDetalle(this.pacienteId, cell.detalle_id, ca.db_id, gramosToSave).subscribe({
      next: (res) => {
        ca.gramos = res.gramos_asignados;
        ca.calorias = res.calorias_calc ?? ca.calorias;
        ca.proteinas_g = res.proteinas_g_calc ?? ca.proteinas_g;
        ca.carbohidratos_g = res.carbohidratos_g_calc ?? ca.carbohidratos_g;
        ca.grasas_g = res.grasas_g_calc ?? ca.grasas_g;
        ca.editando = false;
        ca.gramosEdit = undefined;
        ca.saving = false;
        this.recalcCell(cell);
      },
      error: () => {
        this.errorMsg = 'Error al actualizar el gramaje.';
        ca.saving = false;
      }
    });
  }

  recalcCell(cell: GridCell): void {
    cell.calorias       = cell.alimentos.reduce((s, a) => s + a.calorias, 0);
    cell.proteinas_g    = cell.alimentos.reduce((s, a) => s + a.proteinas_g, 0);
    cell.carbohidratos_g = cell.alimentos.reduce((s, a) => s + a.carbohidratos_g, 0);
    cell.grasas_g       = cell.alimentos.reduce((s, a) => s + a.grasas_g, 0);
  }

  // ─── Totals ───────────────────────────────────────────────────────────────

  getDayTotal(diaIndex: number): { cal: number; pro: number; carb: number; fat: number } {
    const row = this.grid[diaIndex];
    return {
      cal:  row.reduce((s, c) => s + c.calorias, 0),
      pro:  row.reduce((s, c) => s + c.proteinas_g, 0),
      carb: row.reduce((s, c) => s + c.carbohidratos_g, 0),
      fat:  row.reduce((s, c) => s + c.grasas_g, 0)
    };
  }

  getWeekTotal(): { cal: number; pro: number; carb: number; fat: number } {
    return this.grid.reduce((acc, row) => {
      row.forEach(c => {
        acc.cal  += c.calorias;
        acc.pro  += c.proteinas_g;
        acc.carb += c.carbohidratos_g;
        acc.fat  += c.grasas_g;
      });
      return acc;
    }, { cal: 0, pro: 0, carb: 0, fat: 0 });
  }

  // ─── Catalog filter ───────────────────────────────────────────────────────

  filterAlimentos(): void {
    const q = this.alimentoSearch.toLowerCase();
    this.filteredAlimentos = q
      ? this.alimentos.filter(a =>
          a.nombre.toLowerCase().includes(q) ||
          (a.categoria || '').toLowerCase().includes(q)
        )
      : [...this.alimentos];
  }

  // ─── Macro comparison ─────────────────────────────────────────────────────

  cellStatus(cell: GridCell): 'ok' | 'warn' | 'empty' {
    if (cell.alimentos.length === 0) return 'empty';
    if (cell.tipo_comida_id === 2 || cell.tipo_comida_id === 4) return 'ok';
    const hasTargets = cell.proteinasTarget != null || cell.carbohidratosTarget != null;
    if (!hasTargets) return 'empty';
    const TOLERANCE = 10;
    const within = (real: number, target?: number) =>
      target == null || Math.abs(real - target) <= TOLERANCE;
    const ok = within(cell.proteinas_g, cell.proteinasTarget)
      && within(cell.carbohidratos_g, cell.carbohidratosTarget);
    return ok ? 'ok' : 'warn';
  }

  exportarPdf(): void {
    if (!this.selectedMenu || this.isExportingPdf) return;
    this.isExportingPdf = true;
    this.svc.generateMenuPdf(this.selectedMenu.id).subscribe({
      next: (blob) => {
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        const nombre = this.selectedMenu?.nombre ?? `semana-${this.selectedMenu?.semana_numero ?? 1}`;
        a.href     = url;
        a.download = `menu-${nombre.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.isExportingPdf = false;
      },
      error: () => { this.isExportingPdf = false; }
    });
  }

  previsualizarPdf(): void {
    if (!this.selectedMenu || this.isLoadingPreview) return;
    this.isLoadingPreview = true;
    this.svc.generateMenuPdf(this.selectedMenu.id).subscribe({
      next: (blob) => {
        this._revokePdfUrl();
        this._pdfBlobUrl = URL.createObjectURL(blob);
        this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this._pdfBlobUrl);
        this.isLoadingPreview = false;
      },
      error: () => { this.isLoadingPreview = false; }
    });
  }

  cerrarPreview(): void {
    this._revokePdfUrl();
    this.pdfPreviewUrl = null;
  }

  private _revokePdfUrl(): void {
    if (this._pdfBlobUrl) {
      URL.revokeObjectURL(this._pdfBlobUrl);
      this._pdfBlobUrl = null;
    }
  }

  // ─── Cell modal ───────────────────────────────────────────────────────────

  openCell(cell: GridCell): void {
    this.selectedCell = cell;
    this.showCellModal = true;
  }

  // ─── Receta ───────────────────────────────────────────────────────────────

  startEditReceta(cell: GridCell): void {
    cell.recetaEdit = cell.nombre_receta ?? '';
    cell.editandoReceta = true;
  }

  cancelEditReceta(cell: GridCell): void {
    cell.editandoReceta = false;
    cell.recetaEdit = undefined;
  }

  // ─── Formato de cantidad con unidades ────────────────────────────────────

  private toFraccion(n: number): string {
    const FRACS = [
      { val: 1/8, label: '1/8' },
      { val: 1/4, label: '1/4' },
      { val: 1/2, label: '1/2' },
      { val: 3/4, label: '3/4' },
    ];
    const intPart = Math.floor(n);
    const dec = n - intPart;
    if (dec < 0.06) return intPart > 0 ? `${intPart}` : '1/8';
    const closest = FRACS.reduce((a, b) => Math.abs(dec - b.val) < Math.abs(dec - a.val) ? b : a);
    return intPart > 0 ? `${intPart} ${closest.label}` : closest.label;
  }

  formatCantidad(gramos: number, ca: CellAlimento): string {
    if (ca.unidad && ca.gramos_unidad && ca.gramos_unidad > 0) {
      const ratio = gramos / ca.gramos_unidad;
      if (ca.medida === 'cuar') return this.toFraccion(ratio);
      const qty = Math.ceil(ratio);
      const label = ca.medida === 'cdta' ? 'cucharada' : (ca.medida ?? 'uni');
      return `${qty} ${label}`;
    }
    return `${gramos}g`;
  }

  // ─── Asignar semana desde plantilla ─────────────────────────────────────

  openAsignarModal(): void {
    this.asignarStep = 1;
    this.selectedPlantillaId = 0;
    this.assignCells = [];
    this.assignError = '';
    this.assignForm = {
      semana_numero: (this.menus.length + 1),
      fecha_inicio: new Date().toISOString().split('T')[0],
      nombre: '',
    };
    this.showAsignarModal = true;
    this.fetchPlantillas();
  }

  private fetchPlantillas(): void {
    if (!this.dieta) return;
    this.isLoadingPlantillasAssign = true;
    this.selectedPlantillaId = 0;
    this.assignCells = [];
    this.plantillaSvc.list({
      semana_numero: this.assignForm.semana_numero || undefined,
    }).subscribe({
      next: (p) => {
        this.plantillasAssign = p;
        this.isLoadingPlantillasAssign = false;
        if (p.length === 1) this.selectPlantillaForAssign(p[0].id);
      },
      error: () => { this.isLoadingPlantillasAssign = false; }
    });
  }

  refetchPlantillasBySemana(): void {
    this.fetchPlantillas();
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
    const TIPOS_MAP: Record<number, string> = {
      1: 'Desayuno', 2: 'Media Mañana', 3: 'Almuerzo', 4: 'Media Tarde', 5: 'Cena'
    };
    const detalles = p.detalles ?? [];
    const tipoIds = [...new Set(detalles.map(d => d.tipo_comida_id))].sort((a, b) => a - b);
    this.assignTiposComida = tipoIds.map(id => ({ id, nombre: TIPOS_MAP[id] ?? `Comida ${id}` }));
    this.assignCells = detalles.map(d => ({
      dia_numero: d.dia_numero,
      tipo_comida_id: d.tipo_comida_id,
      nombre_comida: d.nombre_comida,
      instrucciones: d.instrucciones,
      nombre_receta: d.nombre_receta,
      calorias_total: d.calorias_total,
      proteinas_g_total: d.proteinas_g_total,
      carbohidratos_g_total: d.carbohidratos_g_total,
      grasas_g_total: d.grasas_g_total,
      alimentos: (d.alimentos ?? []).map(a => ({
        alimento_id: a.alimento_id,
        nombre: a.Alimento?.nombre ?? `Alimento #${a.alimento_id}`,
        gramos_asignados: a.gramos_asignados,
        calorias_calc: a.calorias_calc,
        proteinas_g_calc: a.proteinas_g_calc,
        carbohidratos_g_calc: a.carbohidratos_g_calc,
        grasas_g_calc: a.grasas_g_calc,
      })),
    }));
  }

  goToAssignStep2(): void {
    if (!this.selectedPlantillaId) return;
    this.asignarStep = 2;
  }

  submitAssign(): void {
    if (!this.assignForm.fecha_inicio) {
      this.assignError = 'La fecha de inicio es requerida.';
      return;
    }
    this.isAssigning = true;
    this.assignError = '';
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
    this.svc.assignMenuFromPlantilla(this.pacienteId, this.dietaId, body).subscribe({
      next: (menu) => {
        this.menus.push(menu);
        this.showAsignarModal = false;
        this.isAssigning = false;
        this.successMsg = 'Semana asignada correctamente.';
        setTimeout(() => { this.successMsg = ''; }, 3000);
        this.selectMenu(menu);
      },
      error: (err) => {
        this.assignError = err?.error?.message || 'Error al asignar el menú.';
        this.isAssigning = false;
      }
    });
  }

  getAssignCell(diaN: number, tcId: number): AssignCell | undefined {
    return this.assignCells.find(c => c.dia_numero === diaN && c.tipo_comida_id === tcId);
  }

  // ─── Historias clínicas ──────────────────────────────────────────────────

  openHistoriasModal(): void {
    this.showHistoriasModal = true;
    if (this.historiaGroups.length > 0) return;
    this.historiasLoading = true;
    this.formulariosSvc.getHistoriasRespuestas(this.pacienteId).subscribe({
      next: (rows) => {
        const map = new Map<number, HistoriaGroup>();
        for (const row of rows) {
          if (!map.has(row.id_historia_clinica)) {
            map.set(row.id_historia_clinica, {
              id: row.id_historia_clinica,
              nombre: row.nombre_formulario,
              fecha: row.fecha_registro,
              observacion_general: row.observacion_general,
              respuestas: [],
            });
          }
          map.get(row.id_historia_clinica)!.respuestas.push(row);
        }
        this.historiaGroups = Array.from(map.values()).sort((a, b) => a.id - b.id);
        if (this.historiaGroups.length > 0) this.expandedHistorias.add(this.historiaGroups[0].id);
        this.historiasLoading = false;
      },
      error: () => { this.historiasLoading = false; }
    });
  }

  toggleHistoria(id: number): void {
    if (this.expandedHistorias.has(id)) this.expandedHistorias.delete(id);
    else this.expandedHistorias.add(id);
  }

  formatRespuesta(row: HistoriaRespuestaRow): string {
    const txt = row.respuesta_text?.trim() ?? '';
    if (txt === 'true')  return 'Sí';
    if (txt === 'false') return 'No';
    if (txt && txt !== '0') return txt;
    if (row.respuesta_numero !== null && row.respuesta_numero !== undefined) return String(row.respuesta_numero);
    return '—';
  }

  isRespuestaEmpty(row: HistoriaRespuestaRow): boolean {
    const txt = row.respuesta_text?.trim() ?? '';
    return (!txt || txt === '0' || txt === 'false') && (row.respuesta_numero === null || row.respuesta_numero === 0);
  }

  // ─── Diff macros plantilla vs objetivo dieta ─────────────────────────────

  getPlantillaDayAvg(): { cal: number; pro: number; carb: number; fat: number } {
    if (this.assignCells.length === 0) return { cal: 0, pro: 0, carb: 0, fat: 0 };
    return {
      cal:  this.assignCells.reduce((s, c) => s + c.calorias_total, 0) / 7,
      pro:  this.assignCells.reduce((s, c) => s + c.proteinas_g_total, 0) / 7,
      carb: this.assignCells.reduce((s, c) => s + c.carbohidratos_g_total, 0) / 7,
      fat:  this.assignCells.reduce((s, c) => s + c.grasas_g_total, 0) / 7,
    };
  }

  pct(real: number, target: number | undefined): number {
    if (!target) return 0;
    return Math.min((real / target) * 100, 100);
  }

  diffStatus(real: number, target: number | undefined): 'ok' | 'warn' | 'danger' | 'none' {
    if (!target) return 'none';
    const pct = Math.abs((real - target) / target) * 100;
    if (pct <= 5)  return 'ok';
    if (pct <= 15) return 'warn';
    return 'danger';
  }

  get restriccionesAlimentos(): { nombre: string; notas?: string }[] {
    return this.preferencias
      .filter(p => p.tipo === 'RESTRICCION')
      .map(p => ({ nombre: p.Alimento?.nombre || p.nombre_libre || '?', notas: p.notas }));
  }

  get disgustosAlimentos(): { nombre: string; notas?: string }[] {
    return this.preferencias
      .filter(p => p.tipo === 'DISGUSTO')
      .map(p => ({ nombre: p.Alimento?.nombre || p.nombre_libre || '?', notas: p.notas }));
  }

  saveReceta(cell: GridCell): void {
    if (!cell.detalle_id || cell.recetaEdit === undefined) return;
    cell.savingReceta = true;
    this.svc.updateDetalleReceta(this.pacienteId, cell.detalle_id, cell.recetaEdit).subscribe({
      next: () => {
        cell.nombre_receta = cell.recetaEdit;
        cell.editandoReceta = false;
        cell.recetaEdit = undefined;
        cell.savingReceta = false;
        cell.recetaGuardada = true;
        setTimeout(() => { cell.recetaGuardada = false; }, 2500);
      },
      error: () => {
        this.errorMsg = 'Error al guardar la receta.';
        cell.savingReceta = false;
      }
    });
  }
}
