import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Clinica, CreateClinicaRequest } from '../../../core/models/admin.model';

@Component({
  selector: 'app-clinicas',
  standalone: true,
  imports: [NgClass, FormsModule],
  templateUrl: './clinicas.component.html'
})
export class ClinicasComponent implements OnInit {
  clinicas: Clinica[] = [];
  isLoading = false;
  showModal = false;
  isEditing = false;
  selectedId: number | null = null;
  errorMsg = '';
  successMsg = '';

  form: CreateClinicaRequest = {
    nombre: '', nit: '', telefono: '', correo: '', direccion: '', ciudad: ''
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadClinicas();
  }

  loadClinicas(): void {
    this.isLoading = true;
    this.adminService.getClinicas().subscribe({
      next: (data) => { this.clinicas = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  openCreate(): void {
    this.isEditing = false;
    this.selectedId = null;
    this.form = { nombre: '', nit: '', telefono: '', correo: '', direccion: '', ciudad: '' };
    this.errorMsg = '';
    this.showModal = true;
  }

  openEdit(clinica: Clinica): void {
    this.isEditing = true;
    this.selectedId = clinica.id;
    this.form = { nombre: clinica.nombre, nit: clinica.nit || '', telefono: clinica.telefono || '', correo: clinica.correo || '', direccion: clinica.direccion || '', ciudad: clinica.ciudad || '' };
    this.errorMsg = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.errorMsg = '';
  }

  save(): void {
    if (!this.form.nombre.trim()) { this.errorMsg = 'El nombre es requerido'; return; }
    this.isLoading = true;
    const obs = this.isEditing
      ? this.adminService.updateClinica(this.selectedId!, this.form)
      : this.adminService.createClinica(this.form);
    obs.subscribe({
      next: () => { this.isLoading = false; this.showModal = false; this.loadClinicas(); this.successMsg = this.isEditing ? 'Clínica actualizada' : 'Clínica creada'; setTimeout(() => this.successMsg = '', 3000); },
      error: (err) => { this.isLoading = false; this.errorMsg = err?.message || 'Error al guardar'; }
    });
  }

  delete(id: number): void {
    if (!confirm('¿Eliminar esta clínica?')) return;
    this.adminService.deleteClinica(id).subscribe({
      next: () => { this.loadClinicas(); this.successMsg = 'Clínica eliminada'; setTimeout(() => this.successMsg = '', 3000); },
      error: () => {}
    });
  }
}
