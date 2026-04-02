import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, DecimalPipe } from '@angular/common';
import { NutricionService } from '../../../core/services/nutricion.service';
import { PacientesService } from '../../../core/services/pacientes.service';
import { Paciente } from '../../../core/models/pacientes.model';
import {
  NutricionDietaPaciente, CreateDietaRequest,
  NutricionProgreso, CreateProgresoRequest,
} from '../../../core/models/nutricion.model';

type Tab = string;

@Component({
  selector: 'app-detalle-paciente-nutricion',
  imports: [RouterLink, FormsModule, NgClass, DecimalPipe],
  templateUrl: './detalle-paciente-nutricion.component.html'
})
export class DetallePacienteNutricionComponent implements OnInit {
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

  // Progreso
  progreso: NutricionProgreso[] = [];
  showProgresoModal = false;
  progresoForm: CreateProgresoRequest = { fecha: new Date().toISOString().split('T')[0] };

  constructor(
    private route: ActivatedRoute,
    private nutricionSvc: NutricionService,
    private pacientesSvc: PacientesService
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
