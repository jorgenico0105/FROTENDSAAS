import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Formulario, FormularioDetalle, TipoFormulario,
  CreateFormularioRequest, UpdateFormularioRequest, CreateHistoriaRequest,
  CreateTipoFormularioRequest, UpdateTipoFormularioRequest
} from '../models/formulario.model';
import { PacienteImagen } from '../models/nutricion.model';

interface ApiWrapper<T> { success: boolean; message?: string; data: T; }

@Injectable({ providedIn: 'root' })
export class FormulariosService {
  private base = `${environment.apiUrl}/historia`;

  constructor(private http: HttpClient) {}

  listTipos(): Observable<TipoFormulario[]> {
    return this.http.get<ApiWrapper<TipoFormulario[]>>(`${this.base}/tipos-formulario`)
      .pipe(map(r => r.data ?? []));
  }

  createTipo(req: CreateTipoFormularioRequest): Observable<TipoFormulario> {
    return this.http.post<ApiWrapper<TipoFormulario>>(`${this.base}/tipos-formulario`, req)
      .pipe(map(r => r.data));
  }

  updateTipo(id: number, req: UpdateTipoFormularioRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/tipos-formulario/${id}`, req);
  }

  deleteTipo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/tipos-formulario/${id}`);
  }

  list(tipoId?: number): Observable<Formulario[]> {
    const url = tipoId ? `${this.base}/formularios?tipo_id=${tipoId}` : `${this.base}/formularios`;
    return this.http.get<ApiWrapper<Formulario[]>>(url)
      .pipe(map(r => r.data ?? []));
  }

  get(id: number): Observable<FormularioDetalle> {
    return this.http.get<FormularioDetalle>(`${this.base}/formularios/${id}`);
  }

  create(req: CreateFormularioRequest): Observable<Formulario> {
    return this.http.post<ApiWrapper<Formulario>>(`${this.base}/formularios`, req)
      .pipe(map(r => r.data));
  }

  update(id: number, req: UpdateFormularioRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/formularios/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/formularios/${id}`);
  }

  getHistoriaClinicaForm(): Observable<Formulario[]> {
    return this.http.get<ApiWrapper<Formulario[]>>(`${this.base}/historia-clinica-form`)
      .pipe(map(r => r.data ?? []));
  }

  getMedicionesForm(): Observable<FormularioDetalle> {
    return this.get(5);
  }

  submitHistoria(pacienteId: number, req: CreateHistoriaRequest): Observable<unknown> {
    return this.http.post(`${this.base}/pacientes/${pacienteId}/historia`, req);
  }

  listImagenesPaciente(pacienteId: number): Observable<PacienteImagen[]> {
    return this.http.get<ApiWrapper<PacienteImagen[]>>(`${this.base}/pacientes/${pacienteId}/imagenes`)
      .pipe(map(r => r.data ?? []));
  }

  uploadImagenPaciente(pacienteId: number, file: File, descripcion?: string): Observable<PacienteImagen> {
    const form = new FormData();
    form.append('imagen', file);
    if (descripcion) form.append('descripcion', descripcion);
    return this.http.post<ApiWrapper<PacienteImagen>>(`${this.base}/pacientes/${pacienteId}/imagenes`, form)
      .pipe(map(r => r.data));
  }

  getHistoriasRespuestas(pacienteId: number): Observable<HistoriaRespuestaRow[]> {
    return this.http.get<ApiWrapper<HistoriaRespuestaRow[]>>(`${this.base}/pacientes/${pacienteId}/historias-respuestas`)
      .pipe(map(r => r.data ?? []));
  }
}

export interface HistoriaRespuestaRow {
  pregunta: string;
  orden_pregunta: number;
  multiple: boolean;
  respuesta_text: string | null;
  respuesta_numero: number | null;
  id_historia_clinica: number;
  fecha_registro: string;
  nombre_formulario: string;
}
