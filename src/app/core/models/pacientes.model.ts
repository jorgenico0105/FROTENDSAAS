export interface Paciente {
  id: number;
  clinica_id: number;
  nombres: string;
  apellidos: string;
  sexo?: string;
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
  numero_documento?: string;
  tipo_sangre?: string;
  foto?: string;
  state: string;
  creado: string;
}

export interface Aplicacion {
  id: number;
  clinica_id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  state: string;
}

export interface PacienteAplicacion {
  id: number;
  paciente_id: number;
  aplicacion_id: number;
  clinica_id: number;
  state: string;
  creado_por: number;
  creado_en: string;
}

export interface CreateAplicacionRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface CreatePacienteRequest {
  nombres: string;
  apellidos: string;
  sexo?: string;
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  telefono?: string;
  correo?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
  numero_documento?: string;
  tipo_sangre?: string;
  direccion?: string;
}
