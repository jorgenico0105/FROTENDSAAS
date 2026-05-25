import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  PlantillaSemana,
  DetallePlantilla,
  AlimentoPlantilla,
  CreatePlantillaSemanaRequest,
  UpdatePlantillaSemanaRequest,
  AddDetallePlantillaRequest,
  AddAlimentoPlantillaRequest,
} from '../models/nutricion.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PlantillaMenuService {
  private base = `${environment.apiUrl}/nutricion`;

  constructor(private http: HttpClient) {}

  list(params?: { num_comidas?: number; semana_numero?: number }): Observable<PlantillaSemana[]> {
    let p = new HttpParams();
    if (params?.num_comidas) p = p.set('num_comidas', params.num_comidas);
    if (params?.semana_numero) p = p.set('semana_numero', params.semana_numero);
    return this.http.get<ApiResponse<PlantillaSemana[]>>(`${this.base}/plantillas-menu`, { params: p })
      .pipe(map(r => r.data ?? []));
  }

  create(data: CreatePlantillaSemanaRequest): Observable<PlantillaSemana> {
    return this.http.post<ApiResponse<PlantillaSemana>>(`${this.base}/plantillas-menu`, data)
      .pipe(map(r => r.data));
  }

  getById(id: number): Observable<PlantillaSemana> {
    return this.http.get<ApiResponse<PlantillaSemana>>(`${this.base}/plantillas-menu/${id}`)
      .pipe(map(r => r.data));
  }

  update(id: number, data: UpdatePlantillaSemanaRequest): Observable<PlantillaSemana> {
    return this.http.put<ApiResponse<PlantillaSemana>>(`${this.base}/plantillas-menu/${id}`, data)
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/plantillas-menu/${id}`);
  }

  duplicarParaHombre(id: number): Observable<PlantillaSemana> {
    return this.http.post<ApiResponse<PlantillaSemana>>(
      `${this.base}/plantillas-menu/${id}/duplicar`, {}
    ).pipe(map(r => r.data));
  }

  getDetalles(plantillaId: number): Observable<DetallePlantilla[]> {
    return this.http.get<ApiResponse<DetallePlantilla[]>>(`${this.base}/plantillas-menu/${plantillaId}/detalles`)
      .pipe(map(r => r.data ?? []));
  }

  addDetalle(plantillaId: number, data: AddDetallePlantillaRequest): Observable<DetallePlantilla> {
    return this.http.post<ApiResponse<DetallePlantilla>>(`${this.base}/plantillas-menu/${plantillaId}/detalles`, data)
      .pipe(map(r => r.data));
  }

  deleteDetalle(detalleId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/plantillas-menu-detalles/${detalleId}`);
  }

  getAlimentosDetalle(detalleId: number): Observable<AlimentoPlantilla[]> {
    return this.http.get<ApiResponse<AlimentoPlantilla[]>>(`${this.base}/plantillas-menu-detalles/${detalleId}/alimentos`)
      .pipe(map(r => r.data ?? []));
  }

  addAlimento(detalleId: number, data: AddAlimentoPlantillaRequest): Observable<AlimentoPlantilla> {
    return this.http.post<ApiResponse<AlimentoPlantilla>>(`${this.base}/plantillas-menu-detalles/${detalleId}/alimentos`, data)
      .pipe(map(r => r.data));
  }

  updateAlimento(id: number, gramos: number): Observable<AlimentoPlantilla> {
    return this.http.put<ApiResponse<AlimentoPlantilla>>(
      `${this.base}/plantillas-menu-alimentos/${id}`,
      { gramos_asignados: gramos }
    ).pipe(map(r => r.data));
  }

  deleteAlimento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/plantillas-menu-alimentos/${id}`);
  }

  updateDetalle(detalleId: number, data: { nombre_receta?: string; instrucciones?: string; nombre_comida?: string }): Observable<DetallePlantilla> {
    return this.http.put<ApiResponse<DetallePlantilla>>(
      `${this.base}/plantillas-menu-detalles/${detalleId}`,
      data
    ).pipe(map(r => r.data));
  }
}
