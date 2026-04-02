import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Cita, CreateCitaRequest, UpdateEstadoRequest,
  Sesion, CreateSesionRequest, UpdateSesionRequest,
  TipoCita, EstadoCita, HorarioMedico,
  PaginatedCitas
} from '../models/agenda.model';
import { ApiWrapper } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private base = `${environment.apiUrl}/agenda`;

  constructor(private http: HttpClient) {}

  // ── Citas ──────────────────────────────────────────────────────────────────

  listCitas(params: {
    medico_id?: number;
    clinica_id?: number;
    fecha?: string;       // 'YYYY-MM-DD'
    page?: number;
    size?: number;
  } = {}): Observable<PaginatedCitas> {
    let p = new HttpParams();
    if (params.medico_id) p = p.set('medico_id', params.medico_id);
    if (params.clinica_id) p = p.set('clinica_id', params.clinica_id);
    if (params.fecha)      p = p.set('fecha', params.fecha);
    if (params.page)       p = p.set('page', params.page);
    if (params.size)       p = p.set('size', params.size);
    return this.http.get<PaginatedCitas>(`${this.base}/citas`, { params: p });
  }

  getCita(id: number): Observable<Cita> {
    return this.http.get<ApiWrapper<Cita>>(`${this.base}/citas/${id}`)
      .pipe(map(r => r.data));
  }

  createCita(req: CreateCitaRequest): Observable<Cita> {
    return this.http.post<ApiWrapper<Cita>>(`${this.base}/citas`, req)
      .pipe(map(r => r.data));
  }

  updateCitaPaciente(id: number, pacienteId: number): Observable<Cita> {
    return this.http.patch<ApiWrapper<Cita>>(`${this.base}/citas/${id}/paciente`, { paciente_id: pacienteId })
      .pipe(map(r => r.data));
  }

  updateEstado(id: number, req: UpdateEstadoRequest): Observable<Cita> {
    return this.http.put<ApiWrapper<Cita>>(`${this.base}/citas/${id}/estado`, req)
      .pipe(map(r => r.data));
  }

  deleteCita(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/citas/${id}`);
  }

  // ── Sesiones ───────────────────────────────────────────────────────────────

  createSesion(citaId: number, req: CreateSesionRequest): Observable<Sesion> {
    return this.http.post<ApiWrapper<Sesion>>(`${this.base}/citas/${citaId}/sesion`, req)
      .pipe(map(r => r.data));
  }

  getSesion(id: number): Observable<Sesion> {
    return this.http.get<ApiWrapper<Sesion>>(`${this.base}/sesiones/${id}`)
      .pipe(map(r => r.data));
  }

  updateSesion(id: number, req: UpdateSesionRequest): Observable<Sesion> {
    return this.http.put<ApiWrapper<Sesion>>(`${this.base}/sesiones/${id}`, req)
      .pipe(map(r => r.data));
  }

  // ── Catálogos ──────────────────────────────────────────────────────────────

  listTiposCita(): Observable<TipoCita[]> {
    return this.http.get<ApiWrapper<TipoCita[]>>(`${this.base}/tipos-cita`)
      .pipe(map(r => r.data));
  }

  listEstadosCita(): Observable<EstadoCita[]> {
    return this.http.get<ApiWrapper<EstadoCita[]>>(`${this.base}/estados-cita`)
      .pipe(map(r => r.data));
  }

  // ── Horarios ───────────────────────────────────────────────────────────────

  listHorarios(medicoId?: number): Observable<HorarioMedico[]> {
    let p = new HttpParams();
    if (medicoId) p = p.set('medico_id', medicoId);
    return this.http.get<ApiWrapper<HorarioMedico[]>>(`${this.base}/horarios`, { params: p })
      .pipe(map(r => r.data));
  }
}
