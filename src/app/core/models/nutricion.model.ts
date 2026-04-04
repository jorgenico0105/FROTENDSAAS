export interface NutricionTipoComida {
  id: number;
  codigo: string;
  nombre: string;
  orden: number;
  hora_ref?: string;
  state: string;
}

export interface NutricionAlimento {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  gramos_porcion: number;
  calorias: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  fibra_g?: number;
  azucares_g?: number;
  sodio_mg?: number;
  desayuno?: boolean;
  media_tarde_mana?: boolean;
  almuerzo?: boolean;
  merienda?: boolean;
  state: string;
  creado_en: string;
}

export interface CreateAlimentoRequest {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  gramos_porcion?: number;
  calorias: number;
  proteinas_g?: number;
  carbohidratos_g?: number;
  grasas_g?: number;
  fibra_g?: number;
  azucares_g?: number;
  sodio_mg?: number;
  desayuno?: boolean;
  media_tarde_mana?: boolean;
  almuerzo?: boolean;
  merienda?: boolean;
}

export interface NutricionDietaPaciente {
  id: number;
  paciente_id: number;
  medico_id: number;
  nombre: string;
  descripcion?: string;
  objetivo?: string;
  resultado_esperado?: string;
  fecha_inicio: string;
  duracion_dias: number;
  num_comidas: number;
  fecha_fin?: string;
  estado: string;
  state: string;
  calorias_dia_objetivo?: number;
  proteinas_g_dia?: number;
  carbohidratos_g_dia?: number;
  grasas_g_dia?: number;
  fibra_g_dia?: number;
  creado_en: string;
  actualizado_en: string;
}
export interface MenuRequiereCambio {
  id:                number;
  dieta_paciente_id: number;
  semana_numero:     number;
  fecha_inicio:      Date;
  fecha_fin:         Date;
  nombre:            string;
  estado:            string;
  state:             string;
  creado_en:         Date;
  actualizado_en:    Date;
  detalles:          null | any;
  dieta:  DietaCambio
}

export interface DietaCambio {
  id:                    number;
  paciente_id:           number;
  medico_id:             number;
  nombre:                string;
  objetivo:              string;
  resultado_esperado:    number;
  fecha_inicio:          Date;
  duracion_dias:         number;
  num_comidas:           number;
  fecha_fin:             Date;
  calorias_dia_objetivo: number;
  proteinas_g_dia:       number;
  carbohidratos_g_dia:   number;
  grasas_g_dia:          number;
  estado:                string;
  state:                 string;
  creado_en:             Date;
  actualizado_en:        Date;
  Paciente:              Paciente;
}

export interface Paciente {
  id:            number;
  clinica_id:    number;
  nombres:       string;
  apellidos:     string;
  tipo_paciente: number;
  state:         string;
  created_by:    number;
  creado:        Date;
  updated_at:    Date;
}


export interface CreateDietaRequest {
  nombre: string;
  descripcion?: string;
  objetivo?: string;
  resultado_esperado?: number;
  fecha_inicio: string;
  duracion_dias?: number;
  num_comidas?: number;
  calorias_dia_objetivo?: number;
  proteinas_g_dia?: number;
  carbohidratos_g_dia?: number;
  grasas_g_dia?: number;
  fibra_g_dia?: number;
}

export interface NutricionMenu {
  id: number;
  dieta_paciente_id: number;
  semana_numero: number;
  fecha_inicio: string;
  fecha_fin: string;
  nombre?: string;
  notas?: string;
  estado: string;
  state: string;
  creado_en: string;
}

export interface CreateMenuRequest {
  semana_numero: number;
  fecha_inicio: string;
  nombre?: string;
  notas?: string;
}

export interface NutricionDietaDetalle {
  id: number;
  menu_id: number;
  dieta_paciente_id: number;
  tipo_comida_id: number;
  dia_numero: number;
  nombre_comida?: string;
  instrucciones?: string;
  calorias_total?: number;
  proteinas_g_total?: number;
  carbohidratos_g_total?: number;
  grasas_g_total?: number;
  state: string;
  creado_en: string;
}

