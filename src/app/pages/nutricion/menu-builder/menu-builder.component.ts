import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { NutricionService } from '../../../core/services/nutricion.service';
import {
  NutricionAlimento,
  NutricionMenu, CreateMenuRequest,
  NutricionPreferencia,
  NutricionMenuConDetalles,
} from '../../../core/models/nutricion.model';

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
  imports: [RouterLink, FormsModule, NgClass, DecimalPipe],
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
  showMenuModal = false;
  menuForm: CreateMenuRequest = { semana_numero: 1, fecha_inicio: '' };

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

  // Selected cell detail
  selectedCell: GridCell | null = null;
  showCellModal = false;

  constructor(
    private route: ActivatedRoute,
    private svc: NutricionService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnDestroy(): void {
    this._revokePdfUrl();
  }

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('pacienteId'));
    this.dietaId = Number(this.route.snapshot.paramMap.get('dietaId'));
    this.initGrid();
    this.resetMenuForm(1);
    this.isLoading = true;
    forkJoin({
      menus: this.svc.listMenusByDieta(this.pacienteId, this.dietaId),
      alimentos: this.svc.listAlimentos(),
      preferencias: this.svc.listPreferencias(this.pacienteId)
    }).subscribe({
      next: (res) => {
        this.preferencias = res.preferencias;
        this.restriccionIds = new Set(
          res.preferencias
            .filter(p => p.tipo === 'RESTRICCION' && p.alimento_id != null)
            .map(p => p.alimento_id!)
        );
        this.alimentos = res.alimentos.filter(a => !this.restriccionIds.has(a.id));
        this.filteredAlimentos = [...this.alimentos];
        this.menus = res.menus;
        if (res.menus.length > 0) {
          this.selectMenu(res.menus[0]);
        } else {
          // No menus: show inline form with defaults
          this.resetMenuForm(1);
          this.isLoading = false;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  private resetMenuForm(semanaNum: number): void {
    this.menuForm = {
      semana_numero: semanaNum,
      fecha_inicio: new Date().toISOString().split('T')[0],
      nombre: `Semana ${semanaNum}`,
      notas: ''
    };
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

  openMenuModal(): void {
    this.resetMenuForm(this.menus.length + 1);
    this.errorMsg = '';
    this.showMenuModal = true;
  }

  saveMenu(): void {
    if (!this.menuForm.fecha_inicio) {
      this.errorMsg = 'La fecha de inicio es requerida.';
      return;
    }
    this.isLoading = true;
    this.errorMsg = '';
    this.svc.createMenu(this.pacienteId, this.dietaId, this.menuForm).subscribe({
      next: (menu) => {
        this.menus.push(menu);
        this.showMenuModal = false;
        this.selectMenu(menu); // auto-fetch full menu + populate grid
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al crear menú.';
        this.isLoading = false;
      }
    });
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
