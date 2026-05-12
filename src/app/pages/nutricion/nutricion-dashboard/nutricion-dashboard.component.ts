import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { NutricionService } from '../../../core/services/nutricion.service';
import { PacientesService } from '../../../core/services/pacientes.service';
import { AgendaService } from '../../../core/services/agenda.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';
import { MenuRequiereCambio, NutricionDietaPaciente } from '../../../core/models/nutricion.model';
import { Paciente } from '../../../core/models/pacientes.model';
import { Cita } from '../../../core/models/agenda.model';
import { User } from '../../../core/models/user.model';
import { SkeletonComponent } from '../../../common/skeleton/skeleton.component';

@Component({
  selector: 'app-nutricion-dashboard',
  standalone: true,
  imports: [RouterLink, NgClass, SkeletonComponent],
  templateUrl: './nutricion-dashboard.component.html'
})
export class NutricionDashboardComponent implements OnInit {
  isLoading = false;
  currentUser: User | null = null;

  totalPacientes = 0;
  dietasActivas  = 0;
  requierenCambio: MenuRequiereCambio[] = [];
  recentPacientes: Paciente[] = [];

  citasHoy: Cita[] = [];
  citasHoyTotal = 0;

  readonly monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  readonly weekdays  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  currentMonth: number;
  currentYear:  number;
  daysInMonth:  (number | null)[] = [];

  constructor(
    private nutricionSvc: NutricionService,
    private pacientesSvc: PacientesService,
    private agendaSvc:    AgendaService,
    private authSvc:      AuthService
  ) {
    const now = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear  = now.getFullYear();
    this.buildCalendar();
  }

  ngOnInit(): void {
    this.currentUser = this.authSvc.currentUserSignal();
    this.isLoading = true;

    const today = this.todayStr();

    forkJoin({
      pacientes:      this.pacientesSvc.listAll(),
      requierenCambio: this.nutricionSvc.listDietasRequierenCambio(),
      citas:          this.agendaSvc.listCitas({ fecha: today, size: 20 })
    }).subscribe({
      next: res => {
        this.totalPacientes = res.pacientes.data.length;
        this.recentPacientes = res.pacientes.data.slice(0, 6);
        this.requierenCambio = res.requierenCambio;
        this.citasHoy = res.citas.data ?? [];
        this.citasHoyTotal = res.citas.total_items ?? this.citasHoy.length;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  estadoBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      PE: 'text-warning-700 border border-warning-300 bg-warning-100 dark:bg-[#15203c] dark:border-[#15203c]',
      CO: 'text-success-700 border border-success-300 bg-success-100 dark:bg-[#15203c] dark:border-[#15203c]',
      AT: 'text-secondary-700 border border-secondary-300 bg-secondary-100 dark:bg-[#15203c] dark:border-[#15203c]',
      CA: 'text-danger-700 border border-danger-300 bg-danger-100 dark:bg-[#15203c] dark:border-[#15203c]',
    };
    return map[estado] ?? 'text-gray-700 border border-gray-300 bg-gray-100';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = { PE: 'Pendiente', CO: 'Confirmada', AT: 'Atendida', CA: 'Cancelada' };
    return map[estado] ?? estado;
  }

  citaCardClass(idx: number): string {
    const classes = [
      'bg-secondary-100 dark:bg-[#172036]',
      'bg-success-100 dark:bg-[#172036]',
      'bg-warning-100 dark:bg-[#172036]',
      'bg-purple-100 dark:bg-[#172036]',
    ];
    return classes[idx % classes.length];
  }

  citaLinkClass(idx: number): string {
    const classes = [
      'text-secondary-500 hover:bg-secondary-500',
      'text-success-500 hover:bg-success-500',
      'text-warning-500 hover:bg-warning-500',
      'text-purple-500 hover:bg-purple-500',
    ];
    return classes[idx % classes.length];
  }

  previousMonth(): void {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else { this.currentMonth--; }
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else { this.currentMonth++; }
    this.buildCalendar();
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const t = new Date();
    return day === t.getDate() && this.currentMonth === t.getMonth() && this.currentYear === t.getFullYear();
  }

  private buildCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const total    = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    this.daysInMonth = Array(firstDay).fill(null);
    for (let d = 1; d <= total; d++) this.daysInMonth.push(d);
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}
