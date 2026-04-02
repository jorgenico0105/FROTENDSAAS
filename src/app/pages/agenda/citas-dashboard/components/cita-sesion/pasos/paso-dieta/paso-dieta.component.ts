import { Component, ElementRef, Inject, Input, OnChanges, Output, EventEmitter, PLATFORM_ID, SimpleChanges, ViewChild } from '@angular/core';
import { DecimalPipe, isPlatformBrowser, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutricionService } from '../../../../../../../core/services/nutricion.service';
import {
  CreateDietaRequest, DatosNutricionales, NutricionDietaPaciente
} from '../../../../../../../core/models/nutricion.model';

@Component({
  selector: 'app-paso-dieta',
  standalone: true,
  imports: [FormsModule, NgClass, DecimalPipe],
  templateUrl: './paso-dieta.component.html'
})
export class PasoDietaComponent implements OnChanges {
  @Input() pacienteId = 0;
  @Input() medicoId   = 0;
  @Input() caloriasObjetivo = 2000;
  @Input() datosNutricionales: DatosNutricionales | null = null;

  @Input() set activo(val: boolean) {
    if (val) this.renderCharts();
  }

  @Output() caloriasObjetivoChange = new EventEmitter<number>();
  @Output() guardadoOk    = new EventEmitter<NutricionDietaPaciente>();
  @Output() guardadoError = new EventEmitter<string>();

  @ViewChild('chartPesoEl')        chartPesoEl!:        ElementRef;
  @ViewChild('chartComposicionEl') chartComposicionEl!: ElementRef;

  numComidas   = 3;
  duracionDias = 30;
  nombrePlan   = '';
  objetivo     = '';
  pctProteinas = 30;
  pctCarbos    = 40;
  pctGrasas    = 30;

  isBusy   = false;
  guardado = false;

  private chartPeso: any        = null;
  private chartComposicion: any = null;

  get hasFormulario(): boolean { return true; }
  get macroTotal(): number { return this.pctProteinas + this.pctCarbos + this.pctGrasas; }
  get proteinasG(): number { return Math.round((this.caloriasObjetivo * this.pctProteinas / 100) / 4); }
  get carbosG(): number    { return Math.round((this.caloriasObjetivo * this.pctCarbos    / 100) / 4); }
  get grasasG(): number    { return Math.round((this.caloriasObjetivo * this.pctGrasas    / 100) / 9); }

  get deficitDiario(): number {
    return (this.datosNutricionales?.get_diario ?? 0) - this.caloriasObjetivo;
  }

  get perdidaSemanalKg(): number {
    return (this.deficitDiario * 7) / 7700;
  }

  get pesoFinal(): number {
    if (!this.datosNutricionales?.peso_kg) return 0;
    return Math.max(this.datosNutricionales.peso_kg - this.perdidaSemanalKg * (this.duracionDias / 7), 40);
  }

  get tieneProyeccion(): boolean {
    return !!(this.datosNutricionales?.get_diario && this.datosNutricionales?.peso_kg);
  }

