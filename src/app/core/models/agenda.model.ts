import { Paciente } from "./pacientes.model";

// ─── Catálogos ────────────────────────────────────────────────────────────────
export interface TipoCita {
  id: number;
  nombre: string;
  state: string;
  id_rol: number;
  need_historia: boolean;
}

export interface EstadoCita {
  id: number;
  codigo: 'PE' | 'CF' | 'AT' | 'CA' | 'NA';
  nombre: string;
}

export const ESTADO_LABELS: Record<string, string> = {
  PE: 'Pendiente', CF: 'Confirmada', AT: 'Atendida', CA: 'Cancelada', NA: 'No Asistió'
};

export const ESTADO_COLORS: Record<string, string> = {
  PE: 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
  CF: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
  AT: 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
  CA: 'bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400',
  NA: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export const ESTADO_DOT: Record<string, string> = {
  PE: 'bg-warning-400', CF: 'bg-primary-500', AT: 'bg-success-500', CA: 'bg-danger-500', NA: 'bg-gray-400',
};

// ─── Cita ─────────────────────────────────────────────────────────────────────
export interface Cita {
  id: number;
  fecha: string;
  hora: string;
  duracion_min: number;
  id_medico: number;
  id_paciente: number;
  paciente?: { id: number; nombres: string; apellidos: string; telefono?: string };
  id_clinica: number;
  tipo_cita_id: number;
  tipo_cita?: TipoCita;
  estado_cita_id: number;
  "pre-paciente" ?: Paciente
  estado_cita?: EstadoCita;
  sucursal_id?: number;
  consultorio_id?: number;
  pre_paciente_id?: number;
  motivo?: string;
  url_sesion?: string;
  notificado: boolean;
  state: string;
  creado_en: string;
  actualizado_en: string;
}


export interface CreateCitaRequest {
  fecha: string;       // ISO date "2026-03-20"
  hora: string;        // "09:00"
  duracion_min?: number;
  id_medico: number;
  id_paciente: number;
  id_clinica: number;
  tipo_cita_id: number;
  sucursal_id?: number;
  consultorio_id?: number;
  pre_paciente_id?: number;
  motivo?: string;
  url_sesion?: string;
}

export interface UpdateEstadoRequest {
  estado_codigo: 'PE' | 'CF' | 'AT' | 'CA' | 'NA';
}

// ─── Sesión ───────────────────────────────────────────────────────────────────
export interface Sesion {
  id: number;
  cita_id: number;
  cita?: Cita;
  inicio: string;
  fin?: string;
  resumen?: string;
  conclusiones?: string;
  state: string;
  creado_en: string;
  actualizado_en: string;
}

export interface CreateSesionRequest {
  inicio: string;
  fin?: string;
  resumen?: string;
  conclusiones?: string;
}

export interface UpdateSesionRequest {
  fin?: string;
  resumen?: string;
  conclusiones?: string;
}

// ─── Horario ──────────────────────────────────────────────────────────────────
export interface HorarioMedico {
  id: number;
  medico_id: number;
  clinica_id?: number;
  consultorio_id?: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  intervalo_min: number;
  state: string;
}

// ─── API response shapes ──────────────────────────────────────────────────────
export interface PaginatedCitas {
  success: boolean;
  data: Cita[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}
