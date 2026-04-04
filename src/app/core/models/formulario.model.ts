export interface TipoFormulario {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface FormularioOpcion {
  id: number;
  pregunta_id: number;
  valor: string;
  etiqueta: string;
  orden: number;
  puntos: number;
}

export interface FormularioPregunta {
  id: number;
  formulario_id: number;
  pregunta: string;
  tipo_respuesta: TipoRespuesta;
  obligatorio: boolean;
  orden: number;
  opciones?: FormularioOpcion[];
}

export type TipoRespuesta = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'MULTISELECT' | 'BOOLEAN';

export const TIPO_RESPUESTA_LABELS: Record<TipoRespuesta, string> = {
  TEXT:        'Texto libre',
  NUMBER:      'Número',
  DATE:        'Fecha',
  SELECT:      'Selección única',
  MULTISELECT: 'Selección múltiple',
  BOOLEAN:     'Sí / No',
};

export interface Formulario {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo_formulario_id: number;
  profesion_id?: number;
  usuario_id: number;
  clinica_id?: number;
  state: string;
  creado_en: string;
}

export interface FormularioDetalle {
  formulario: Formulario;
  preguntas: FormularioPregunta[];
  opciones: Record<number, FormularioOpcion[]>;
}

// ─── DTOs para crear/actualizar ───────────────────────────────────────────────

export interface CreateOpcionRequest {
  valor: string;
  etiqueta: string;
  orden?: number;
  puntos?: number;
}

export interface CreatePreguntaRequest {
  pregunta: string;
  tipo_respuesta: TipoRespuesta;
  obligatorio: boolean;
  orden?: number;
  opciones?: CreateOpcionRequest[];
}

export interface CreateFormularioRequest {
  nombre: string;
  descripcion?: string;
  tipo_formulario_id: number;
  profesion_id?: number;
  preguntas: CreatePreguntaRequest[];
}

export interface UpdateFormularioRequest {
  nombre?: string;
  descripcion?: string;
  preguntas?: CreatePreguntaRequest[];
}

export interface CreateTipoFormularioRequest {
  codigo: string;       // exactly 3 chars, uppercase
  nombre: string;       // max 100
  descripcion?: string; // max 255
}

export interface UpdateTipoFormularioRequest {
  nombre?: string;
  descripcion?: string;
}

export interface CreateHistoriaRespuestaRequest {
  pregunta_id: number;
  respuesta_texto?: string;
  respuesta_numero?: number | null;
  respuesta_fecha?: string | null;
}

export interface CreateHistoriaRequest {
  medico_id: number;
  formulario_id: number;
  fecha: string;
  observacion_general?: string;
  preguntas: CreateHistoriaRespuestaRequest[];
}
