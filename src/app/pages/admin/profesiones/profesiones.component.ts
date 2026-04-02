import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Profesion, CreateProfesionRequest } from '../../../core/models/admin.model';

@Component({
  selector: 'app-profesiones',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profesiones.component.html'
})
export class ProfesionesComponent implements OnInit {
  profesiones: Profesion[] = [];
  isLoading = false;
  showModal = false;
  isEditing = false;
  selectedId: number | null = null;
  errorMsg = '';
  successMsg = '';
  form: CreateProfesionRequest = { nombre: '', descripcion: '' };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.loadProfesiones(); }

  loadProfesiones(): void {
    this.isLoading = true;
    this.adminService.getProfesiones().subscribe({
      next: (data) => { this.profesiones = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  openCreate(): void {
    this.isEditing = false; this.selectedId = null;
    this.form = { nombre: '', descripcion: '' }; this.errorMsg = ''; this.showModal = true;
  }

  openEdit(p: Profesion): void {
    this.isEditing = true; this.selectedId = p.id;
    this.form = { nombre: p.nombre, descripcion: p.descripcion || '' }; this.errorMsg = ''; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.errorMsg = ''; }

  save(): void {
    if (!this.form.nombre.trim()) { this.errorMsg = 'El nombre es requerido'; return; }
    this.isLoading = true;
    const obs = this.isEditing ? this.adminService.updateProfesion(this.selectedId!, this.form) : this.adminService.createProfesion(this.form);
    obs.subscribe({
      next: () => { this.isLoading = false; this.showModal = false; this.loadProfesiones(); this.successMsg = 'Guardado exitosamente'; setTimeout(() => this.successMsg = '', 3000); },
      error: (err) => { this.isLoading = false; this.errorMsg = err?.message || 'Error'; }
    });
  }

  delete(id: number): void {
    if (!confirm('¿Eliminar esta profesión?')) return;
    this.adminService.deleteProfesion(id).subscribe({ next: () => { this.loadProfesiones(); this.successMsg = 'Eliminado'; setTimeout(() => this.successMsg = '', 3000); } });
  }
}