export interface NutricionDietaAlimento {
  id: number;
  dieta_detalle_id: number;
  alimento_id: number;
  gramos_asignados: number;
  calorias_calc?: number;
  proteinas_g_calc?: number;
  carbohidratos_g_calc?: number;
  grasas_g_calc?: number;
  observacion?: string;
  state: string;
}

export interface AddAlimentoDetalleRequest {
  alimento_id: number;
  gramos_asignados: number;
  observacion?: string;
}

export interface NutricionProgreso {
  id: number;
  paciente_id: number;
  medico_id?: number;
  dieta_paciente_id?: number;
  fecha: string;
  peso_kg?: number;
  altura_cm?: number;
  imc?: number;
  grasa_corporal_pct?: number;
  masa_muscular_kg?: number;
  cintura_cm?: number;
  cadera_cm?: number;
  pecho_cm?: number;
  brazo_cm?: number;
  muslo_cm?: number;
  hidratacion_litros?: number;
  sueno_horas?: number;
  energia_nivel?: number;
  notas?: string;
  creado_en: string;
}

export interface CreateProgresoRequest {
  fecha: string;
  dieta_paciente_id?: number;
  peso_kg?: number;
  altura_cm?: number;
  grasa_corporal_pct?: number;
  masa_muscular_kg?: number;
  cintura_cm?: number;
  cadera_cm?: number;
  pecho_cm?: number;
  brazo_cm?: number;
  muslo_cm?: number;
  hidratacion_litros?: number;
  sueno_horas?: number;
  energia_nivel?: number;
  pct_cumplimiento_dieta?: number;
  notas?: string;
  foto_progreso?: string;
}

export interface PacienteImagen {
  id: number;
  paciente_id: number;
  medico_id?: number;
  nombre_archivo: string;
  url_archivo: string;
  tipo_imagen: number;
  descripcion?: string;
  creado_en: string;
}

export interface NutricionEjercicioCatalogo {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  grupo_muscular?: string;
  calorias_por_hora?: number;
  unidad_medida: string;
  nivel?: string;
  url_referencia?: string;
  state: string;
  creado_en: string;
}

export interface CreateEjercicioCatalogoRequest {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  grupo_muscular?: string;
  calorias_por_hora?: number;
  unidad_medida?: string;
  nivel?: string;
}

export interface NutricionR24H {
  id: number;
  paciente_id: number;
  medico_id: number;
  fecha: string;
  observaciones?: string;
  calorias_total?: number;
  state: string;
  creado_en: string;
}

export interface NutricionR24HItem {
  id: number;
  r24h_id: number;
  hora_aprox?: string;
  tipo_comida?: string;
  alimento: string;
  cantidad?: string;
  calorias_est?: number;
  notas?: string;
  state: string;
}

export interface NutricionPreferencia {
  id: number;
  paciente_id: number;
  alimento_id?: number;
  nombre_libre?: string;
  tipo: string;
  notas?: string;
  state: string;
  Alimento : NutricionAlimento
}

export interface CreatePreferenciaRequest {
  alimento_id?: number;
  nombre_libre?: string;
  tipo: string;
  notas?: string;
}

export interface NutricionPacienteXP {
  id: number;
  paciente_id: number;
  xp_total: number;
  nivel: number;
  racha_actual: number;
  racha_maxima: number;
  ultimo_registro?: string;
}

export interface NutricionLogroCatalogo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  categoria?: string;
  puntos_xp: number;
}

export interface NutricionLogroPaciente {
  id: number;
  paciente_id: number;
  logro_id: number;
  fecha_obtenido: string;
  puntos_xp: number;
  logro?: NutricionLogroCatalogo;
}

export interface NutricionEjercicioPaciente {
  id: number;
  paciente_id: number;
  medico_id: number;
  ejercicio_id: number;
  dia_numero?: number;
  dia_semana?: string;
  duracion_min?: number;
  series?: number;
  repeticiones?: number;
  instrucciones?: string;
  estado: string;
  ejercicio?: NutricionEjercicioCatalogo;
}

