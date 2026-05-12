import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { PacientesService } from '../../../core/services/pacientes.service';
import { Paciente } from '../../../core/models/pacientes.model';
import { NuevoPaciente } from '../componentes/nuevo-paciente/nuevo-paciente';
import { SkeletonComponent } from '../../../common/skeleton/skeleton.component';

@Component({
  selector: 'app-pacientes-lista',
  imports: [RouterLink, FormsModule, NgClass, NuevoPaciente, SkeletonComponent],
  templateUrl: './pacientes-lista.component.html'
})
export class PacientesListaComponent implements OnInit {
  pacientes: Paciente[] = [];
  filtered: Paciente[] = [];
  isLoading      = false;
  showModal      = false;
  isEditing      = false;
  successMsg     = '';
  errorMsg       = '';
  search         = '';
  selectedPaciente: Paciente | null = null;
  confirmDeleteId: number | null = null;
  isDeleting     = false;

  // Pagination
  page = 1;
  pageSize = 15;

  constructor(private svc: PacientesService) {}

  ngOnInit(): void { this.loadPacientes(); }

  loadPacientes(): void {
    this.isLoading = true;
    this.svc.listAll().subscribe({
      next: (res) => { this.pacientes = res.data; this.applyFilter(); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = q
      ? this.pacientes.filter(p =>
          `${p.nombres} ${p.apellidos}`.toLowerCase().includes(q) ||
          (p.telefono || '').includes(q) ||
          (p.correo || '').toLowerCase().includes(q) ||
          (p.numero_documento || '').includes(q)
        )
      : [...this.pacientes];
    this.page = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paginated(): Paciente[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get pageRange(): number[] {
    const pages: number[] = [];
    let start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goTo(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.page = p;
  }

  openCreate(): void {
    this.isEditing = false;
    this.selectedPaciente = null;
    this.showModal = true;
  }

  openEdit(p: Paciente): void {
    this.isEditing = true;
    this.selectedPaciente = p;
    this.showModal = true;
  }

  onPacienteGuardado(p: Paciente): void {
    this.successMsg = this.isEditing ? 'Paciente actualizado.' : 'Paciente creado.';
    this.showModal = false;
    this.loadPacientes();
    setTimeout(() => this.successMsg = '', 3000);
    void p;
  }

  calcAge(fechaNac?: string): string {
    if (!fechaNac) return '—';
    const diff = Date.now() - new Date(fechaNac).getTime();
    return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} años`;
  }

  confirmDelete(id: number): void {
    this.confirmDeleteId = id;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  deletePaciente(id: number): void {
    this.isDeleting = true;
    this.svc.delete(id).subscribe({
      next: () => {
        this.pacientes = this.pacientes.filter(p => p.id !== id);
        this.applyFilter();
        this.confirmDeleteId = null;
        this.isDeleting = false;
        this.successMsg = 'Paciente eliminado.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => {
        this.errorMsg = 'No se pudo eliminar el paciente.';
        this.confirmDeleteId = null;
        this.isDeleting = false;
        setTimeout(() => this.errorMsg = '', 3000);
      }
    });
  }
}
