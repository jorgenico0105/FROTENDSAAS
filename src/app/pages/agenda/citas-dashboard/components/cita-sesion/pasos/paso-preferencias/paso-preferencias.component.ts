import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { NutricionService } from '../../../../../../../core/services/nutricion.service';
import {
  NutricionAlimento, NutricionPreferencia, CreatePreferenciaRequest
} from '../../../../../../../core/models/nutricion.model';

@Component({
  selector: 'app-paso-preferencias',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './paso-preferencias.component.html'
})
export class PasoPreferenciasComponent implements OnInit {
  @Input() pacienteId = 0;

  @Output() preferenciasChange = new EventEmitter<NutricionPreferencia[]>();

  readonly prefTags = [
    { tipo: 'GUSTO',        label: 'Me gusta',    icon: 'ri-thumb-up-line',        activeClass: 'bg-success-50 dark:bg-success-900/20 border-success-400 text-success-600 dark:text-success-400' },
    { tipo: 'DISGUSTO',     label: 'No me gusta', icon: 'ri-thumb-down-line',      activeClass: 'bg-danger-50 dark:bg-danger-900/20 border-danger-400 text-danger-600 dark:text-danger-400' },
    { tipo: 'INTOLERANCIA', label: 'Intolerancia',icon: 'ri-alert-line',           activeClass: 'bg-warning-50 dark:bg-warning-900/20 border-warning-400 text-warning-600 dark:text-warning-400' },
    { tipo: 'ALERGIA',      label: 'Alergia',     icon: 'ri-error-warning-line',   activeClass: 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 text-orange-600 dark:text-orange-400' },
  ];

  getTipoIcon(tipo: string): string {
    const icons: Record<string, string> = {
      GUSTO: 'ri-thumb-up-line', DISGUSTO: 'ri-thumb-down-line',
      INTOLERANCIA: 'ri-alert-line', ALERGIA: 'ri-error-warning-line',
    };
    return icons[tipo] ?? 'ri-question-line';
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      GUSTO: 'Me gusta', DISGUSTO: 'No me gusta',
      INTOLERANCIA: 'Intolerancia', ALERGIA: 'Alergia',
    };
    return labels[tipo] ?? tipo;
  }

  allAlimentos:         NutricionAlimento[]    = [];
  alimentos:            NutricionAlimento[]    = [];
  preferencias:         NutricionPreferencia[] = [];
  isLoadingAlimentos    = false;
  isLoadingPreferencias = false;
  alimentoSearch        = '';
  savingPrefId: number | null = null;

  constructor(private nutricionSvc: NutricionService) {}

  ngOnInit(): void {
    if (this.pacienteId > 0) this.cargarPreferencias();
    this.cargarAlimentos();
  }

  private cargarAlimentos(): void {
    this.isLoadingAlimentos = true;
    this.nutricionSvc.listAlimentos().subscribe({
      next: (a) => { this.allAlimentos = a; this.isLoadingAlimentos = false; },
      error: () => { this.isLoadingAlimentos = false; }
    });
  }

  private cargarPreferencias(): void {
    this.isLoadingPreferencias = true;
    this.nutricionSvc.listPreferencias(this.pacienteId).subscribe({
      next: (p: NutricionPreferencia[]) => {
        this.preferencias = p;
        this.preferenciasChange.emit(this.preferencias);
        this.isLoadingPreferencias = false;
      },
      error: () => { this.isLoadingPreferencias = false; }
    });
  }

  onAlimentoSearchInput(): void {
    const q = this.alimentoSearch.trim().toLowerCase();
    if (q.length < 2) { this.alimentos = []; return; }
    this.alimentos = this.allAlimentos.filter(a =>
      a.nombre.toLowerCase().includes(q) ||
      (a.categoria || '').toLowerCase().includes(q)
    );
  }

  tipoPreferencia(alimentoId: number): string {
    return this.preferencias.find(p => p.alimento_id === alimentoId)?.tipo ?? '';
  }

  getPrefChipClass(tipo: string): string {
    const map: Record<string, string> = {
      GUSTO:        'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 border-success-200',
      DISGUSTO:     'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400 border-danger-200',
      INTOLERANCIA: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 border-warning-200',
      ALERGIA:      'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200',
    };
    return map[tipo] ?? 'bg-gray-50 text-gray-500 border-gray-200';
  }

  togglePreferencia(alimento: NutricionAlimento, tipo: string): void {
    const existing = this.preferencias.find(p => p.alimento_id === alimento.id);
    this.savingPrefId = alimento.id;

    if (existing?.tipo === tipo) {
      this.nutricionSvc.deletePreferencia(this.pacienteId, existing.id).subscribe({
        next: () => {
          this.preferencias = this.preferencias.filter(p => p.id !== existing.id);
          this.preferenciasChange.emit(this.preferencias);
          this.savingPrefId = null;
        },
        error: () => { this.savingPrefId = null; }
      });
      return;
    }

    const addNew = () => {
      this.nutricionSvc.addPreferencia(this.pacienteId, { alimento_id: alimento.id, tipo } as CreatePreferenciaRequest).subscribe({
        next: (pref: NutricionPreferencia) => {
          this.preferencias = [...this.preferencias, pref];
          this.preferenciasChange.emit(this.preferencias);
          this.savingPrefId = null;
        },
        error: () => { this.savingPrefId = null; }
      });
    };

    if (existing) {
      this.nutricionSvc.deletePreferencia(this.pacienteId, existing.id).subscribe({
        next: () => {
          this.preferencias = this.preferencias.filter(p => p.id !== existing.id);
          addNew();
        },
        error: () => { this.savingPrefId = null; }
      });
    } else {
      addNew();
    }
  }

  removePreferencia(pref: NutricionPreferencia): void {
    this.nutricionSvc.deletePreferencia(this.pacienteId, pref.id).subscribe({
      next: () => {
        this.preferencias = this.preferencias.filter(p => p.id !== pref.id);
        this.preferenciasChange.emit(this.preferencias);
      },
      error: () => {}
    });
  }
}
