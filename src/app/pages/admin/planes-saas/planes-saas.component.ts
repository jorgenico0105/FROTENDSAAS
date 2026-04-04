import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { PlanSaas, CreatePlanSaasRequest } from '../../../core/models/admin.model';
import { SkeletonComponent } from '../../../common/skeleton/skeleton.component';

@Component({
  selector: 'app-planes-saas',
  standalone: true,
  imports: [FormsModule, SkeletonComponent],
  templateUrl: './planes-saas.component.html'
})
export class PlanesSaasComponent implements OnInit {
  planes: PlanSaas[] = [];
  isLoading = false;
  showModal = false;
  isEditing = false;
  selectedId: number | null = null;
  errorMsg = '';
  successMsg = '';
  form: CreatePlanSaasRequest = { codigo: '', nombre: '', descripcion: '', precio_mensual: 0, precio_anual: 0, max_usuarios: undefined, max_pacientes: undefined };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.loadPlanes(); }

  loadPlanes(): void {
    this.isLoading = true;
    this.adminService.getPlanesSaas().subscribe({
      next: (data) => { this.planes = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  openCreate(): void {
    this.isEditing = false; this.selectedId = null;
    this.form = { codigo: '', nombre: '', descripcion: '', precio_mensual: 0, precio_anual: 0, max_usuarios: undefined, max_pacientes: undefined };
    this.errorMsg = ''; this.showModal = true;
  }

  openEdit(p: PlanSaas): void {
    this.isEditing = true; this.selectedId = p.id;
    this.form = { codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion || '', precio_mensual: p.precio_mensual, precio_anual: p.precio_anual, max_usuarios: p.max_usuarios, max_pacientes: p.max_pacientes };
    this.errorMsg = ''; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.errorMsg = ''; }

  save(): void {
    if (!this.form.nombre.trim()) { this.errorMsg = 'El nombre es requerido'; return; }
    this.isLoading = true;
    const obs = this.isEditing ? this.adminService.updatePlanSaas(this.selectedId!, this.form) : this.adminService.createPlanSaas(this.form);
    obs.subscribe({
      next: () => { this.isLoading = false; this.showModal = false; this.loadPlanes(); this.successMsg = 'Guardado'; setTimeout(() => this.successMsg = '', 3000); },
      error: (err) => { this.isLoading = false; this.errorMsg = err?.message || 'Error'; }
    });
  }
}
