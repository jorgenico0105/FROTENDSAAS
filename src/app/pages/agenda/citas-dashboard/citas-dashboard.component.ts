import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { AgendaService } from '../../../core/services/agenda.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cita, TipoCita, Sesion, UpdateEstadoRequest } from '../../../core/models/agenda.model';

import { CitasListaComponent }      from './components/citas-lista/citas-lista.component';
import { CitasCalendarioComponent } from './components/citas-calendario/citas-calendario.component';
import { CitaSesionComponent }      from './components/cita-sesion/cita-sesion.component';
import { NuevaCitaModalComponent }  from './components/nueva-cita-modal/nueva-cita-modal.component';
import { SkeletonComponent } from '../../../common/skeleton/skeleton.component';

type Vista = 'lista' | 'calendario' | 'sesion';

@Component({
  selector: 'app-citas-dashboard',
  standalone: true,
  imports: [NgClass, CitasListaComponent, CitasCalendarioComponent, CitaSesionComponent, NuevaCitaModalComponent, SkeletonComponent],
  templateUrl: './citas-dashboard.component.html'
})
export class CitasDashboardComponent implements OnInit {

  vista: Vista = 'lista';
  successMsg   = '';
  errorMsg     = '';

  medicoId  = 0;
  clinicaId = 0;

  // Lista
  citas: Cita[]  = [];
  isLoading      = false;
  totalItems     = 0;
  statHoy        = 0;
  statPendientes = 0;
  statConfirmadas = 0;
  statAtendidas  = 0;

  // Sesión
  sesionCita: Cita | null = null;
  sesionActiva: Sesion | null = null;
  isSesionLoading = false;

  // Modal nueva cita
  isNuevaCitaOpen = false;
  initialFecha    = '';
  tiposCita: TipoCita[] = [];

  private readonly SESSION_KEY = 'saas_sesion_cita_id';

  constructor(
    private agendaSvc: AgendaService,
    private authSvc: AuthService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    const user      = this.authSvc.getCurrentUser();
    this.medicoId   = user?.id ?? 0;
    this.clinicaId  = this.authSvc.getClinicaId() ?? 0;
    this.load();
    this.agendaSvc.listTiposCita().subscribe({ next: t => this.tiposCita = t });
  }

  // ── Lista ───────────────────────────────────────────────────────────────────

  // Carga todas las citas sin filtro de fecha — el filtrado es client-side en CitasListaComponent
  load(): void {
    this.isLoading = true;
    const p: { medico_id?: number; clinica_id?: number; size: number } = { size: 500 };
    if (this.medicoId)  p.medico_id  = this.medicoId;
    if (this.clinicaId) p.clinica_id = this.clinicaId;

    this.agendaSvc.listCitas(p).subscribe({
      next: res => {
        this.citas      = res.data;
        this.totalItems = res.total_items;
        this.recalcStats(res.data);
        this.isLoading  = false;
        this.tryRestoreSesion();
      },
      error: () => { this.isLoading = false; }
    });
  }

  onConfirmar(cita: Cita): void    { this.cambiarEstado(cita, 'CF'); }
  onCancelar(cita: Cita): void {
    if (!confirm('¿Cancelar esta cita?')) return;
    this.cambiarEstado(cita, 'CA');
  }
  onEliminar(cita: Cita): void {
    if (!confirm('¿Eliminar esta cita permanentemente?')) return;
    this.agendaSvc.deleteCita(cita.id).subscribe({
      next: () => { this.citas = this.citas.filter(c => c.id !== cita.id); this.recalcStats(this.citas); },
      error: () => { this.errorMsg = 'Error al eliminar la cita'; }
    });
  }

  onIniciarSesion(cita: Cita): void {
    this.isSesionLoading = true;
    const now = new Date().toISOString();
    this.agendaSvc.createSesion(cita.id, { inicio: now }).subscribe({
      next: (sesion) => {
        this.sesionActiva = sesion;
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem(this.SESSION_KEY, String(cita.id));
        }
        this.sesionCita   = cita;
        this.vista        = 'sesion';
        this.isSesionLoading = false;
      },
      error: () => {
        // Si ya existe sesión activa u otro error no-fatal, abrir igual
        this.sesionActiva = null;
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem(this.SESSION_KEY, String(cita.id));
        }
        this.sesionCita   = cita;
        this.vista        = 'sesion';
        this.isSesionLoading = false;
      }
    });
  }

  // ── Sesión ──────────────────────────────────────────────────────────────────

  onSesionCompletada(updated: Cita): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.SESSION_KEY);
    }
    const idx = this.citas.findIndex(c => c.id === updated.id);
    if (idx >= 0) this.citas[idx] = updated;
    this.recalcStats(this.citas);
    this.sesionCita = null;
    this.vista = 'lista';
    this.successMsg = 'Sesión completada. Cita marcada como atendida.';
    setTimeout(() => this.successMsg = '', 5000);
    this.load();
  }

  onCitaActualizada(updated: Cita): void {
    const idx = this.citas.findIndex(c => c.id === updated.id);
    if (idx >= 0) this.citas[idx] = updated;
  }

  // ── Modal nueva cita ────────────────────────────────────────────────────────

  abrirNuevaCita(fecha = ''): void {
    this.initialFecha   = fecha;
    this.isNuevaCitaOpen = true;
  }

  onCitaCreada(_cita: Cita): void {
    this.isNuevaCitaOpen = false;
    this.successMsg = 'Cita creada exitosamente';
    setTimeout(() => this.successMsg = '', 4000);
    this.load(); // recarga desde el backend para obtener paciente con preload
  }

  // ── Calendario ──────────────────────────────────────────────────────────────

  setVista(v: Vista): void {
    this.vista = v;
    if (v !== 'sesion' && isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.SESSION_KEY);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private tryRestoreSesion(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = sessionStorage.getItem(this.SESSION_KEY);
    if (!raw) return;
    const id = parseInt(raw, 10);
    const cita = this.citas.find(c => c.id === id);
    if (cita) {
      this.sesionCita = cita;
      this.vista = 'sesion';
    } else {
      sessionStorage.removeItem(this.SESSION_KEY);
    }
  }

  private cambiarEstado(cita: Cita, codigo: UpdateEstadoRequest['estado_codigo']): void {
    this.agendaSvc.updateEstado(cita.id, { estado_codigo: codigo }).subscribe({
      next: updated => {
        const idx = this.citas.findIndex(c => c.id === cita.id);
        if (idx >= 0) this.citas[idx] = updated;
        this.recalcStats(this.citas);
        this.successMsg = 'Estado actualizado';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.errorMsg = 'Error al actualizar estado'; }
    });
  }

  private recalcStats(citas: Cita[]): void {
    const hoy = this.todayStr();
    this.statHoy         = citas.filter(c => c.fecha.startsWith(hoy)).length;
    this.statPendientes  = citas.filter(c => c.estado_cita?.codigo === 'PE').length;
    this.statConfirmadas = citas.filter(c => c.estado_cita?.codigo === 'CF').length;
    this.statAtendidas   = citas.filter(c => c.estado_cita?.codigo === 'AT').length;
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}
