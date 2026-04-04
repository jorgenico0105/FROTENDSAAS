import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PacientesService } from '../../../core/services/pacientes.service';
import { Paciente } from '../../../core/models/pacientes.model';
import { SkeletonComponent } from '../../../common/skeleton/skeleton.component';

@Component({
  selector: 'app-pacientes-nutricion',
  imports: [RouterLink, FormsModule, SkeletonComponent],
  templateUrl: './pacientes-nutricion.component.html'
})
export class PacientesNutricionComponent implements OnInit {
  pacientes: Paciente[] = [];
  filtered: Paciente[] = [];
  isLoading = false;
  search = '';

  constructor(private svc: PacientesService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.svc.list().subscribe({
      next: (res) => {
        this.pacientes = res.data;
        this.filtered = [...res.data];
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = q
      ? this.pacientes.filter(p =>
          `${p.nombres} ${p.apellidos}`.toLowerCase().includes(q) ||
          (p.telefono || '').includes(q)
        )
      : [...this.pacientes];
  }
}
