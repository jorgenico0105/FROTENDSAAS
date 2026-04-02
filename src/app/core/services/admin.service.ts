import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Clinica, CreateClinicaRequest,
  Profesion, CreateProfesionRequest,
  PlanSaas, CreatePlanSaasRequest,
  Transaccion, Rol, CreateRolRequest,
  UsuarioAdmin, AsignarTransaccionesRequest,
  AsignarUsuarioClinicaRequest, EstiloClinica
} from '../models/admin.model';

interface ApiResponse<T> { success: boolean; data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api: string;

  constructor(private http: HttpClient) {
    this.api = environment.apiUrl;
  }

  // ---- Clínicas ----
  getClinicas(): Observable<Clinica[]> {
    return this.http.get<ApiResponse<Clinica[]>>(`${this.api}/admin/clinicas`).pipe(map(r => r.data));
  }
  getClinica(id: number): Observable<Clinica> {
    return this.http.get<ApiResponse<Clinica>>(`${this.api}/admin/clinicas/${id}`).pipe(map(r => r.data));
  }
  createClinica(body: CreateClinicaRequest): Observable<Clinica> {
    return this.http.post<ApiResponse<Clinica>>(`${this.api}/admin/clinicas`, body).pipe(map(r => r.data));
  }
  updateClinica(id: number, body: Partial<CreateClinicaRequest>): Observable<Clinica> {
    return this.http.put<ApiResponse<Clinica>>(`${this.api}/admin/clinicas/${id}`, body).pipe(map(r => r.data));
  }
  deleteClinica(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/clinicas/${id}`);
  }

  // ---- Usuarios de clínica ----
  getUsuariosClinica(clinicaId: number): Observable<UsuarioAdmin[]> {
    return this.http.get<ApiResponse<UsuarioAdmin[]>>(`${this.api}/admin/clinicas/${clinicaId}/usuarios`).pipe(map(r => r.data));
  }
  asignarUsuarioClinica(clinicaId: number, body: AsignarUsuarioClinicaRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/admin/clinicas/${clinicaId}/usuarios`, body);
  }
  removerUsuarioClinica(clinicaId: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/clinicas/${clinicaId}/usuarios/${usuarioId}`);
  }

  // ---- Profesiones ----
  getProfesiones(): Observable<Profesion[]> {
    return this.http.get<ApiResponse<Profesion[]>>(`${this.api}/admin/profesiones`).pipe(map(r => r.data));
  }
  createProfesion(body: CreateProfesionRequest): Observable<Profesion> {
    return this.http.post<ApiResponse<Profesion>>(`${this.api}/admin/profesiones`, body).pipe(map(r => r.data));
  }
  updateProfesion(id: number, body: Partial<CreateProfesionRequest>): Observable<Profesion> {
    return this.http.put<ApiResponse<Profesion>>(`${this.api}/admin/profesiones/${id}`, body).pipe(map(r => r.data));
  }
  deleteProfesion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/profesiones/${id}`);
  }

  // ---- Planes SaaS ----
  getPlanesSaas(): Observable<PlanSaas[]> {
    return this.http.get<ApiResponse<PlanSaas[]>>(`${this.api}/admin/planes-saas`).pipe(map(r => r.data));
  }
  createPlanSaas(body: CreatePlanSaasRequest): Observable<PlanSaas> {
    return this.http.post<ApiResponse<PlanSaas>>(`${this.api}/admin/planes-saas`, body).pipe(map(r => r.data));
  }
  updatePlanSaas(id: number, body: Partial<CreatePlanSaasRequest>): Observable<PlanSaas> {
    return this.http.put<ApiResponse<PlanSaas>>(`${this.api}/admin/planes-saas/${id}`, body).pipe(map(r => r.data));
  }

  // ---- Transacciones (Menu items) ----
  getTransacciones(): Observable<Transaccion[]> {
    return this.http.get<ApiResponse<Transaccion[]>>(`${this.api}/admin/transacciones`).pipe(map(r => r.data));
  }

  // ---- Roles ----
  getRoles(): Observable<Rol[]> {
    return this.http.get<ApiResponse<Rol[]>>(`${this.api}/admin/roles`).pipe(map(r => r.data));
  }
  getRol(id: number): Observable<Rol> {
    return this.http.get<ApiResponse<Rol>>(`${this.api}/admin/roles/${id}`).pipe(map(r => r.data));
  }
  createRol(body: CreateRolRequest): Observable<Rol> {
    return this.http.post<ApiResponse<Rol>>(`${this.api}/admin/roles`, body).pipe(map(r => r.data));
  }
  updateRol(id: number, body: Partial<CreateRolRequest>): Observable<Rol> {
    return this.http.put<ApiResponse<Rol>>(`${this.api}/admin/roles/${id}`, body).pipe(map(r => r.data));
  }
  getTransaccionesRol(rolId: number): Observable<Transaccion[]> {
    return this.http.get<ApiResponse<Transaccion[]>>(`${this.api}/admin/roles/${rolId}/transacciones`).pipe(map(r => r.data));
  }
  asignarTransaccionesRol(rolId: number, body: AsignarTransaccionesRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/admin/roles/${rolId}/transacciones`, body);
  }
  revocarTransaccionRol(rolId: number, transaccionId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/roles/${rolId}/transacciones/${transaccionId}`);
  }

  // ---- Roles de usuario ----
  getRolesUsuario(usuarioId: number): Observable<Rol[]> {
    return this.http.get<ApiResponse<Rol[]>>(`${this.api}/admin/usuarios/${usuarioId}/roles`).pipe(map(r => r.data));
  }
  asignarRolUsuario(usuarioId: number, body: { rol_id: number; clinica_id: number }): Observable<void> {
    return this.http.post<void>(`${this.api}/admin/usuarios/${usuarioId}/roles`, body);
  }
  revocarRolUsuario(usuarioId: number, rolId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/usuarios/${usuarioId}/roles/${rolId}`);
  }

  // ---- Estilos de clínica ----
  getEstiloClinica(): Observable<EstiloClinica> {
    return this.http.get<ApiResponse<EstiloClinica>>(`${this.api}/auth/estilos`).pipe(map(r => r.data));
  }
}
