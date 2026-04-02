import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Rol, CreateRolRequest, Transaccion } from '../../../core/models/admin.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [NgClass, FormsModule],
  templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit {
  roles: Rol[] = [];
  transacciones: Transaccion[] = [];
  isLoading = false;
  showModal = false;
  showPermisosModal = false;
  isEditing = false;
  selectedRol: Rol | null = null;
  rolTransacciones: number[] = [];
  errorMsg = '';
  successMsg = '';

  form: CreateRolRequest = { nombre: '', descripcion: '' };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadTransacciones();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.adminService.getRoles().subscribe({
      next: (data) => { this.roles = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  loadTransacciones(): void {
    this.adminService.getTransacciones().subscribe({
      next: (data) => { this.transacciones = data; }
    });
  }

  openCreate(): void {
    this.isEditing = false;
    this.selectedRol = null;
    this.form = { nombre: '', descripcion: '' };
    this.errorMsg = '';
    this.showModal = true;
  }

  openEdit(rol: Rol): void {
    this.isEditing = true;
    this.selectedRol = rol;
    this.form = { nombre: rol.nombre, descripcion: rol.descripcion || '' };
    this.errorMsg = '';
    this.showModal = true;
  }

  openPermisos(rol: Rol): void {
    this.selectedRol = rol;
    this.adminService.getTransaccionesRol(rol.id).subscribe({
      next: (data) => {
        this.rolTransacciones = data.map(t => t.id);
        this.showPermisosModal = true;
      }
    });
  }

  toggleTransaccion(id: number): void {
    const idx = this.rolTransacciones.indexOf(id);
    if (idx >= 0) this.rolTransacciones.splice(idx, 1);
    else this.rolTransacciones.push(id);
  }

  isTransaccionSelected(id: number): boolean {
    return this.rolTransacciones.includes(id);
  }

  savePermisos(): void {
    if (!this.selectedRol) return;
    this.adminService.asignarTransaccionesRol(this.selectedRol.id, { transaccion_ids: this.rolTransacciones }).subscribe({
      next: () => {
        this.showPermisosModal = false;
        this.successMsg = 'Permisos actualizados';
        setTimeout(() => this.successMsg = '', 3000);
      }
    });
  }

  save(): void {
    if (!this.form.nombre.trim()) { this.errorMsg = 'El nombre es requerido'; return; }
    this.isLoading = true;
    const obs = this.isEditing
      ? this.adminService.updateRol(this.selectedRol!.id, this.form)
      : this.adminService.createRol(this.form);
    obs.subscribe({
      next: () => {
        this.isLoading = false;
        this.showModal = false;
        this.loadRoles();
        this.successMsg = this.isEditing ? 'Rol actualizado' : 'Rol creado';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => { this.isLoading = false; this.errorMsg = err?.message || 'Error'; }
    });
  }

  closeModal(): void { this.showModal = false; this.errorMsg = ''; }
  closePermisosModal(): void { this.showPermisosModal = false; }
}
