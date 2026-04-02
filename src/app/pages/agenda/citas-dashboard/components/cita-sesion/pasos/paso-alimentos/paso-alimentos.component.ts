import { Component, Input } from '@angular/core';
import { NutricionDietaPaciente, NutricionPreferencia } from '../../../../../../../core/models/nutricion.model';

@Component({
  selector: 'app-paso-alimentos',
  standalone: true,
  imports: [],
  templateUrl: './paso-alimentos.component.html'
})
export class PasoAlimentosComponent {
  @Input() pacienteId  = 0;
  @Input() preferencias: NutricionPreferencia[] = [];
  @Input() dieta: NutricionDietaPaciente | null = null;

  get preferenciasGusto(): NutricionPreferencia[] {
    return this.preferencias.filter(p => p.tipo === 'GUSTO');
  }

  get preferenciasRestriccion(): NutricionPreferencia[] {
    return this.preferencias.filter(p => ['DISGUSTO', 'INTOLERANCIA', 'ALERGIA'].includes(p.tipo));
  }
}