  constructor(
    private nutricionSvc: NutricionService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datosNutricionales'] && this.datosNutricionales) {
      this.renderCharts();
    }
  }

  onCaloriasChange(val: number): void {
    this.caloriasObjetivo = val;
    this.caloriasObjetivoChange.emit(val);
    this.renderCharts();
  }

  onDuracionChange(): void {
    this.renderCharts();
  }

  iniciarGuardado(): void {
    this.isBusy = true;
    const req: CreateDietaRequest = {
      nombre:               this.nombrePlan.trim() || `Dieta nutricional ${this.todayStr()}`,
      objetivo:             this.objetivo,
      fecha_inicio:         this.todayStr(),
      num_comidas:          this.numComidas,
      duracion_dias:        this.duracionDias,
      calorias_dia_objetivo: this.caloriasObjetivo,
      proteinas_g_dia:      this.proteinasG,
      carbohidratos_g_dia:  this.carbosG,
      grasas_g_dia:         this.grasasG,
    };
    this.nutricionSvc.createDieta(this.pacienteId, req).subscribe({
      next: (dieta: NutricionDietaPaciente) => {
        this.isBusy = false; this.guardado = true; this.guardadoOk.emit(dieta);
      },
      error: (err: { error?: { message?: string } }) => {
        this.isBusy = false;
        this.guardadoError.emit(err?.error?.message || 'Error al crear la dieta.');
      }
    });
  }

  omitir(): void { this.guardado = true; }

  // ── Charts ────────────────────────────────────────────────────────────────

  private buildProjection(): { cats: string[]; pesos: number[]; grasas: number[]; magras: number[] } {
    const d     = this.datosNutricionales!;
    const sem   = Math.max(Math.ceil(this.duracionDias / 7), 1);
    const loss  = this.perdidaSemanalKg;

    const age   = d.edad ?? 30;
    const imc   = d.imc  ?? 25;
    const bfRaw = d.sexo === 'M'
      ? (1.2 * imc) + (0.23 * age) - 16.2
      : (1.2 * imc) + (0.23 * age) - 5.4;
    const bfPct = Math.max(5, Math.min(65, bfRaw));

    const grasaInicial = d.peso_kg * bfPct / 100;
    const magraInicial = d.peso_kg - grasaInicial;

    const cats:   string[] = ['Inicio'];
    const pesos:  number[] = [+d.peso_kg.toFixed(1)];
    const grasas: number[] = [+grasaInicial.toFixed(1)];
    const magras: number[] = [+magraInicial.toFixed(1)];

    for (let s = 1; s <= sem; s++) {
      cats.push(`S${s}`);
      const peso  = Math.max(d.peso_kg - loss * s, 40);
      const magra = Math.max(magraInicial - (d.peso_kg - peso) * 0.05, 30);
      const grasa = Math.max(peso - magra, 1);
      pesos.push(+peso.toFixed(1));
      magras.push(+magra.toFixed(1));
      grasas.push(+grasa.toFixed(1));
    }
    return { cats, pesos, grasas, magras };
  }

  async renderCharts(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.tieneProyeccion) return;
    if (!this.chartPesoEl?.nativeElement || !this.chartComposicionEl?.nativeElement) return;

    const Apex  = (await import('apexcharts')).default;
    const { cats, pesos, grasas, magras } = this.buildProjection();
    const dark  = document.documentElement.classList.contains('dark');
    const text  = dark ? '#94a3b8' : '#64748b';
    const grid  = dark ? '#172036' : '#e2e8f0';
    const bg    = dark ? '#0c1427' : '#ffffff';
    const minP  = Math.floor(Math.min(...pesos) - 3);
    const maxP  = Math.ceil(Math.max(...pesos) + 2);

    if (this.chartPeso)        { this.chartPeso.destroy();        this.chartPeso = null; }
    if (this.chartComposicion) { this.chartComposicion.destroy(); this.chartComposicion = null; }

    this.chartPeso = new Apex(this.chartPesoEl.nativeElement, {
      chart:      { type: 'area', height: 210, background: bg, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
      series:     [{ name: 'Peso proyectado (kg)', data: pesos }],
      xaxis:      { categories: cats, labels: { style: { colors: text, fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis:      { min: minP, max: maxP, labels: { style: { colors: text, fontSize: '11px' }, formatter: (v: number) => `${v} kg` } },
      stroke:     { curve: 'smooth', width: 2.5 },
      fill:       { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02 } },
      colors:     ['#3584FC'],
      grid:       { borderColor: grid, strokeDashArray: 4, padding: { left: 8, right: 8, top: -10 } },
      dataLabels: { enabled: false },
      tooltip:    { theme: dark ? 'dark' : 'light', y: { formatter: (v: number) => `${v} kg` } },
      annotations: { yaxis: [{ y: +this.pesoFinal.toFixed(1), borderColor: '#25B003', borderWidth: 1.5, strokeDashArray: 5,
        label: { text: `Meta: ${this.pesoFinal.toFixed(1)} kg`, style: { color: '#25B003', background: 'transparent', fontSize: '11px', fontWeight: 600 }, position: 'right', offsetX: -8 }
      }]}
    });
    this.chartPeso.render();

    this.chartComposicion = new Apex(this.chartComposicionEl.nativeElement, {
      chart:      { type: 'area', height: 210, background: bg, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', stacked: true },
      series:     [{ name: 'Masa grasa (kg)', data: grasas }, { name: 'Masa magra (kg)', data: magras }],
      xaxis:      { categories: cats, labels: { style: { colors: text, fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis:      { labels: { style: { colors: text, fontSize: '11px' }, formatter: (v: number) => `${v} kg` } },
      stroke:     { curve: 'smooth', width: 2 },
      fill:       { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.08 } },
      colors:     ['#FD5812', '#3584FC'],
      grid:       { borderColor: grid, strokeDashArray: 4, padding: { left: 8, right: 8, top: -5 } },
      dataLabels: { enabled: false },
      legend:     { position: 'top', labels: { colors: text }, fontSize: '11px', markers: { size: 6 } },
      tooltip:    { theme: dark ? 'dark' : 'light', y: { formatter: (v: number) => `${v} kg` } },
    });
    this.chartComposicion.render();
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}