// ─── Datos nutricionales para proyecciones (frontend) ────────────────────────
export interface DatosNutricionales {
  get_diario: number;   // Gasto Energético Total (GET)
  tmb: number;          // Tasa Metabólica Basal
  peso_kg: number;
  imc?: number;
  sexo: 'M' | 'F';
  edad?: number;
}

// ─── Recursos ─────────────────────────────────────────────────────────────────
export interface NutricionTipoRecurso {
  id: number;
  nombre: string;
  state: string;
}

export interface NutricionArchivoPDF {
  id: number;
  clinica_id: number;
  medico_id: number;
  paciente_id?: number;
  tipo_recurso_id: number;
  tipo_recurso?: NutricionTipoRecurso;
  titulo: string;
  descripcion?: string;
  ruta_archivo: string;
  state: string;
  creado_en: string;
}

// ─── Registros del paciente (desde la app móvil) ──────────────────────────────
export interface NutricionRegistroComida {
  id: number;
  paciente_id: number;
  fecha: string;
  tipo_comida_id: number;
  menu_detalle_id?: number;
  fuera_de_plan: boolean;
  descripcion_libre?: string;
  calorias_consumidas?: number;
  foto_comida?: string;
  proteinas_g?: number;
  carbohidratos_g?: number;
  grasas_g?: number;
  porcentaje_cumplido?: number;
  notas?: string;
  estado: string; // 'P'=pendiente, 'C'=consumida
  state: string;
  creado_en: string;
}

export interface NutricionRegistroEjercicio {
  id: number;
  paciente_id: number;
  fecha: string;
  ejercicio_id?: number;
  nombre_libre?: string;
  duracion_min_real?: number;
  series_real?: number;
  repeticiones_real?: number;
  calorias_quemadas?: number;
  nivel_esfuerzo?: number;
  notas?: string;
  state: string;
  creado_en: string;
}

// ─── Fórmulas nutricionales ──────────────────────────────────────────────────
export interface CalcularFormulasRequest {
  sexo: 'M' | 'F';
  edad_anos?: number;
  altura_cm?: number;
  peso_kg?: number;
  cintura_cm?: number;
  cadera_cm?: number;
  factor_actividad?: number;
}

export interface NutricionFormulasResult {
  imc?: number;
  clasificacion_imc?: string;
  icc?: number;
  riesgo_metabolico?: string;
  tmb?: number;
  geb?: number;
  get?: number;
}

export interface NutricionDietaCatalogo {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo_paciente_perfil?: string;
  objetivo?: string;
  calorias_dia?: number;
  proteinas_g_dia?: number;
  carbohidratos_g_dia?: number;
  grasas_g_dia?: number;
  state: string;
}

// ─── Menu con detalles (GET /menus/:menuId) ──────────────────────────────────

export interface NutricionMenuAlimentoDetalle {
  id: number;
  alimento_id: number;
  gramos_asignados: number;
  macros_calc?: {
    calorias?: number;
    proteinas_g?: number;
    carbohidratos_g?: number;
    grasas_g?: number;
  };
  Alimento?: NutricionAlimento;
}

export interface NutricionMenuDetalleConAlimentos {
  id: number;
  menu_id: number;
  tipo_comida_id: number;
  dia_numero: number;
  nombre_comida?: string;
  instrucciones?: string;
  macros_total?: {
    calorias?: number;
    proteinas_g?: number;
    carbohidratos_g?: number;
    grasas_g?: number;
  };
  calorias_total?: number;
  proteinas_g_total?: number;
  carbohidratos_g_total?: number;
  grasas_g_total?: number;
  alimentos?: NutricionMenuAlimentoDetalle[];
  state?: string;
}

export interface NutricionMenuConDetalles extends NutricionMenu {
  detalles?: NutricionMenuDetalleConAlimentos[];
}
