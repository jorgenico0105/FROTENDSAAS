import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Clinica } from '../../core/models/auth.model';
import { FluidBgComponent } from '../fluid-bg/fluid-bg.component';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [RouterLink, FormsModule, FluidBgComponent],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {
  // Step: 'credentials' | 'selectClinic' | 'loading'
  step: 'credentials' | 'selectClinic' | 'loading' = 'credentials';

  username = '';
  password = '';
  isPasswordVisible = false;
  rememberMe = false;
  errorMessage = '';
  isLoading = false;

  // Clinic selection
  clinicas: Clinica[] = [];
  selectedClinicaId: number | null = null;

  // Partial response (from step1)
  private pendingCredentials: { username: string; password: string } | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard/nutricion']);
    }
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onSubmitCredentials(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor ingresa tu correo y contraseña';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.loginStep1(this.username, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.clinicas && response.clinicas.length > 1) {
          this.clinicas = response.clinicas;
          this.pendingCredentials = { username: this.username, password: this.password };
          this.step = 'selectClinic';
        } else if (response.clinicas && response.clinicas.length === 1) {
          this.loginWithClinica(response.clinicas[0].id);
        } else {
          // No clinics, login without clinica_id
          this.loginWithClinica(undefined);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = typeof err === 'string' ? err : 'Credenciales incorrectas';
      }
    });
  }

  onSelectClinica(clinicaId: number): void {
    this.selectedClinicaId = clinicaId;
    this.loginWithClinica(clinicaId);
  }

  private loginWithClinica(clinicaId: number | undefined): void {
    this.isLoading = true;
    const creds = this.pendingCredentials || { username: this.username, password: this.password };
    this.authService.login({
      username: creds.username,
      password: creds.password,
      clinica_id: clinicaId,
      rememberMe: this.rememberMe
    }).subscribe({
      next: () => {
        this.isLoading = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard/nutricion';
        this.router.navigate([returnUrl]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = typeof err === 'string' ? err : 'Error al iniciar sesión';
      }
    });
  }

  goBack(): void {
    this.step = 'credentials';
    this.errorMessage = '';
    this.clinicas = [];
    this.selectedClinicaId = null;
    this.pendingCredentials = null;
  }
}
