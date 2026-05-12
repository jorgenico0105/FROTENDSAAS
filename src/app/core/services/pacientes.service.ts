import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Paciente, CreatePacienteRequest, Aplicacion, PacienteAplicacion, CreateAplicacionRequest } from '../models/pacientes.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedPacientes {
  success: boolean;
  data: Paciente[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private base = `${environment.apiUrl}/pacientes`;

  constructor(private http: HttpClient) {}

  list(search = '', page = 1, size = 20): Observable<PaginatedPacientes> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('q', search);
    return this.http.get<PaginatedPacientes>(this.base, { params });
  }

  /** Carga todos los pacientes de la clínica (hasta 100). Usar en dropdowns, selectores y vistas que necesitan la lista completa. */
  listAll(): Observable<PaginatedPacientes> {
    return this.list('', 1, 100);
  }

  get(id: number): Observable<Paciente> {
    return this.http.get<ApiResponse<Paciente>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  create(data: CreatePacienteRequest): Observable<Paciente> {
    return this.http.post<ApiResponse<Paciente>>(this.base, data).pipe(map(r => r.data));
  }

  update(id: number, data: Partial<CreatePacienteRequest>): Observable<Paciente> {
    return this.http.put<ApiResponse<Paciente>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // ── Aplicaciones ──────────────────────────────────────────────────────────
  listAplicaciones(): Observable<Aplicacion[]> {
    return this.http.get<ApiResponse<Aplicacion[]>>(`${this.base}/aplicaciones`).pipe(map(r => r.data));
  }

  createAplicacion(data: CreateAplicacionRequest): Observable<Aplicacion> {
    return this.http.post<ApiResponse<Aplicacion>>(`${this.base}/aplicaciones`, data).pipe(map(r => r.data));
  }

  listAplicacionesPaciente(pacienteId: number): Observable<PacienteAplicacion[]> {
    return this.http.get<ApiResponse<PacienteAplicacion[]>>(`${this.base}/${pacienteId}/aplicaciones`).pipe(map(r => r.data));
  }

  asignarAplicacion(pacienteId: number, aplicacionId: number): Observable<PacienteAplicacion> {
    return this.http.post<ApiResponse<PacienteAplicacion>>(`${this.base}/${pacienteId}/aplicaciones`, { aplicacion_id: aplicacionId }).pipe(map(r => r.data));
  }

  revocarAplicacion(pacienteId: number, aplicacionId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${pacienteId}/aplicaciones/${aplicacionId}`);
  }

  getAccesoStats(pacienteId: number, desde?: string, hasta?: string): Observable<{ paciente_id: number; total_accesos: number; ultimo_acceso: string }> {
    let p = new HttpParams();
    if (desde) p = p.set('desde', desde);
    if (hasta) p = p.set('hasta', hasta);
    return this.http.get<ApiResponse<{ paciente_id: number; total_accesos: number; ultimo_acceso: string }>>(`${this.base}/${pacienteId}/acceso-stats`, { params: p })
      .pipe(map(r => r.data));
  }
}
