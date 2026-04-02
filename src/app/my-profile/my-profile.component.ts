import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/services/auth.service';
import { environment } from '../../environments/environment';
import { BackendUserResponse, ApiWrapper } from '../core/models/auth.model';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  profile: BackendUserResponse | null = null;
  isLoading = false;
  isSaving = false;
  isUploadingPhoto = false;
  isChangingPassword = false;

  successMsg = '';
  errorMsg = '';
  pwSuccessMsg = '';
  pwErrorMsg = '';

  // Editable form fields
  form = {
    nombre: '',
    apellidos: '',
    celular: ''
  };

  // Password change
  pwForm = {
    current_password: '',
    new_password: '',
    confirm_password: ''
  };

  showCurrentPw = false;
  showNewPw = false;
  showConfirmPw = false;

  constructor(
    private authSvc: AuthService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.http.get<ApiWrapper<BackendUserResponse>>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        this.profile = { ...res.data, foto: this.authSvc.fileUrl(res.data.foto) };
        this.form = {
          nombre: res.data.nombre,
          apellidos: res.data.apellidos,
          celular: res.data.celular ?? ''
        };
        this.isLoading = false;
      },
      error: () => {
        // Fallback to stored user
        const storedUser = this.authSvc.getCurrentUser();
        if (storedUser) {
          this.profile = {
            id: storedUser.id,
            nombre: storedUser.firstName,
            apellidos: storedUser.lastName,
            email: storedUser.email,
            foto: storedUser.avatar,
            state: 'A',
            rol: storedUser.rolName ?? '',
            created_at: ''
          };
          this.form = {
            nombre: storedUser.firstName,
            apellidos: storedUser.lastName,
            celular: ''
          };
        }
        this.isLoading = false;
      }
    });
  }

  saveProfile(): void {
    this.isSaving = true;
    this.errorMsg = '';
    this.successMsg = '';
    this.http.put<ApiWrapper<BackendUserResponse>>(`${environment.apiUrl}/auth/me`, this.form).subscribe({
      next: (res) => {
        this.profile = res.data;
        this.isSaving = false;
        this.successMsg = 'Perfil actualizado correctamente.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al guardar el perfil.';
        this.isSaving = false;
      }
    });
  }

  triggerFileInput(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('foto', file);
    this.isUploadingPhoto = true;
    this.errorMsg = '';
    this.http.post<ApiWrapper<BackendUserResponse>>(`${environment.apiUrl}/auth/me/foto`, formData).subscribe({
      next: (res) => {
        if (this.profile) {
          this.profile = { ...this.profile, foto: this.authSvc.fileUrl(res.data.foto) };
        }
        this.isUploadingPhoto = false;
        this.successMsg = 'Foto actualizada correctamente.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al subir la foto.';
        this.isUploadingPhoto = false;
      }
    });
  }

  changePassword(): void {
    this.pwErrorMsg = '';
    this.pwSuccessMsg = '';
    if (this.pwForm.new_password !== this.pwForm.confirm_password) {
      this.pwErrorMsg = 'Las contraseñas nuevas no coinciden.';
      return;
    }
    if (this.pwForm.new_password.length < 6) {
      this.pwErrorMsg = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    this.isChangingPassword = true;
    this.authSvc.changePassword({
      current_password: this.pwForm.current_password,
      new_password: this.pwForm.new_password
    }).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.pwSuccessMsg = 'Contraseña actualizada correctamente.';
        this.pwForm = { current_password: '', new_password: '', confirm_password: '' };
        setTimeout(() => this.pwSuccessMsg = '', 4000);
      },
      error: (err) => {
        this.pwErrorMsg = err?.error?.message || 'Error al cambiar la contraseña.';
        this.isChangingPassword = false;
      }
    });
  }

  get initials(): string {
    if (!this.profile) return 'U';
    return `${this.profile.nombre.charAt(0)}${this.profile.apellidos?.charAt(0) ?? ''}`.toUpperCase();
  }
}
