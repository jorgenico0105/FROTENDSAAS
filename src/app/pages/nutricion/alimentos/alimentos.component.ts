import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgClass } from '@angular/common';
import { NutricionService } from '../../../core/services/nutricion.service';
import { NutricionAlimento, NutricionGrupoAlimento, CreateAlimentoRequest } from '../../../core/models/nutricion.model';
import { SkeletonComponent } from '../../../common/skeleton/skeleton.component';

@Component({
  selector: 'app-alimentos',
  imports: [FormsModule, DecimalPipe, NgClass, SkeletonComponent],
  templateUrl: './alimentos.component.html'
})
export class AlimentosComponent implements OnInit {
  alimentos: NutricionAlimento[] = [];
  filtered: NutricionAlimento[] = [];
  grupos: NutricionGrupoAlimento[] = [];
  isLoading = false;
  showModal = false;
  isEditing = false;
  editingId = 0;
  successMsg = '';
  errorMsg = '';
  search = '';
  grupoFilter = 0;

  // Pagination
  page = 1;
  pageSize = 20;

  form: CreateAlimentoRequest = {
    nombre: '', calorias: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0, gramos_porcion: 100,
    desayuno: false, media_tarde_mana: false, almuerzo: false, merienda: false,
    unidad: false, gramos_unidad: undefined, medida: ''
  };

  constructor(private svc: NutricionService) {}

  ngOnInit(): void {
    this.svc.listGruposAlimento().subscribe({ next: g => this.grupos = g });
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.svc.listAlimentos().subscribe({
      next: (data) => {
        this.alimentos = data;
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
    if (this.grupoFilter) {
      result = result.filter(a => a.grupo_id === this.grupoFilter);
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
    this.editingId = 0;
    this.form = {
      nombre: '', calorias: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0, gramos_porcion: 100,
      desayuno: false, media_tarde_mana: false, almuerzo: false, merienda: false,
      unidad: false, gramos_unidad: undefined, medida: ''
    };
    this.errorMsg = '';
    this.showModal = true;
  }

  openEdit(a: NutricionAlimento): void {
    this.isEditing = true;
    this.editingId = a.id;
    this.form = {
      nombre:           a.nombre,
      descripcion:      a.descripcion,
      grupo_id:         a.grupo_id,
      gramos_porcion:   a.gramos_porcion,
      calorias:         a.calorias,
      proteinas_g:      a.proteinas_g,
      carbohidratos_g:  a.carbohidratos_g,
      grasas_g:         a.grasas_g,
      fibra_g:          a.fibra_g,
      azucares_g:       a.azucares_g,
      sodio_mg:         a.sodio_mg,
      desayuno:         a.desayuno ?? false,
      media_tarde_mana: a.media_tarde_mana ?? false,
      almuerzo:         a.almuerzo ?? false,
      merienda:         a.merienda ?? false,
      unidad:           a.unidad ?? false,
      gramos_unidad:    a.gramos_unidad ?? undefined,
      medida:           a.medida ?? '',
    };
    this.errorMsg = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.errorMsg = '';
  }

  nombreGrupo(a: NutricionAlimento): string {
    return a.grupo?.nombre ?? this.grupos.find(g => g.id === a.grupo_id)?.nombre ?? a.categoria ?? '—';
  }

  save(): void {
    if (!this.form.nombre?.trim()) {
      this.errorMsg = 'El nombre es requerido.';
      return;
    }
    this.isLoading = true;
    this.errorMsg = '';
    const request$ = this.isEditing
      ? this.svc.updateAlimento(this.editingId, this.form)
      : this.svc.createAlimento(this.form);

    request$.subscribe({
      next: (updated) => {
        this.showModal = false;
        this.successMsg = this.isEditing ? 'Alimento actualizado correctamente.' : 'Alimento creado correctamente.';
        if (this.isEditing) {
          const idx = this.alimentos.findIndex(a => a.id === this.editingId);
          if (idx >= 0) this.alimentos[idx] = updated;
          this.applyFilter();
          this.isLoading = false;
        } else {
          this.load();
        }
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al guardar.';
        this.isLoading = false;
      }
    });
  }
}
