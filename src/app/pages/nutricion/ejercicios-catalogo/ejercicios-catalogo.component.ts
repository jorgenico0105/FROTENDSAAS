import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { NutricionService } from '../../../core/services/nutricion.service';
import { NutricionEjercicioCatalogo, CreateEjercicioCatalogoRequest } from '../../../core/models/nutricion.model';
import { SkeletonComponent } from '../../../common/skeleton/skeleton.component';

@Component({
  selector: 'app-ejercicios-catalogo',
  imports: [FormsModule, DecimalPipe, SkeletonComponent],
  templateUrl: './ejercicios-catalogo.component.html'
})
export class EjerciciosCatalogoComponent implements OnInit {
  ejercicios: NutricionEjercicioCatalogo[] = [];
  filtered: NutricionEjercicioCatalogo[] = [];
  isLoading = false;
  showModal = false;
  successMsg = '';
  errorMsg = '';
  search = '';
  nivelFilter = '';
  categoriaFilter = '';
  categorias: string[] = [];

  // Pagination
  page = 1;
  pageSize = 12;

  form: CreateEjercicioCatalogoRequest = {
    nombre: '',
    descripcion: '',
    categoria: '',
    grupo_muscular: '',
    unidad_medida: 'minutos',
    nivel: ''
  };

  niveles = ['Principiante', 'Intermedio', 'Avanzado'];

  constructor(private svc: NutricionService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.svc.listEjerciciosCatalogo().subscribe({
      next: (data) => {
        this.ejercicios = data;
        this.categorias = [...new Set(data.map(e => e.categoria).filter((c): c is string => !!c))];
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilter(): void {
    let result = this.ejercicios;
    if (this.search) {
      const q = this.search.toLowerCase();
      result = result.filter(e =>
        e.nombre.toLowerCase().includes(q) ||
        (e.categoria || '').toLowerCase().includes(q) ||
        (e.grupo_muscular || '').toLowerCase().includes(q)
      );
    }
    if (this.nivelFilter) {
      result = result.filter(e => e.nivel === this.nivelFilter);
    }
    if (this.categoriaFilter) {
      result = result.filter(e => e.categoria === this.categoriaFilter);
    }
    this.filtered = result;
    this.page = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paginated(): NutricionEjercicioCatalogo[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get pageRange(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const cur = this.page;
    let start = Math.max(1, cur - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goTo(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.page = p;
  }

  clearFilters(): void {
    this.search = '';
    this.nivelFilter = '';
    this.categoriaFilter = '';
    this.applyFilter();
  }

  openCreate(): void {
    this.form = { nombre: '', descripcion: '', categoria: '', grupo_muscular: '', unidad_medida: 'minutos', nivel: '' };
    this.errorMsg = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.errorMsg = '';
  }

  save(): void {
    if (!this.form.nombre?.trim()) {
      this.errorMsg = 'El nombre es requerido.';
      return;
    }
    this.isLoading = true;
    this.errorMsg = '';
    this.svc.createEjercicioCatalogo(this.form).subscribe({
      next: () => {
        this.showModal = false;
        this.successMsg = 'Ejercicio creado correctamente.';
        this.load();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al guardar.';
        this.isLoading = false;
      }
    });
  }

  nivelBadge(nivel?: string): string {
    const map: Record<string, string> = {
      'Principiante': 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
      'Intermedio': 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
      'Avanzado': 'bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400'
    };
    return map[nivel || ''] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
}
