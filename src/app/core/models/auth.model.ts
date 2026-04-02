import { User } from './user.model';

// ─── Backend EstiloClinica (admin/models/clinica.go) ─────────────────────────
export interface EstiloClinica {
  id?: number;
  clinica_id?: number;
  usuario_id?: number;
  nombre_archivo?: string;
  url_archivo?: string;
  logo_path?: string;
  tipo_logo?: string;

  // Brand colors
  primary_color?: string;
  secondary_color?: string;
  third_color?: string;

  // Surface stack (background layers)
  surface_1?: string;
  surface_2?: string;
  surface_3?: string;
  surface_4?: string;
  surface_5?: string;

  // Color ramp overrides (specific shade within each palette)
  primary_ramp?: string;
  secondary_ramp?: string;
  tertiary_ramp?: string;

  // Semantic
  error_color?: string;

  // Text tokens
  text_high?: string;
  text_muted?: string;
  text_hint?: string;

  // Misc tokens
  chip_color?: string;
  ghost_border?: string;
  ambient_shadow?: string;

  dark_mode?: boolean;
  es_activo?: boolean;
  state?: string;
  creado_en?: string;
}

// ─── Backend Clinica (admin/models/clinica.go) ────────────────────────────────
// Note: Go struct has no json tag on Estilo field, so it serializes as "Estilo" (capital E)
export interface Clinica {
  id: number;
  nombre: string;
  ruc?: string;
  razon_social?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  telefono?: string;
  correo?: string;
  sitio_web?: string;
  representante_legal?: string;
  tipo_clinica?: string;
  state?: string;
  creado_en?: string;
  actualizado_en?: string;
  Estilo?: EstiloClinica; // Capital E — Go serializes it without json tag
}

// ─── Backend UserResponse (auth/models/user.go → ToResponse()) ───────────────
export interface BackendUserResponse {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  celular?: string;
  foto?: string;
  state: string;
  rol: string;       // role name string (not an object)
  created_at: string;
}

// ─── Backend LoginResponse (auth/models/dto.go) ───────────────────────────────
export interface LoginData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: BackendUserResponse;
  clinicas: Clinica[];
}

// ─── HTTP wrapper that wraps every backend response ───────────────────────────
export interface ApiWrapper<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ─── JWT payload (decoded from access_token) ─────────────────────────────────
export interface TokenPayload {
  user_id: number;
  email: string;
  rol_id: number;
  rol_name: string;
  clinica_id?: number;
  exp: number;
  nbf: number;
  iat: number;
  iss?: string;
  sub?: string;
}

// ─── Menu item from /auth/permisosMenusPaleta ─────────────────────────────────
export interface MenuItemResponse {
  id: number;
  nombre: string;
  ruta?: string;
  icono?: string;
  tipo: string;
  orden: number;
  children?: MenuItemResponse[];
  // Frontend-only fields (used in default menu fallback / flat-list tree builder)
  padre_id?: number;
  visible?: boolean;
}

// ─── Login request ────────────────────────────────────────────────────────────
export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
  clinica_id?: number;
  rememberMe?: boolean;
}

// ─── Refresh token request (auth/models/dto.go) ───────────────────────────────
export interface RefreshTokenRequest {
  refresh_token: string;
  clinica_id?: number;
}

// ─── Change password request (auth/models/dto.go) ────────────────────────────
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'current_user',
  REMEMBER_ME: 'remember_me',
  CLINICA_ID: 'clinica_id',
  MENU: 'menu_items',
  ESTILO: 'estilo_clinica'
} as const;

// ─── Legacy / unused types kept for compile compat ────────────────────────────
export interface BackendLoginResponse extends LoginData {}
export interface BackendUser extends BackendUserResponse {}
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest { token: string; newPassword: string; confirmPassword: string; }
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}
