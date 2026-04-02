export interface Clinica {
  id: number;
  nombre: string;
  nit?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  ciudad?: string;
  logo_path?: string;
  state: string;
  creado_en?: string;
  actualizado_en?: string;
}

export interface CreateClinicaRequest {
  nombre: string;
  nit?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  ciudad?: string;
}

export interface Profesion {
  id: number;
  nombre: string;
  descripcion?: string;
  state: string;
  creado_en?: string;
}

export interface CreateProfesionRequest {
  nombre: string;
  descripcion?: string;
}

export interface PlanSaas {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio_mensual: number;
  precio_anual: number;
  max_usuarios?: number;
  max_pacientes?: number;
  state: string;
  creado_en?: string;
}

export interface CreatePlanSaasRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio_mensual: number;
  precio_anual: number;
  max_usuarios?: number;
  max_pacientes?: number;
}

export interface Transaccion {
  id: number;
  nombre: string;
  padre_id?: number;
  orden: number;
  ruta?: string;
  icono?: string;
  tipo: string;
  visible: boolean;
  general: boolean;
  clinica_id?: number;
  state: string;
  children?: Transaccion[];
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  state: string;
  creado_en?: string;
}

export interface CreateRolRequest {
  nombre: string;
  descripcion?: string;
}

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  username?: string;
  cedula?: string;
  celular?: string;
  foto?: string;
  rol_id: number;
  rol_name?: string;
  clinica_id?: number;
  state: string;
  created_at?: string;
}

export interface AsignarTransaccionesRequest {
  transaccion_ids: number[];
}

export interface AsignarUsuarioClinicaRequest {
  usuario_id: number;
  rol_id?: number;
}

export interface EstiloClinica {
  id?: number;
  clinica_id: number;
  logo_path?: string;
  url_archivo?: string;
  primary_color?: string;
  secondary_color?: string;
  third_color?: string;
  dark_mode?: boolean;
  es_activo?: boolean;
}
