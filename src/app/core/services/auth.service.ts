import { Injectable, Inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StorageService, StorageType } from './storage.service';
import {
  LoginRequest,
  BackendUserResponse,
  LoginData,
  ApiWrapper,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  TokenPayload,
  AUTH_STORAGE_KEYS,
  MenuItemResponse,
  EstiloClinica
} from '../models/auth.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly isBrowser: boolean;
  private readonly apiUrl: string;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private isLoadingSubject = new BehaviorSubject<boolean>(true);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();

  public currentUserSignal = signal<User | null>(null);
  public isAuthenticatedSignal = computed(() => this.currentUserSignal() !== null);

  private rememberMe = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private http: HttpClient,
    private router: Router,
    private storage: StorageService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.apiUrl = environment.apiUrl;
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    if (!this.isBrowser) {
      this.isLoadingSubject.next(false);
      return;
    }
    this.rememberMe = this.storage.get<boolean>(AUTH_STORAGE_KEYS.REMEMBER_ME, 'local') ?? false;
    const user = this.getStoredUser();
    const token = this.getAccessToken();
    if (user && token && !this.isTokenExpired()) {
      this.setCurrentUser(user);
      this.isAuthenticatedSubject.next(true);
      // Re-apply clinic styles on every page reload
      const estilo = this.getStoredEstilo();
      if (estilo) this.applyClinicStyles(estilo);
    } else {
      this.clearAuthData();
    }
    this.isLoadingSubject.next(false);
  }

  // Step 1: Login without clinica_id → returns list of clinics user belongs to
  loginStep1(username: string, password: string): Observable<LoginData> {
    return this.http.post<ApiWrapper<LoginData>>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
      map(res => res.data)
    );
  }

  // Step 2: Full login with clinica_id selected
  login(credentials: LoginRequest): Observable<User> {
    this.rememberMe = credentials.rememberMe ?? false;
    return this.http.post<ApiWrapper<LoginData>>(`${this.apiUrl}/auth/login`, {
      email: credentials.email,
      username: credentials.username,
      password: credentials.password,
      clinica_id: credentials.clinica_id
    }).pipe(
      switchMap(response => {
        const data = response.data;
        const token = data.access_token;
        const refreshToken = data.refresh_token;
        this.setAccessToken(token);
        this.setRefreshToken(refreshToken);
        if (credentials.clinica_id) {
          this.storage.set(AUTH_STORAGE_KEYS.CLINICA_ID, credentials.clinica_id, this.getStorageType());
        }
        if (this.rememberMe) {
          this.storage.set(AUTH_STORAGE_KEYS.REMEMBER_ME, true, 'local');
        }
        const payload = this.decodeToken(token);
        const user = this.mapBackendUser(data.user, payload);
        this.setCurrentUser(user);
        this.isAuthenticatedSubject.next(true);

        // Estilo ya viene en el login response — extraerlo de la clínica seleccionada
        const clinica = data.clinicas?.find(c => c.id === credentials.clinica_id) ?? data.clinicas?.[0];
        const estiloFromLogin = clinica?.Estilo;
        if (estiloFromLogin) {
          this.storage.set(AUTH_STORAGE_KEYS.ESTILO, estiloFromLogin, this.getStorageType());
          this.applyClinicStyles(estiloFromLogin);
        }

        // Solo cargar el menú (estilos ya disponibles)
        return this.http.get<ApiWrapper<MenuItemResponse[]>>(`${this.apiUrl}/auth/permisosMenusPaleta`).pipe(
          catchError(() => of({ success: false, data: [] as MenuItemResponse[] })),
          tap(menu => {
            if (menu.data) this.storage.set(AUTH_STORAGE_KEYS.MENU, menu.data, this.getStorageType());
          }),
          map(() => user)
        );
      }),
      catchError(err => throwError(() => this.extractError(err)))
    );
  }

  logout(): void {
    const token = this.getAccessToken();
    if (token) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(catchError(() => of(null))).subscribe();
    }
    this.clearAuthData();
    this.router.navigate(['/authentication']);
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshTk = this.getRefreshToken();
    if (!refreshTk) return throwError(() => new Error('No refresh token available'));
    const clinicaId = this.storage.get<number>(AUTH_STORAGE_KEYS.CLINICA_ID, this.getStorageType());
    return this.http.post<ApiWrapper<{access_token: string; refresh_token: string; expires_in: number}>>(
      `${this.apiUrl}/auth/refresh`,
      { refresh_token: refreshTk, clinica_id: clinicaId }
    ).pipe(
      tap(response => {
        this.setAccessToken(response.data.access_token);
        this.setRefreshToken(response.data.refresh_token);
      }),
      map(r => ({ accessToken: r.data.access_token, refreshToken: r.data.refresh_token, expiresIn: r.data.expires_in })),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  loadMenuAndStyles(): Observable<{menu: MenuItemResponse[], estilo: EstiloClinica | null}> {
    const estilo = this.getStoredEstilo();
    if (estilo) this.applyClinicStyles(estilo);
    return this.http.get<ApiWrapper<MenuItemResponse[]>>(`${this.apiUrl}/auth/permisosMenusPaleta`).pipe(
      catchError(() => of({ success: false, data: [] as MenuItemResponse[] })),
      tap(menu => {
        if (menu.data) this.storage.set(AUTH_STORAGE_KEYS.MENU, menu.data, this.getStorageType());
      }),
      map(menu => ({ menu: menu.data || [], estilo }))
    );
  }

  getStoredMenu(): MenuItemResponse[] {
    const storageType = this.getStorageType();
    return this.storage.get<MenuItemResponse[]>(AUTH_STORAGE_KEYS.MENU, storageType) || [];
  }

  getStoredEstilo(): EstiloClinica | null {
    const storageType = this.getStorageType();
    return this.storage.get<EstiloClinica>(AUTH_STORAGE_KEYS.ESTILO, storageType);
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{message: string}>(`${this.apiUrl}/auth/forgot-password`, data).pipe(
      catchError(() => of({ message: 'Si el correo existe, recibirás instrucciones.' }))
    );
  }

  resetPassword(data: ResetPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{message: string}>(`${this.apiUrl}/auth/reset-password`, data).pipe(
      catchError(err => throwError(() => this.extractError(err)))
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.post<{message: string}>(`${this.apiUrl}/auth/change-password`, data).pipe(
      catchError(err => throwError(() => this.extractError(err)))
    );
  }

  getCurrentUser(): User | null { return this.currentUserSubject.getValue(); }
  getAccessToken(): string | null { return this.storage.getString(AUTH_STORAGE_KEYS.ACCESS_TOKEN, this.getStorageType()); }
  getRefreshToken(): string | null { return this.storage.getString(AUTH_STORAGE_KEYS.REFRESH_TOKEN, this.getStorageType()); }
  getClinicaId(): number | null { return this.storage.get<number>(AUTH_STORAGE_KEYS.CLINICA_ID, this.getStorageType()); }
  private getStoredUser(): User | null { return this.storage.get<User>(AUTH_STORAGE_KEYS.USER, this.getStorageType()); }
  isAuthenticated(): boolean { return this.isAuthenticatedSubject.getValue(); }

  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    try {
      const payload = this.decodeToken(token);
      if (!payload?.exp) return true;
      return new Date(payload.exp * 1000).getTime() - Date.now() < 60000;
    } catch { return true; }
  }

  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
    this.storage.set(AUTH_STORAGE_KEYS.USER, user, this.getStorageType());
  }

  private setAccessToken(token: string): void {
    this.storage.setString(AUTH_STORAGE_KEYS.ACCESS_TOKEN, token, this.getStorageType());
  }

  private setRefreshToken(token: string): void {
    this.storage.setString(AUTH_STORAGE_KEYS.REFRESH_TOKEN, token, this.getStorageType());
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean { return permissions.some(p => this.hasPermission(p)); }
  hasAllPermissions(permissions: string[]): boolean { return permissions.every(p => this.hasPermission(p)); }
  hasRole(role: string): boolean { return this.getCurrentUser()?.roles.some(r => r.name === role) ?? false; }
  hasAnyRole(roles: string[]): boolean { return roles.some(role => this.hasRole(role)); }

  private getStorageType(): StorageType { return this.rememberMe ? 'local' : 'session'; }

  private clearAuthData(): void {
    Object.values(AUTH_STORAGE_KEYS).forEach(key => {
      this.storage.removeFromBoth(key);
    });
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);
    this.isAuthenticatedSubject.next(false);
    this.rememberMe = false;
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(jsonPayload);
    } catch { return null; }
  }

  /** Converts a relative storage path to the full backend URL */
  fileUrl(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const serverRoot = this.apiUrl.replace('/api/v1', '');
    return `${serverRoot}/${path.replace(/^\//, '')}`;
  }

  private mapBackendUser(backendUser: BackendUserResponse, payload?: TokenPayload | null): User {
    const rolId = payload?.rol_id;
    const clinicaId = payload?.clinica_id;
    return {
      id: backendUser.id,
      email: backendUser.email,
      firstName: backendUser.nombre,
      lastName: backendUser.apellidos,
      avatar: this.fileUrl(backendUser.foto),
      roles: [{ id: rolId ?? 0, name: backendUser.rol, permissions: [] }],
      permissions: [],
      isActive: true,
      clinicaId: clinicaId,
      rolId: rolId,
      rolName: backendUser.rol
    };
  }

  private applyClinicStyles(estilo: EstiloClinica): void {
    if (!this.isBrowser) return;
    const root = document.documentElement;

    // ── Brand color ramps ────────────────────────────────────────────────────
    if (estilo.primary_color)   this.applyRamp(root, 'primary',   estilo.primary_color);
    if (estilo.secondary_color) this.applyRamp(root, 'secondary', estilo.secondary_color);
    if (estilo.third_color)     this.applyRamp(root, 'purple',    estilo.third_color);

    // ── Ramp shade overrides (specific intermediate shade) ───────────────────
    if (estilo.primary_ramp)   root.style.setProperty('--color-primary-400',   estilo.primary_ramp);
    if (estilo.secondary_ramp) root.style.setProperty('--color-secondary-400', estilo.secondary_ramp);
    if (estilo.tertiary_ramp)  root.style.setProperty('--color-purple-400',    estilo.tertiary_ramp);

    // ── Semantic colors ──────────────────────────────────────────────────────
    if (estilo.error_color) this.applyRamp(root, 'danger', estilo.error_color);

    // ── Surface stack ────────────────────────────────────────────────────────
    if (estilo.surface_1) root.style.setProperty('--color-surface-1', estilo.surface_1);
    if (estilo.surface_2) root.style.setProperty('--color-surface-2', estilo.surface_2);
    if (estilo.surface_3) root.style.setProperty('--color-surface-3', estilo.surface_3);
    if (estilo.surface_4) root.style.setProperty('--color-surface-4', estilo.surface_4);
    if (estilo.surface_5) root.style.setProperty('--color-surface-5', estilo.surface_5);

    // ── Text tokens ──────────────────────────────────────────────────────────
    if (estilo.text_high)  root.style.setProperty('--color-text-high',  estilo.text_high);
    if (estilo.text_muted) root.style.setProperty('--color-text-muted', estilo.text_muted);
    if (estilo.text_hint)  root.style.setProperty('--color-text-hint',  estilo.text_hint);

    // ── Misc tokens ──────────────────────────────────────────────────────────
    if (estilo.chip_color)     root.style.setProperty('--color-chip',         estilo.chip_color);
    if (estilo.ghost_border)   root.style.setProperty('--color-ghost-border', estilo.ghost_border);
    if (estilo.ambient_shadow) root.style.setProperty('--shadow-3xl',         estilo.ambient_shadow);

    // ── Dark mode ────────────────────────────────────────────────────────────
    if (estilo.dark_mode !== undefined) {
      root.classList.toggle('dark', estilo.dark_mode);
    }
  }

  // Generates the full 50–900 ramp for a color scale name from a single base hex
  private applyRamp(root: HTMLElement, scale: string, base: string): void {
    const ramp = this.generateRamp(base);
    Object.entries(ramp).forEach(([level, hex]) => {
      root.style.setProperty(`--color-${scale}-${level}`, hex);
    });
  }

  private generateRamp(base: string): Record<string, string> {
    const white: [number, number, number] = [255, 255, 255];
    const black: [number, number, number] = [0, 0, 0];
    return {
      '50':  this.mixColor(base, white, 0.95),
      '100': this.mixColor(base, white, 0.88),
      '200': this.mixColor(base, white, 0.75),
      '300': this.mixColor(base, white, 0.55),
      '400': this.mixColor(base, white, 0.25),
      '500': base,
      '600': this.mixColor(base, black, 0.15),
      '700': this.mixColor(base, black, 0.30),
      '800': this.mixColor(base, black, 0.45),
      '900': this.mixColor(base, black, 0.60),
    };
  }

  private mixColor(hex: string, with_: [number, number, number], amount: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.round(rgb[0] + (with_[0] - rgb[0]) * amount);
    const g = Math.round(rgb[1] + (with_[1] - rgb[1]) * amount);
    const b = Math.round(rgb[2] + (with_[2] - rgb[2]) * amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): [number, number, number] | null {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
  }

  private extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const error = (err as {error: {message?: string; error?: string}}).error;
      return error.message || error.error || 'Error desconocido';
    }
    return 'Error de conexión con el servidor';
  }
}
