import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutricionService } from '../../core/services/nutricion.service';
import { PacientesService } from '../../core/services/pacientes.service';
import { AuthService } from '../../core/services/auth.service';
import { NutricionArchivoPDF, NutricionTipoRecurso } from '../../core/models/nutricion.model';
import { Paciente } from '../../core/models/pacientes.model';

interface ArchivoUI extends NutricionArchivoPDF {
  pacienteNombre?: string;
}

const BADGE_PALETTE = [
  'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
  'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
  'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
  'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-400',
  'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
];

@Component({
  selector: 'app-recursos',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './recursos.component.html'
})
export class RecursosComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isLoading = false;
  isUploading = false;
  successMsg = '';
  errorMsg = '';

  archivos: ArchivoUI[] = [];
  pacientes: Paciente[] = [];
  tipoRecursos: NutricionTipoRecurso[] = [];

  // Filtros
  filtroTipoID = 0; // 0 = Todos
  search = '';
  viewMode: 'grid' | 'list' = 'grid';

  // Drag & drop
  isDragOver = false;

  // Upload form
  showUploadPanel = false;
  uploadFile: File | null = null;
  uploadPreview: string | null = null;
  uploadForm = {
    titulo: '',
    tipo_recurso_id: 0,
    descripcion: '',
    paciente_id: '' as string | number,
  };

  constructor(
    private nutricionSvc: NutricionService,
    private pacientesSvc: PacientesService,
    private authSvc: AuthService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  fileUrl(path?: string | null): string {
    return this.authSvc.fileUrl(path);
  }

  ngOnInit(): void {
    this.nutricionSvc.listTipoRecursos().subscribe({
      next: tipos => {
        this.tipoRecursos = tipos;
        if (tipos.length > 0 && !this.uploadForm.tipo_recurso_id) {
          this.uploadForm.tipo_recurso_id = tipos[0].id;
        }
      }
    });
    this.load();
    this.pacientesSvc.list().subscribe({ next: r => this.pacientes = r.data });
  }

  load(): void {
    this.isLoading = true;
    this.nutricionSvc.listArchivosPDF().subscribe({
      next: list => {
        this.archivos = list.map(a => ({
          ...a,
          pacienteNombre: a.paciente_id ? this.nombrePaciente(a.paciente_id) : undefined
        }));
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  // ── Drag & drop ──────────────────────────────────────────────────────────

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void { this.isDragOver = false; }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) this.prepareUpload(file);
  }

  triggerFileInput(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.prepareUpload(file);
  }

  private prepareUpload(file: File): void {
    this.uploadFile  = file;
    this.uploadForm.titulo = file.name.replace(/\.[^.]+$/, '');
    this.showUploadPanel = true;
    if (file.type.startsWith('image/') && isPlatformBrowser(this.platformId)) {
      const reader = new FileReader();
      reader.onload = e => { this.uploadPreview = e.target?.result as string; };
      reader.readAsDataURL(file);
    } else {
      this.uploadPreview = null;
    }
  }

  cancelUpload(): void {
    this.uploadFile      = null;
    this.uploadPreview   = null;
    this.showUploadPanel = false;
    this.uploadForm      = { titulo: '', tipo_recurso_id: this.tipoRecursos[0]?.id ?? 0, descripcion: '', paciente_id: '' };
    this.errorMsg        = '';
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  upload(): void {
    if (!this.uploadFile) return;
    if (!this.uploadForm.titulo.trim()) { this.errorMsg = 'El título es requerido.'; return; }
    if (!this.uploadForm.tipo_recurso_id) { this.errorMsg = 'Selecciona una categoría.'; return; }

    this.isUploading = true;
    this.errorMsg    = '';

    const fd = new FormData();
    fd.append('file',            this.uploadFile, this.uploadFile.name);
    fd.append('titulo',          this.uploadForm.titulo.trim());
    fd.append('tipo_recurso_id', String(this.uploadForm.tipo_recurso_id));
    if (this.uploadForm.descripcion) fd.append('descripcion', this.uploadForm.descripcion);
    if (this.uploadForm.paciente_id) fd.append('paciente_id', String(this.uploadForm.paciente_id));

    this.nutricionSvc.uploadArchivoPDF(fd).subscribe({
      next: archivo => {
        this.archivos.unshift({ ...archivo, pacienteNombre: archivo.paciente_id ? this.nombrePaciente(archivo.paciente_id) : undefined });
        this.cancelUpload();
        this.successMsg = 'Archivo subido correctamente.';
        this.isUploading = false;
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: err => {
        this.errorMsg    = err?.error?.message || 'Error al subir el archivo.';
        this.isUploading = false;
      }
    });
  }

  eliminar(archivo: ArchivoUI): void {
    if (!confirm(`¿Eliminar "${archivo.titulo}"?`)) return;
    this.nutricionSvc.deleteArchivoPDF(archivo.id).subscribe({
      next: () => {
        this.archivos = this.archivos.filter(a => a.id !== archivo.id);
        this.successMsg = 'Archivo eliminado.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.errorMsg = 'Error al eliminar el archivo.'; }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  get archivosFiltrados(): ArchivoUI[] {
    let list = this.archivos;
    if (this.filtroTipoID) list = list.filter(a => a.tipo_recurso_id === this.filtroTipoID);
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(a =>
        a.titulo.toLowerCase().includes(q) ||
        (a.descripcion ?? '').toLowerCase().includes(q) ||
        (a.pacienteNombre ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get fileIcon(): string {
    if (!this.uploadFile) return 'ri-file-line';
    const t = this.uploadFile.type;
    if (t === 'application/pdf') return 'ri-file-pdf-2-line';
    if (t.startsWith('image/')) return 'ri-image-line';
    if (t.includes('word')) return 'ri-file-word-line';
    if (t.includes('excel') || t.includes('spreadsheet')) return 'ri-file-excel-line';
    return 'ri-file-line';
  }

  get fileSize(): string {
    if (!this.uploadFile) return '';
    const bytes = this.uploadFile.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  tipoNombre(tipoRecursoID: number): string {
    return this.tipoRecursos.find(t => t.id === tipoRecursoID)?.nombre ?? 'Recurso';
  }

  archivoBadge(tipoRecursoID: number): string {
    const idx = this.tipoRecursos.findIndex(t => t.id === tipoRecursoID);
    return BADGE_PALETTE[idx >= 0 ? idx % BADGE_PALETTE.length : BADGE_PALETTE.length - 1];
  }

  private readonly BG_GRADIENTS = [
    'bg-gradient-to-br from-primary-100 to-primary-200/60 dark:from-primary-900/40 dark:to-primary-900/20',
    'bg-gradient-to-br from-warning-100 to-warning-200/60 dark:from-warning-900/40 dark:to-warning-900/20',
    'bg-gradient-to-br from-success-100 to-success-200/60 dark:from-success-900/40 dark:to-success-900/20',
    'bg-gradient-to-br from-secondary-100 to-secondary-200/60 dark:from-secondary-900/40 dark:to-secondary-900/20',
    'bg-gradient-to-br from-purple-100 to-purple-200/60 dark:from-purple-900/40 dark:to-purple-900/20',
    'bg-gradient-to-br from-gray-100 to-gray-200/60 dark:from-gray-800/60 dark:to-gray-800/30',
  ];

  private readonly ICON_COLORS = [
    'text-primary-400 dark:text-primary-500',
    'text-warning-400 dark:text-warning-500',
    'text-success-400 dark:text-success-500',
    'text-secondary-400 dark:text-secondary-500',
    'text-purple-400 dark:text-purple-500',
    'text-gray-300 dark:text-gray-600',
  ];

  private readonly BADGE_TEXTS = [
    'text-primary-700 dark:text-primary-300',
    'text-warning-700 dark:text-warning-300',
    'text-success-700 dark:text-success-300',
    'text-secondary-700 dark:text-secondary-300',
    'text-purple-700 dark:text-purple-300',
    'text-gray-600 dark:text-gray-400',
  ];

  archivoBgGradient(tipoRecursoID: number): string {
    const idx = this.tipoRecursos.findIndex(t => t.id === tipoRecursoID);
    return this.BG_GRADIENTS[idx >= 0 ? idx % this.BG_GRADIENTS.length : this.BG_GRADIENTS.length - 1];
  }

  archivoIconColor(tipoRecursoID: number): string {
    const idx = this.tipoRecursos.findIndex(t => t.id === tipoRecursoID);
    return this.ICON_COLORS[idx >= 0 ? idx % this.ICON_COLORS.length : this.ICON_COLORS.length - 1];
  }

  archivoBadgeText(tipoRecursoID: number): string {
    const idx = this.tipoRecursos.findIndex(t => t.id === tipoRecursoID);
    return this.BADGE_TEXTS[idx >= 0 ? idx % this.BADGE_TEXTS.length : this.BADGE_TEXTS.length - 1];
  }

  archivoIcon(tipoRecursoID: number): string {
    const nombre = (this.tipoRecursos.find(t => t.id === tipoRecursoID)?.nombre ?? '').toLowerCase();
    if (nombre.includes('men') || nombre.includes('dieta')) return 'ri-restaurant-line';
    if (nombre.includes('bio') || nombre.includes('peso')) return 'ri-scales-3-line';
    if (nombre.includes('diag')) return 'ri-stethoscope-line';
    if (nombre.includes('receta') || nombre.includes('medic')) return 'ri-medicine-bottle-line';
    return 'ri-file-line';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  nombrePaciente(id: number): string {
    const p = this.pacientes.find(x => x.id === id);
    return p ? `${p.nombres} ${p.apellidos}` : '';
  }

  countByTipoID(id: number): number {
    return this.archivos.filter(a => a.tipo_recurso_id === id).length;
  }
}
