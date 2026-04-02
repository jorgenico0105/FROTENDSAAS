import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgClass } from '@angular/common';
import { NutricionService } from '../../../core/services/nutricion.service';
import { NutricionAlimento, CreateAlimentoRequest } from '../../../core/models/nutricion.model';

@Component({
  selector: 'app-alimentos',
  imports: [FormsModule, DecimalPipe, NgClass],
  templateUrl: './alimentos.component.html'
})
export class AlimentosComponent implements OnInit {
  alimentos: NutricionAlimento[] = [];
  filtered: NutricionAlimento[] = [];
  isLoading = false;
  showModal = false;
  isEditing = false;
  successMsg = '';
  errorMsg = '';
  search = '';
  categoriaFilter = '';
  categorias: string[] = [];

  // Pagination
  page = 1;
  pageSize = 20;

  form: CreateAlimentoRequest = {
    nombre: '', calorias: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0, gramos_porcion: 100,
    desayuno: false, media_tarde_mana: false, almuerzo: false, merienda: false
  };

  constructor(private svc: NutricionService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.svc.listAlimentos().subscribe({
      next: (data) => {
        this.alimentos = data;
        this.categorias = [...new Set(data.map(a => a.categoria).filter((c): c is string => !!c))];
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilter(): void {
    let result = this.alimentos;
    if (this.search) {
      const q = this.search.toLowerCase();
      result = result.filter(a => a.nombre.toLowerCase().includes(q));
    }
    if (this.categoriaFilter) {
      result = result.filter(a => a.categoria === this.categoriaFilter);
    }
    this.filtered = result;
    this.page = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paginated(): NutricionAlimento[] {
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

  openCreate(): void {
    this.isEditing = false;
    this.form = { nombre: '', calorias: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0, gramos_porcion: 100, desayuno: false, media_tarde_mana: false, almuerzo: false, merienda: false };
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
    this.svc.createAlimento(this.form).subscribe({
      next: () => {
        this.showModal = false;
        this.successMsg = 'Alimento creado correctamente.';
        this.load();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al guardar.';
        this.isLoading = false;
      }
    });
  }
}
