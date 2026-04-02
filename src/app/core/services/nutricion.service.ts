import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  NutricionAlimento, CreateAlimentoRequest,
  NutricionDietaPaciente, CreateDietaRequest,
  NutricionMenu, CreateMenuRequest,
  NutricionDietaDetalle, NutricionDietaAlimento, AddAlimentoDetalleRequest,
  NutricionProgreso, CreateProgresoRequest,
  NutricionEjercicioCatalogo, CreateEjercicioCatalogoRequest,
  NutricionEjercicioPaciente,
  NutricionR24H, NutricionR24HItem,
  NutricionPreferencia, CreatePreferenciaRequest,
  NutricionPacienteXP, NutricionLogroPaciente, NutricionDietaCatalogo,
  CalcularFormulasRequest, NutricionFormulasResult,
  NutricionMenuConDetalles,
  NutricionArchivoPDF, NutricionTipoRecurso,
  NutricionRegistroComida,
  NutricionRegistroEjercicio
} from '../models/nutricion.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class NutricionService {
  private base = `${environment.apiUrl}/nutricion`;

  constructor(private http: HttpClient) {}

  // ─── Catálogos ─────────────────────────────────────────────────────────────

  listAlimentos(params?: { categoria?: string; search?: string }): Observable<NutricionAlimento[]> {
    let httpParams = new HttpParams();
    if (params?.categoria) httpParams = httpParams.set('categoria', params.categoria);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<ApiResponse<NutricionAlimento[]>>(`${this.base}/alimentos`, { params: httpParams })
      .pipe(map(r => r.data ?? []));
  }

  createAlimento(data: CreateAlimentoRequest): Observable<NutricionAlimento> {
    return this.http.post<ApiResponse<NutricionAlimento>>(`${this.base}/alimentos`, data)
      .pipe(map(r => r.data));
  }

  listEjerciciosCatalogo(): Observable<NutricionEjercicioCatalogo[]> {
    return this.http.get<ApiResponse<NutricionEjercicioCatalogo[]>>(`${this.base}/ejercicios-catalogo`)
      .pipe(map(r => r.data ?? []));
  }

  createEjercicioCatalogo(data: CreateEjercicioCatalogoRequest): Observable<NutricionEjercicioCatalogo> {
    return this.http.post<ApiResponse<NutricionEjercicioCatalogo>>(`${this.base}/ejercicios-catalogo`, data)
      .pipe(map(r => r.data));
  }

  listDietasCatalogo(): Observable<NutricionDietaCatalogo[]> {
    return this.http.get<ApiResponse<NutricionDietaCatalogo[]>>(`${this.base}/dietas-catalogo`)
      .pipe(map(r => r.data ?? []));
  }

  listDietasRequierenCambio(): Observable<NutricionDietaPaciente[]> {
    return this.http.get<ApiResponse<NutricionDietaPaciente[]>>(`${this.base}/menus/requieren-cambio`)
      .pipe(map(r => r.data ?? []));
  }

  // ─── Dietas del paciente ───────────────────────────────────────────────────

  listDietasByPaciente(pacienteId: number): Observable<NutricionDietaPaciente[]> {
    return this.http.get<ApiResponse<NutricionDietaPaciente[]>>(`${this.base}/pacientes/${pacienteId}/dietas`)
      .pipe(map(r => r.data ?? []));
  }

  createDieta(pacienteId: number, data: CreateDietaRequest): Observable<NutricionDietaPaciente> {
    return this.http.post<ApiResponse<NutricionDietaPaciente>>(`${this.base}/pacientes/${pacienteId}/dietas`, data)
      .pipe(map(r => r.data));
  }

  getDieta(pacienteId: number, dietaId: number): Observable<NutricionDietaPaciente> {
    return this.http.get<ApiResponse<NutricionDietaPaciente>>(`${this.base}/pacientes/${pacienteId}/dietas/${dietaId}`)
      .pipe(map(r => r.data));
  }

  updateDieta(pacienteId: number, dietaId: number, data: Partial<CreateDietaRequest>): Observable<NutricionDietaPaciente> {
    return this.http.put<ApiResponse<NutricionDietaPaciente>>(`${this.base}/pacientes/${pacienteId}/dietas/${dietaId}`, data)
      .pipe(map(r => r.data));
  }

  // ─── Menús semanales ──────────────────────────────────────────────────────

  listMenusByDieta(pacienteId: number, dietaId: number): Observable<NutricionMenu[]> {
    return this.http.get<ApiResponse<NutricionMenu[]>>(`${this.base}/pacientes/${pacienteId}/dietas/${dietaId}/menus`)
      .pipe(map(r => r.data ?? []));
  }

  createMenu(pacienteId: number, dietaId: number, data: CreateMenuRequest): Observable<NutricionMenu> {
    return this.http.post<ApiResponse<NutricionMenu>>(`${this.base}/pacientes/${pacienteId}/dietas/${dietaId}/menus`, data)
      .pipe(map(r => r.data));
  }

  getMenu(pacienteId: number, menuId: number): Observable<NutricionMenu> {
    return this.http.get<ApiResponse<NutricionMenu>>(`${this.base}/pacientes/${pacienteId}/menus/${menuId}`)
      .pipe(map(r => r.data));
  }

  getMenuConDetalles(pacienteId: number, menuId: number): Observable<NutricionMenuConDetalles> {
    return this.http.get<ApiResponse<NutricionMenuConDetalles>>(`${this.base}/pacientes/${pacienteId}/menus/${menuId}`)
      .pipe(map(r => r.data));
  }

  getDetallesMenu(pacienteId: number, menuId: number): Observable<NutricionDietaDetalle[]> {
    return this.http.get<ApiResponse<NutricionDietaDetalle[]>>(`${this.base}/pacientes/${pacienteId}/menus/${menuId}/detalles`)
      .pipe(map(r => r.data ?? []));
  }

  addDetalleMenu(pacienteId: number, menuId: number, data: { tipo_comida_id: number; dia_numero: number; nombre_comida?: string; instrucciones?: string }): Observable<NutricionDietaDetalle> {
    return this.http.post<ApiResponse<NutricionDietaDetalle>>(`${this.base}/pacientes/${pacienteId}/menus/${menuId}/detalles`, data)
      .pipe(map(r => r.data));
  }

  // ─── Alimentos de un detalle ───────────────────────────────────────────────

  getAlimentosDetalle(pacienteId: number, detalleId: number): Observable<NutricionDietaAlimento[]> {
    return this.http.get<ApiResponse<NutricionDietaAlimento[]>>(`${this.base}/pacientes/${pacienteId}/detalles/${detalleId}/alimentos`)
      .pipe(map(r => r.data ?? []));
  }

  addAlimentoDetalle(pacienteId: number, detalleId: number, data: AddAlimentoDetalleRequest): Observable<NutricionDietaAlimento> {
    return this.http.post<ApiResponse<NutricionDietaAlimento>>(`${this.base}/pacientes/${pacienteId}/menu-detalles/${detalleId}/alimentos`, data)
      .pipe(map(r => r.data));
  }

  removeAlimentoDetalle(pacienteId: number, detalleId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/pacientes/${pacienteId}/menu-detalles/${detalleId}/alimentos/${id}`);
  }

  updateAlimentoDetalle(pacienteId: number, detalleId: number, id: number, gramos: number): Observable<NutricionDietaAlimento> {
    return this.http.put<ApiResponse<NutricionDietaAlimento>>(
      `${this.base}/pacientes/${pacienteId}/menu-detalles/${detalleId}/alimentos/${id}`,
      { gramos_asignados: gramos }
    ).pipe(map(r => r.data));
  }

  // ─── Progreso ─────────────────────────────────────────────────────────────

  listProgreso(pacienteId: number): Observable<NutricionProgreso[]> {
    return this.http.get<ApiResponse<NutricionProgreso[]>>(`${this.base}/pacientes/${pacienteId}/progreso`)
      .pipe(map(r => r.data ?? []));
  }

  addProgreso(pacienteId: number, data: CreateProgresoRequest): Observable<NutricionProgreso> {
    return this.http.post<ApiResponse<NutricionProgreso>>(`${this.base}/pacientes/${pacienteId}/progreso`, data)
      .pipe(map(r => r.data));
  }

  addProgresoMultipart(pacienteId: number, data: CreateProgresoRequest, foto?: File): Observable<NutricionProgreso> {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) form.append(k, String(v)); });
    if (foto) form.append('foto', foto);
    return this.http.post<ApiResponse<NutricionProgreso>>(`${this.base}/pacientes/${pacienteId}/progreso`, form)
      .pipe(map(r => r.data));
  }

  // ─── Ejercicios del paciente ──────────────────────────────────────────────

  listEjerciciosByPaciente(pacienteId: number): Observable<NutricionEjercicioPaciente[]> {
    return this.http.get<ApiResponse<NutricionEjercicioPaciente[]>>(`${this.base}/pacientes/${pacienteId}/ejercicios`)
      .pipe(map(r => r.data ?? []));
  }

  addEjercicioPaciente(pacienteId: number, data: { ejercicio_id: number; dia_numero?: number; dia_semana?: string; duracion_min?: number; series?: number; repeticiones?: number; instrucciones?: string }): Observable<NutricionEjercicioPaciente> {
    return this.http.post<ApiResponse<NutricionEjercicioPaciente>>(`${this.base}/pacientes/${pacienteId}/ejercicios`, data)
      .pipe(map(r => r.data));
  }

  // ─── R24H ─────────────────────────────────────────────────────────────────

  listR24H(pacienteId: number): Observable<NutricionR24H[]> {
    return this.http.get<ApiResponse<NutricionR24H[]>>(`${this.base}/pacientes/${pacienteId}/r24h`)
      .pipe(map(r => r.data ?? []));
  }

  createR24H(pacienteId: number, data: { fecha: string; observaciones?: string }): Observable<NutricionR24H> {
    return this.http.post<ApiResponse<NutricionR24H>>(`${this.base}/pacientes/${pacienteId}/r24h`, data)
      .pipe(map(r => r.data));
  }

  listR24HItems(pacienteId: number, r24hId: number): Observable<NutricionR24HItem[]> {
    return this.http.get<ApiResponse<NutricionR24HItem[]>>(`${this.base}/pacientes/${pacienteId}/r24h/${r24hId}/items`)
      .pipe(map(r => r.data ?? []));
  }

  addR24HItem(pacienteId: number, r24hId: number, data: { hora_aprox?: string; tipo_comida: string; alimento: string; cantidad?: string; calorias_est?: number }): Observable<NutricionR24HItem> {
    return this.http.post<ApiResponse<NutricionR24HItem>>(`${this.base}/pacientes/${pacienteId}/r24h/${r24hId}/items`, data)
      .pipe(map(r => r.data));
  }

  // ─── Preferencias ─────────────────────────────────────────────────────────

  listPreferencias(pacienteId: number): Observable<NutricionPreferencia[]> {
    return this.http.get<ApiResponse<NutricionPreferencia[]>>(`${this.base}/pacientes/${pacienteId}/preferencias`)
      .pipe(map(r => r.data ?? []));
  }

  addPreferencia(pacienteId: number, data: CreatePreferenciaRequest): Observable<NutricionPreferencia> {
    return this.http.post<ApiResponse<NutricionPreferencia>>(`${this.base}/pacientes/${pacienteId}/preferencias`, data)
      .pipe(map(r => r.data));
  }

  deletePreferencia(pacienteId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/pacientes/${pacienteId}/preferencias/${id}`);
  }

  // ─── XP y logros ──────────────────────────────────────────────────────────

  getXP(pacienteId: number): Observable<NutricionPacienteXP> {
    return this.http.get<ApiResponse<NutricionPacienteXP>>(`${this.base}/pacientes/${pacienteId}/xp`)
      .pipe(map(r => r.data));
  }

  listLogros(pacienteId: number): Observable<NutricionLogroPaciente[]> {
    return this.http.get<ApiResponse<NutricionLogroPaciente[]>>(`${this.base}/pacientes/${pacienteId}/logros`)
      .pipe(map(r => r.data ?? []));
  }

  // ─── Fórmulas nutricionales ───────────────────────────────────────────────

  calcularFormulas(req: CalcularFormulasRequest): Observable<NutricionFormulasResult> {
    return this.http.post<ApiResponse<NutricionFormulasResult>>(`${this.base}/formulas`, req)
      .pipe(map(r => r.data));
  }

  // ─── Registros comida (app móvil) ─────────────────────────────────────────

  listRegistrosComida(pacienteId: number, params?: { desde?: string; hasta?: string }): Observable<NutricionRegistroComida[]> {
    let p = new HttpParams();
    if (params?.desde) p = p.set('desde', params.desde);
    if (params?.hasta) p = p.set('hasta', params.hasta);
    return this.http.get<ApiResponse<NutricionRegistroComida[]>>(
      `${this.base}/pacientes/${pacienteId}/registros-comida`, { params: p }
    ).pipe(map(r => r.data ?? []));
  }

  // ─── Registros ejercicio (app móvil) ──────────────────────────────────────

  listRegistrosEjercicio(pacienteId: number, params?: { desde?: string; hasta?: string }): Observable<NutricionRegistroEjercicio[]> {
    let p = new HttpParams();
    if (params?.desde) p = p.set('desde', params.desde);
    if (params?.hasta) p = p.set('hasta', params.hasta);
    return this.http.get<ApiResponse<NutricionRegistroEjercicio[]>>(
      `${this.base}/pacientes/${pacienteId}/registros-ejercicio`, { params: p }
    ).pipe(map(r => r.data ?? []));
  }

  // ─── Tipo de Recurso ──────────────────────────────────────────────────────

  listTipoRecursos(): Observable<NutricionTipoRecurso[]> {
    return this.http.get<ApiResponse<NutricionTipoRecurso[]>>(`${this.base}/tipo-recursos`)
      .pipe(map(r => r.data ?? []));
  }

  createTipoRecurso(nombre: string): Observable<NutricionTipoRecurso> {
    return this.http.post<ApiResponse<NutricionTipoRecurso>>(`${this.base}/tipo-recursos`, { nombre })
      .pipe(map(r => r.data));
  }

  updateTipoRecurso(id: number, nombre: string): Observable<NutricionTipoRecurso> {
    return this.http.put<ApiResponse<NutricionTipoRecurso>>(`${this.base}/tipo-recursos/${id}`, { nombre })
      .pipe(map(r => r.data));
  }

  deleteTipoRecurso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/tipo-recursos/${id}`);
  }

  // ─── Archivos PDF / Recursos ──────────────────────────────────────────────

  listArchivosPDF(params?: { tipo_recurso_id?: number; paciente_id?: number }): Observable<NutricionArchivoPDF[]> {
    let p = new HttpParams();
    if (params?.tipo_recurso_id) p = p.set('tipo_recurso_id', params.tipo_recurso_id);
    if (params?.paciente_id)     p = p.set('paciente_id', params.paciente_id);
    return this.http.get<ApiResponse<NutricionArchivoPDF[]>>(`${this.base}/archivos-pdf`, { params: p })
      .pipe(map(r => r.data ?? []));
  }

  uploadArchivoPDF(formData: FormData): Observable<NutricionArchivoPDF> {
    return this.http.post<ApiResponse<NutricionArchivoPDF>>(`${this.base}/archivos-pdf`, formData)
      .pipe(map(r => r.data));
  }

  deleteArchivoPDF(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/archivos-pdf/${id}`);
  }
}
