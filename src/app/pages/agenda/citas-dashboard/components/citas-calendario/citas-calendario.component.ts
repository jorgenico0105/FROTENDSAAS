import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { AgendaService } from '../../../../../core/services/agenda.service';
import { Cita, ESTADO_COLORS, ESTADO_DOT } from '../../../../../core/models/agenda.model';

interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  citas: Cita[];
}

@Component({
  selector: 'app-citas-calendario',
  standalone: true,
  imports: [NgClass, TitleCasePipe],
  templateUrl: './citas-calendario.component.html'
})
export class CitasCalendarioComponent implements OnInit, OnChanges {
  @Input() medicoId  = 0;
  @Input() clinicaId = 0;

  @Output() nuevaCitaFecha = new EventEmitter<string>();
  @Output() iniciarSesion  = new EventEmitter<Cita>();

  weeks: CalendarDay[][] = [];
  currentDate    = new Date();
  selectedDay: CalendarDay | null = null;
  isLoadingMonth = false;

  private citasByDate = new Map<string, Cita[]>();

  readonly DIAS  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  readonly ESTADO_COLORS = ESTADO_COLORS;
  readonly ESTADO_DOT    = ESTADO_DOT;

  constructor(private agendaSvc: AgendaService) {}

  ngOnInit(): void  { this.loadMonth(); }
  ngOnChanges(): void { if (this.medicoId || this.clinicaId) this.loadMonth(); }

  get mesLabel(): string {
    return `${this.MESES[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.selectedDay = null;
    this.loadMonth();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.selectedDay = null;
    this.loadMonth();
  }

  selectDay(day: CalendarDay): void { this.selectedDay = day; }

  private loadMonth(): void {
    this.isLoadingMonth = true;
    this.citasByDate.clear();
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    const p: { medico_id?: number; clinica_id?: number; size: number } = { size: 200 };
    if (this.medicoId)  p.medico_id  = this.medicoId;
    if (this.clinicaId) p.clinica_id = this.clinicaId;

    this.agendaSvc.listCitas(p).subscribe({
      next: res => {
        for (const cita of res.data) {
          const ds = cita.fecha.split('T')[0];
          if (!this.citasByDate.has(ds)) this.citasByDate.set(ds, []);
          this.citasByDate.get(ds)!.push(cita);
        }
        this.buildGrid(y, m);
        this.isLoadingMonth = false;
      },
      error: () => { this.buildGrid(y, m); this.isLoadingMonth = false; }
    });
  }

  private buildGrid(year: number, month: number): void {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const todayStr = this.toDateStr(new Date());
    let start      = new Date(firstDay);
    const dow      = (firstDay.getDay() + 6) % 7;
    start.setDate(start.getDate() - dow);
    this.weeks = [];
    let cursor = new Date(start);
    while (cursor <= lastDay || this.weeks.length < 6) {
      const week: CalendarDay[] = [];
      for (let i = 0; i < 7; i++) {
        const ds = this.toDateStr(cursor);
        week.push({ date: new Date(cursor), dateStr: ds,
          isCurrentMonth: cursor.getMonth() === month,
          isToday: ds === todayStr, citas: this.citasByDate.get(ds) ?? [] });
        cursor.setDate(cursor.getDate() + 1);
      }
      this.weeks.push(week);
      if (this.weeks.length >= 6) break;
    }
  }

  estadoClass(c: Cita): string { return ESTADO_COLORS[c.estado_cita?.codigo ?? ''] ?? 'bg-gray-100 text-gray-600'; }
  dotClass(c: Cita): string    { return ESTADO_DOT[c.estado_cita?.codigo ?? ''] ?? 'bg-gray-400'; }

  nombrePaciente(c: Cita): string {
    if (c.paciente) return `${c.paciente.nombres} ${c.paciente.apellidos}`;
    if (c.id_paciente === 0) return 'Anónimo';
    return `Paciente #${c.id_paciente}`;
  }

  formatHora(h: string): string { return h?.substring(0, 5) ?? '—'; }

  puedeIniciar(c: Cita): boolean { return ['PE','CF'].includes(c.estado_cita?.codigo ?? ''); }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}
