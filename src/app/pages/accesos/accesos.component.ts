import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PacientesService } from '../../core/services/pacientes.service';
import { Paciente, Aplicacion, PacienteAplicacion, CreateAplicacionRequest } from '../../core/models/pacientes.model';

interface PacienteConAccesos extends Paciente {
  accesos: PacienteAplicacion[];
  loadingAccesos: boolean;
}

@Component({
  selector: 'app-accesos',
  standalone: true,
  imports: [NgClass, FormsModule],
  templateUrl: './accesos.component.html',
})
export class AccesosComponent implements OnInit {
  isLoading = false;
  apps: Aplicacion[] = [];
  pacientes: PacienteConAccesos[] = [];

  filtroApp: number | null = null;
  search = '';

  // Modal nueva app
  showAppModal = false;
  isSubmittingApp = false;
  appForm: CreateAplicacionRequest = { codigo: '', nombre: '', descripcion: '' };
  appError = '';

  // Estado de operaciones en curso por paciente+app
  toggling = new Set<string>();

  successMsg = '';
  errorMsg = '';

  constructor(private svc: PacientesService) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    forkJoin({
      apps: this.svc.listAplicaciones(),
      paginados: this.svc.list('', 1, 100),
    }).subscribe({
      next: res => {
        this.apps = res.apps;
        const raw = res.paginados.data;
        this.pacientes = raw.map(p => ({ ...p, accesos: [], loadingAccesos: true }));
        this.isLoading = false;
        this.loadAccesos();
      },
      error: () => { this.isLoading = false; }
    });
  }

  private loadAccesos(): void {
    this.pacientes.forEach(p => {
      this.svc.listAplicacionesPaciente(p.id).subscribe({
        next: accesos => {
          p.accesos = accesos;
          p.loadingAccesos = false;
        },
        error: () => { p.loadingAccesos = false; }
      });
    });
  }

  get pacientesFiltrados(): PacienteConAccesos[] {
    let list = this.pacientes;
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(p =>
        p.nombres.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q) ||
        (p.numero_documento ?? '').toLowerCase().includes(q)
      );
    }
    if (this.filtroApp !== null) {
      list = list.filter(p => this.tieneAccesoActivo(p, this.filtroApp!));
    }
    return list;
  }

  tieneAccesoActivo(p: PacienteConAccesos, appId: number): boolean {
    return p.accesos.some(a => a.aplicacion_id === appId && a.state === 'A');
  }

  toggleAcceso(p: PacienteConAccesos, app: Aplicacion): void {
    const key = `${p.id}-${app.id}`;
    if (this.toggling.has(key)) return;
    this.toggling.add(key);

    const tieneAcceso = this.tieneAccesoActivo(p, app.id);

    if (tieneAcceso) {
      this.svc.revocarAplicacion(p.id, app.id).subscribe({
        next: () => {
          const idx = p.accesos.findIndex(a => a.aplicacion_id === app.id);
          if (idx !== -1) p.accesos.splice(idx, 1);
          this.toggling.delete(key);
        },
        error: () => { this.toggling.delete(key); }
      });
    } else {
      this.svc.asignarAplicacion(p.id, app.id).subscribe({
        next: acceso => {
          p.accesos.push(acceso);
          this.toggling.delete(key);
          this.showSuccess(`Acceso a ${app.nombre} otorgado. Credencial: ${p.numero_documento ?? 'ver cédula'}`);
        },
        error: () => { this.toggling.delete(key); }
      });
    }
  }

  isToggling(p: PacienteConAccesos, appId: number): boolean {
    return this.toggling.has(`${p.id}-${appId}`);
  }

  contarConAcceso(appId: number): number {
    return this.pacientes.filter(p => this.tieneAccesoActivo(p, appId)).length;
  }

  // ── Nueva app modal ──────────────────────────────────────────────────────
  abrirAppModal(): void {
    this.appForm = { codigo: '', nombre: '', descripcion: '' };
    this.appError = '';
    this.showAppModal = true;
  }

  saveApp(): void {
    if (!this.appForm.codigo.trim() || !this.appForm.nombre.trim()) {
      this.appError = 'Código y nombre son requeridos.';
      return;
    }
    this.isSubmittingApp = true;
    this.appError = '';
    this.svc.createAplicacion(this.appForm).subscribe({
      next: app => {
        this.apps.push(app);
        this.showAppModal = false;
        this.isSubmittingApp = false;
        this.showSuccess(`App "${app.nombre}" creada.`);
      },
      error: err => {
        this.appError = err?.error?.message || 'Error al crear la aplicación.';
        this.isSubmittingApp = false;
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  nombreCompleto(p: Paciente): string {
    return `${p.nombres} ${p.apellidos}`;
  }

  iniciales(p: Paciente): string {
    return (p.nombres.charAt(0) + p.apellidos.charAt(0)).toUpperCase();
  }

  appIcono(codigo: string): string {
    const map: Record<string, string> = {
      NUTRICION: 'ri-restaurant-line',
      PSICOLOGIA: 'ri-mental-health-line',
      ODONTOLOGIA: 'ri-tooth-line',
      MEDICINA: 'ri-stethoscope-line',
      BIOHEALTH: 'ri-heart-pulse-line',
    };
    return map[codigo.toUpperCase()] ?? 'ri-smartphone-line';
  }

  appColor(codigo: string): string {
    const map: Record<string, string> = {
      NUTRICION: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      PSICOLOGIA: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      ODONTOLOGIA: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      MEDICINA: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      BIOHEALTH: 'bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
    };
    return map[codigo.toUpperCase()] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }

  appNombreFiltro(): string {
    if (this.filtroApp === null) return '';
    return this.apps.find(a => a.id === this.filtroApp)?.nombre ?? '';
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 4000);
  }
}
