import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass, DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { NutricionService } from '../../../core/services/nutricion.service';
import { PacientesService } from '../../../core/services/pacientes.service';
import {
  NutricionDietaPaciente,
  NutricionMenu,
  NutricionMenuConDetalles,
  NutricionMenuDetalleConAlimentos,
  NutricionMenuAlimentoDetalle,
} from '../../../core/models/nutricion.model';
import { Paciente } from '../../../core/models/pacientes.model';

const ALL_DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_CORTOS  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function diasDesde(fechaInicio: string): string[] {
  const [y, m, d] = fechaInicio.substring(0, 10).split('-').map(Number);
  const start = new Date(y, m - 1, d);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return `${ALL_DAY_NAMES[date.getDay()]} ${date.getDate()} ${MESES_CORTOS[date.getMonth()]}`;
  });
}
const TIPOS_COMIDA = [
  { id: 1, nombre: 'Desayuno' },
  { id: 2, nombre: 'Media Mañana' },
  { id: 3, nombre: 'Almuerzo' },
  { id: 4, nombre: 'Media Tarde' },
  { id: 5, nombre: 'Cena' },
];

interface GridCell {
  dia: number;
  tipoComidaId: number;
  detalles: NutricionMenuDetalleConAlimentos[];
  calorias: number;
  proteinas: number;
  carbos: number;
  grasas: number;
}

@Component({
  selector: 'app-detalle-dieta',
  standalone: true,
  imports: [NgClass, DecimalPipe],
  templateUrl: './detalle-dieta.component.html',
})
export class DetalleDietaComponent implements OnInit {
  pacienteId = 0;
  dietaId = 0;

  isLoading = true;
  isLoadingMenu = false;

  paciente: Paciente | null = null;
  dieta: NutricionDietaPaciente | null = null;
  menus: NutricionMenu[] = [];
  menuSeleccionado: NutricionMenuConDetalles | null = null;

  grid: GridCell[][] = []; // [dia][tipoComida]
  dias: string[] = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  readonly tiposComida = TIPOS_COMIDA;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nutricionSvc: NutricionService,
    private pacientesSvc: PacientesService,
  ) {}

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('pacienteId'));
    this.dietaId    = Number(this.route.snapshot.paramMap.get('dietaId'));
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    forkJoin({
      dieta:   this.nutricionSvc.getDieta(this.pacienteId, this.dietaId),
      menus:   this.nutricionSvc.listMenusByDieta(this.pacienteId, this.dietaId),
      pacientes: this.pacientesSvc.list(),
    }).subscribe({
      next: res => {
        this.dieta   = res.dieta;
        this.menus   = res.menus;
        this.paciente = res.pacientes.data.find(p => p.id === this.pacienteId) ?? null;
        this.isLoading = false;
        if (this.menus.length > 0) {
          this.seleccionarMenu(this.menuActivo() ?? this.menus[0]);
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  seleccionarMenu(menu: NutricionMenu): void {
    if (this.menuSeleccionado?.id === menu.id) return;
    this.isLoadingMenu = true;
    this.menuSeleccionado = null;
    this.nutricionSvc.getMenuConDetalles(this.pacienteId, menu.id).subscribe({
      next: full => {
        this.menuSeleccionado = full;
        this.dias = full.fecha_inicio ? diasDesde(full.fecha_inicio) : this.dias;
        this.buildGrid(full);
        this.isLoadingMenu = false;
      },
      error: () => { this.isLoadingMenu = false; }
    });
  }

  realMacrosAlim(alim: NutricionMenuAlimentoDetalle): { cal: number; pro: number; carb: number; fat: number } {
    if (alim.Alimento && alim.Alimento.gramos_porcion > 0) {
      const r = alim.gramos_asignados / alim.Alimento.gramos_porcion;
      return {
        cal:  alim.Alimento.calorias        * r,
        pro:  alim.Alimento.proteinas_g     * r,
        carb: alim.Alimento.carbohidratos_g * r,
        fat:  alim.Alimento.grasas_g        * r,
      };
    }
    return {
      cal:  alim.macros_calc?.calorias         ?? 0,
      pro:  alim.macros_calc?.proteinas_g      ?? 0,
      carb: alim.macros_calc?.carbohidratos_g  ?? 0,
      fat:  alim.macros_calc?.grasas_g         ?? 0,
    };
  }

  private buildGrid(menu: NutricionMenuConDetalles): void {
    this.grid = Array.from({ length: 7 }, (_, dIdx) =>
      this.tiposComida.map(tc => {
        const detalles = (menu.detalles ?? []).filter(
          d => d.dia_numero === dIdx + 1 && d.tipo_comida_id === tc.id
        );
        let calorias = 0, proteinas = 0, carbos = 0, grasas = 0;
        for (const det of detalles) {
          for (const a of det.alimentos ?? []) {
            const m = this.realMacrosAlim(a);
            calorias  += m.cal;
            proteinas += m.pro;
            carbos    += m.carb;
            grasas    += m.fat;
          }
        }
        return { dia: dIdx + 1, tipoComidaId: tc.id, detalles, calorias, proteinas, carbos, grasas };
      })
    );
  }

  menuActivo(): NutricionMenu | null {
    if (!this.menus.length) return null;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return this.menus.find(m => {
      const ini = new Date(m.fecha_inicio); ini.setHours(0, 0, 0, 0);
      const fin = new Date(ini); fin.setDate(fin.getDate() + 6);
      return hoy >= ini && hoy <= fin;
    }) ?? null;
  }

  get diaTotal(): { cal: number; pro: number; carb: number; fat: number }[] {
    return this.grid.map(row => ({
      cal:  row.reduce((s, c) => s + c.calorias, 0),
      pro:  row.reduce((s, c) => s + c.proteinas, 0),
      carb: row.reduce((s, c) => s + c.carbos, 0),
      fat:  row.reduce((s, c) => s + c.grasas, 0),
    }));
  }

  get semanaTotal(): { cal: number; pro: number; carb: number; fat: number } {
    return this.diaTotal.reduce(
      (acc, d) => ({ cal: acc.cal + d.cal, pro: acc.pro + d.pro, carb: acc.carb + d.carb, fat: acc.fat + d.fat }),
      { cal: 0, pro: 0, carb: 0, fat: 0 }
    );
  }

  irMenuBuilder(): void {
    this.router.navigate(['/dashboard/nutricion/pacientes', this.pacienteId, 'menu-builder', this.dietaId]);
  }

  volver(): void {
    this.router.navigate(['/dashboard/nutricion/dietas']);
  }

  estadoBadge(estado: string): string {
    const map: Record<string, string> = {
      ACTIVA:     'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      COMPLETADA: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
      CANCELADA:  'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
      PAUSADA:    'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-500';
  }

  esMenuActivo(menu: NutricionMenu): boolean {
    const activo = this.menuActivo();
    return activo?.id === menu.id;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateShort(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  nombrePaciente(): string {
    if (!this.paciente) return `Paciente #${this.pacienteId}`;
    return `${this.paciente.nombres} ${this.paciente.apellidos}`;
  }

  inicialesPaciente(): string {
    if (!this.paciente) return '?';
    return (this.paciente.nombres.charAt(0) + this.paciente.apellidos.charAt(0)).toUpperCase();
  }

  cellHasFood(cell: GridCell): boolean {
    return cell.detalles.some(d => (d.alimentos?.length ?? 0) > 0);
  }
}
