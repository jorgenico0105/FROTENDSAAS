import { Routes } from '@angular/router';
import { AuthenticationComponent } from './authentication/authentication.component';
import { SignInComponent } from './authentication/sign-in/sign-in.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { SettingsComponent } from './settings/settings.component';
import { AccountSettingsComponent } from './settings/account-settings/account-settings.component';
import { ChangePasswordComponent } from './settings/change-password/change-password.component';
import { IconsComponent } from './icons/icons.component';
import { MaterialSymbolsComponent } from './icons/material-symbols/material-symbols.component';
import { RemixiconComponent } from './icons/remixicon/remixicon.component';
import { UiElementsComponent } from './ui-elements/ui-elements.component';
import { AlertsComponent } from './ui-elements/alerts/alerts.component';
import { AvatarsComponent } from './ui-elements/avatars/avatars.component';
import { AccordionComponent } from './ui-elements/accordion/accordion.component';
import { BadgesComponent } from './ui-elements/badges/badges.component';
import { ButtonsComponent } from './ui-elements/buttons/buttons.component';
import { BreadcrumbComponent } from './ui-elements/breadcrumb/breadcrumb.component';
import { DropdownsComponent } from './ui-elements/dropdowns/dropdowns.component';
import { ModalComponent } from './ui-elements/modal/modal.component';
import { PaginationComponent } from './ui-elements/pagination/pagination.component';
import { TabsComponent } from './ui-elements/tabs/tabs.component';
import { ProgressComponent } from './ui-elements/progress/progress.component';
import { TypographyComponent } from './ui-elements/typography/typography.component';

// SaasMedico feature pages
import { ClinicasComponent } from './pages/admin/clinicas/clinicas.component';
import { RolesComponent } from './pages/admin/roles/roles.component';
import { ProfesionesComponent } from './pages/admin/profesiones/profesiones.component';
import { PlanesSaasComponent } from './pages/admin/planes-saas/planes-saas.component';
import { NutricionDashboardComponent } from './pages/nutricion/nutricion-dashboard/nutricion-dashboard.component';
import { PacientesNutricionComponent } from './pages/nutricion/pacientes-nutricion/pacientes-nutricion.component';
import { DetallePacienteNutricionComponent } from './pages/nutricion/detalle-paciente-nutricion/detalle-paciente-nutricion.component';
import { MenuBuilderComponent } from './pages/nutricion/menu-builder/menu-builder.component';
import { AlimentosComponent } from './pages/nutricion/alimentos/alimentos.component';
import { EjerciciosCatalogoComponent } from './pages/nutricion/ejercicios-catalogo/ejercicios-catalogo.component';
import { PacientesListaComponent } from './pages/pacientes/pacientes-lista/pacientes-lista.component';
import { PacienteDetalleComponent } from './pages/pacientes/paciente-detalle/paciente-detalle.component';
import { CitasDashboardComponent } from './pages/agenda/citas-dashboard/citas-dashboard.component';
import { FormulariosComponent } from './pages/formularios/formularios.component';
import { DietasComponent } from './pages/nutricion/dietas/dietas.component';
import { DetalleDietaComponent } from './pages/nutricion/detalle-dieta/detalle-dieta.component';
import { RegistrosDashboardComponent } from './pages/nutricion/registros-dashboard/registros-dashboard.component';
import { RecursosComponent } from './pages/recursos/recursos.component';
import { AccesosComponent } from './pages/accesos/accesos.component';

export const routes: Routes = [
    {
        path: 'authentication',
        component: AuthenticationComponent,
        children: [
            { path: '', component: SignInComponent }
        ]
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        children: [
            // Default redirect
            { path: '', redirectTo: 'nutricion', pathMatch: 'full' },

            // Agenda / Citas
            { path: 'citas', component: CitasDashboardComponent },

            // Pacientes
            { path: 'pacientes', component: PacientesListaComponent },
            { path: 'pacientes/:id', component: PacienteDetalleComponent },

            // Nutrición
            { path: 'nutricion', component: NutricionDashboardComponent },
            { path: 'nutricion/pacientes', component: PacientesNutricionComponent },
            { path: 'nutricion/pacientes/:pacienteId', component: DetallePacienteNutricionComponent },
            { path: 'nutricion/pacientes/:pacienteId/menu-builder/:dietaId', component: MenuBuilderComponent },
            { path: 'nutricion/alimentos', component: AlimentosComponent },
            { path: 'nutricion/ejercicios', component: EjerciciosCatalogoComponent },
            { path: 'nutricion/dietas', component: DietasComponent },
            { path: 'nutricion/dietas/:pacienteId/:dietaId', component: DetalleDietaComponent },
            { path: 'nutricion/registros', component: RegistrosDashboardComponent },

            // Recursos (archivos PDF / documentos)
            { path: 'recursos', component: RecursosComponent },

            // Accesos a apps móviles
            { path: 'accesos', component: AccesosComponent },

            // Formularios clínicos
            { path: 'formularios', component: FormulariosComponent },

            // Administración
            { path: 'admin/clinicas', component: ClinicasComponent },
            { path: 'admin/roles', component: RolesComponent },
            { path: 'admin/profesiones', component: ProfesionesComponent },
            { path: 'admin/planes-saas', component: PlanesSaasComponent },

            // Mi perfil y configuración
            { path: 'mi-perfil', component: MyProfileComponent },
            {
                path: 'settings',
                component: SettingsComponent,
                children: [
                    { path: '', component: AccountSettingsComponent },
                    { path: 'change-password', component: ChangePasswordComponent }
                ]
            },

            // UI Kit (reference - keep for development)
            {
                path: 'ui-kit',
                component: UiElementsComponent,
                children: [
                    { path: '', component: AlertsComponent },
                    { path: 'avatars', component: AvatarsComponent },
                    { path: 'accordion', component: AccordionComponent },
                    { path: 'badges', component: BadgesComponent },
                    { path: 'buttons', component: ButtonsComponent },
                    { path: 'breadcrumb', component: BreadcrumbComponent },
                    { path: 'dropdowns', component: DropdownsComponent },
                    { path: 'modal', component: ModalComponent },
                    { path: 'pagination', component: PaginationComponent },
                    { path: 'tabs', component: TabsComponent },
                    { path: 'progress', component: ProgressComponent },
                    { path: 'typography', component: TypographyComponent }
                ]
            },
            {
                path: 'icons',
                component: IconsComponent,
                children: [
                    { path: '', component: MaterialSymbolsComponent },
                    { path: 'remixicon', component: RemixiconComponent }
                ]
            }
        ]
    },
    { path: '', redirectTo: '/authentication', pathMatch: 'full' },
    { path: '**', redirectTo: '/dashboard/citas' }
];
