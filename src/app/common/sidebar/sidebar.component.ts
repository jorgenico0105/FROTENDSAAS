import { Component, OnInit, Renderer2 } from '@angular/core';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MenuItemResponse, EstiloClinica } from '../../core/models/auth.model';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [NgScrollbarModule, RouterLinkActive, RouterLink, NgClass],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
    menuItems: MenuItemResponse[] = [];
    estilo: EstiloClinica | null = null;
    expandedItems: Set<number> = new Set();

    constructor(
        private authService: AuthService,
        private router: Router,
        private renderer: Renderer2
    ) {}

    ngOnInit(): void {
        this.loadMenu();
    }

    loadMenu(): void {
        const stored = this.authService.getStoredMenu();
        if (stored && stored.length > 0) {
            this.menuItems = this.buildTree(stored);
        } else {
            this.menuItems = this.getDefaultMenu();
        }
        this.estilo = this.authService.getStoredEstilo();
        this.autoExpandForRoute(this.router.url);
    }

    closeSidebar(): void {
        this.renderer.removeClass(document.body, 'sidebar-hidden');
    }

    private buildTree(items: MenuItemResponse[]): MenuItemResponse[] {
        // Items already come as tree from backend (children populated)
        // If they come flat (padre_id based), build tree
        const hasChildren = items.some(i => i.children && i.children.length > 0);
        if (hasChildren) return items.filter(i => !i.padre_id);

        const map = new Map<number, MenuItemResponse>();
        const roots: MenuItemResponse[] = [];
        items.forEach(item => {
            map.set(item.id, { ...item, children: [] });
        });
        items.forEach(item => {
            const node = map.get(item.id)!;
            if (item.padre_id && map.has(item.padre_id)) {
                map.get(item.padre_id)!.children!.push(node);
            } else if (!item.padre_id) {
                roots.push(node);
            }
        });
        return roots.sort((a, b) => a.orden - b.orden);
    }

    toggleItem(id: number): void {
        if (this.expandedItems.has(id)) {
            this.expandedItems.delete(id);
        } else {
            this.expandedItems.add(id);
        }
    }

    isExpanded(id: number): boolean {
        return this.expandedItems.has(id);
    }

    hasChildren(item: MenuItemResponse): boolean {
        return !!(item.children && item.children.length > 0);
    }

    private autoExpandForRoute(url: string): void {
        const findAndExpand = (items: MenuItemResponse[]): boolean => {
            for (const item of items) {
                if (item.ruta && url.startsWith(item.ruta)) {
                    return true;
                }
                if (item.children?.length) {
                    if (findAndExpand(item.children)) {
                        this.expandedItems.add(item.id);
                        return true;
                    }
                }
            }
            return false;
        };
        findAndExpand(this.menuItems);
    }

    get logoUrl(): string | null {
        const raw = this.estilo?.url_archivo || this.estilo?.logo_path;
        if (!raw) return null;
        if (raw.startsWith('http')) return raw;
        // Strip /api/v1 from the API URL to get the backend host
        const host = environment.apiUrl.replace(/\/api\/v\d+$/, '');
        return `${host}/${raw}`;
    }

    logout(): void {
        this.authService.logout();
    }

    getIconClass(icono: string | undefined): string {
        if (!icono) return 'ri-menu-line';
        if (icono.startsWith('ri-')) return icono;
        return 'ri-' + icono;
    }

    // Default menu when backend is not available yet (fallback)
    private getDefaultMenu(): MenuItemResponse[] {
        return [
            {
                id: 1, nombre: 'Pacientes', orden: 1, tipo: 'MENU', visible: true,
                icono: 'ri-group-line', ruta: undefined,
                children: [
                    { id: 11, nombre: 'Lista de Pacientes', orden: 1, tipo: 'ITEM', visible: true, icono: 'ri-user-line', ruta: '/dashboard/pacientes' },
                ]
            },
            {
                id: 2, nombre: 'Nutrición', orden: 2, tipo: 'MENU', visible: true,
                icono: 'ri-restaurant-line', ruta: undefined,
                children: [
                    { id: 21, nombre: 'Dashboard', orden: 1, tipo: 'ITEM', visible: true, icono: 'ri-pie-chart-line', ruta: '/dashboard/nutricion' },
                    { id: 22, nombre: 'Pacientes', orden: 2, tipo: 'ITEM', visible: true, icono: 'ri-user-heart-line', ruta: '/dashboard/nutricion/pacientes' },
                    { id: 23, nombre: 'Alimentos', orden: 3, tipo: 'ITEM', visible: true, icono: 'ri-leaf-line', ruta: '/dashboard/nutricion/alimentos' },
                    { id: 24, nombre: 'Ejercicios', orden: 4, tipo: 'ITEM', visible: true, icono: 'ri-run-line', ruta: '/dashboard/nutricion/ejercicios' },
                ]
            },
            {
                id: 3, nombre: 'Historia Clínica', orden: 3, tipo: 'MENU', visible: true,
                icono: 'ri-file-list-3-line', ruta: undefined,
                children: [
                    { id: 31, nombre: 'Formularios', orden: 1, tipo: 'ITEM', visible: true, icono: 'ri-survey-line', ruta: '/dashboard/formularios' },
                    { id: 32, nombre: 'Recursos',    orden: 2, tipo: 'ITEM', visible: true, icono: 'ri-folder-2-line', ruta: '/dashboard/recursos' },
                ]
            },
            {
                id: 4, nombre: 'Administración', orden: 4, tipo: 'MENU', visible: true,
                icono: 'ri-settings-3-line', ruta: undefined,
                children: [
                    { id: 41, nombre: 'Clínicas', orden: 1, tipo: 'ITEM', visible: true, icono: 'ri-hospital-line', ruta: '/dashboard/admin/clinicas' },
                    { id: 42, nombre: 'Roles y Permisos', orden: 2, tipo: 'ITEM', visible: true, icono: 'ri-shield-user-line', ruta: '/dashboard/admin/roles' },
                    { id: 43, nombre: 'Profesiones', orden: 3, tipo: 'ITEM', visible: true, icono: 'ri-stethoscope-line', ruta: '/dashboard/admin/profesiones' },
                    { id: 44, nombre: 'Planes SaaS', orden: 4, tipo: 'ITEM', visible: true, icono: 'ri-price-tag-3-line', ruta: '/dashboard/admin/planes-saas' },
                ]
            },
            {
                id: 5, nombre: 'Mi Perfil', orden: 5, tipo: 'ITEM', visible: true,
                icono: 'ri-account-circle-line', ruta: '/dashboard/mi-perfil'
            },
        ];
    }
}
