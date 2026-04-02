import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { MenuItem, MenuSection, MenuState, STATIC_MENU_CONFIG } from '../models';

/**
 * Menu Service
 * Manages dynamic sidebar navigation based on user permissions
 */
@Injectable({
  providedIn: 'root'
})
export class MenuService {
  // Menu state as BehaviorSubject for reactivity
  private menuSectionsSubject = new BehaviorSubject<MenuSection[]>([]);
  private menuStateSubject = new BehaviorSubject<MenuState>({
    expandedItems: new Set<string>(),
    activeItem: null,
    activeSection: null
  });

  // Public observables
  public menuSections$ = this.menuSectionsSubject.asObservable();
  public menuState$ = this.menuStateSubject.asObservable();

  // Signals for Angular 17+ reactivity
  public menuSectionsSignal = signal<MenuSection[]>([]);
  public menuStateSignal = signal<MenuState>({
    expandedItems: new Set<string>(),
    activeItem: null,
    activeSection: null
  });

  constructor(private authService: AuthService) {
    // Load menu when service is initialized
    this.loadMenu();

    // Reload menu when user changes (login/logout)
    this.authService.currentUser$.subscribe(() => {
      this.loadMenu();
    });
  }

  /**
   * Load and filter menu based on user permissions
   */
  loadMenu(): void {
    // TODO: Descomentar cuando el backend devuelva el menú
    // this.api.get<MenuSection[]>('/api/menu').subscribe(
    //   sections => {
    //     const filtered = this.filterMenuByPermissions(sections);
    //     this.menuSectionsSubject.next(filtered);
    //     this.menuSectionsSignal.set(filtered);
    //   }
    // );

    // Por ahora, usar menú estático filtrado por permisos
    const filteredMenu = this.filterMenuByPermissions(STATIC_MENU_CONFIG);
    this.menuSectionsSubject.next(filteredMenu);
    this.menuSectionsSignal.set(filteredMenu);
  }

  /**
   * Filter menu sections and items based on user permissions
   */
  private filterMenuByPermissions(sections: MenuSection[]): MenuSection[] {
    const user = this.authService.getCurrentUser();

    // Si no hay usuario, no mostrar menú (o mostrar menú público)
    if (!user) {
      return [];
    }

    // Si el usuario tiene permiso wildcard (*), mostrar todo
    if (user.permissions.includes('*')) {
      return sections;
    }

    return sections
      .filter(section => this.hasAccessToSection(section))
      .map(section => ({
        ...section,
        items: this.filterMenuItems(section.items)
      }))
      .filter(section => section.items.length > 0);
  }

  /**
   * Check if user has access to a section
   */
  private hasAccessToSection(section: MenuSection): boolean {
    // If no permission required, allow access
    if (!section.permission && !section.roles) {
      return true;
    }

    // Check permission
    if (section.permission && !this.authService.hasPermission(section.permission)) {
      return false;
    }

    // Check roles
    if (section.roles && section.roles.length > 0) {
      return this.authService.hasAnyRole(section.roles);
    }

    return true;
  }

  /**
   * Filter menu items recursively based on permissions
   */
  private filterMenuItems(items: MenuItem[]): MenuItem[] {
    return items
      .filter(item => this.hasAccessToItem(item))
      .map(item => ({
        ...item,
        children: item.children ? this.filterMenuItems(item.children) : undefined
      }))
      .filter(item => {
        // Remove items that have no children (if they were supposed to have children)
        if (item.children !== undefined && item.children.length === 0) {
          return false;
        }
        return true;
      });
  }

  /**
   * Check if user has access to a menu item
   */
  private hasAccessToItem(item: MenuItem): boolean {
    // If item is hidden, don't show
    if (item.hidden) {
      return false;
    }

    // If no permission required, allow access
    if (!item.permission && !item.roles) {
      return true;
    }

    // Check permission
    if (item.permission && !this.authService.hasPermission(item.permission)) {
      return false;
    }

    // Check roles
    if (item.roles && item.roles.length > 0) {
      return this.authService.hasAnyRole(item.roles);
    }

    return true;
  }

  // ==================== MENU STATE MANAGEMENT ====================

  /**
   * Toggle menu item expanded state
   */
  toggleExpanded(itemId: string): void {
    const currentState = this.menuStateSubject.getValue();
    const expandedItems = new Set(currentState.expandedItems);

    if (expandedItems.has(itemId)) {
      expandedItems.delete(itemId);
    } else {
      expandedItems.add(itemId);
    }

    const newState: MenuState = {
      ...currentState,
      expandedItems
    };

    this.menuStateSubject.next(newState);
    this.menuStateSignal.set(newState);
  }

  /**
   * Check if menu item is expanded
   */
  isExpanded(itemId: string): boolean {
    return this.menuStateSubject.getValue().expandedItems.has(itemId);
  }

  /**
   * Set active menu item
   */
  setActiveItem(itemId: string, sectionId?: string): void {
    const currentState = this.menuStateSubject.getValue();

    const newState: MenuState = {
      ...currentState,
      activeItem: itemId,
      activeSection: sectionId ?? currentState.activeSection
    };

    this.menuStateSubject.next(newState);
    this.menuStateSignal.set(newState);
  }

  /**
   * Expand parent items for a given route
   */
  expandParentsForRoute(route: string): void {
    const sections = this.menuSectionsSubject.getValue();

    for (const section of sections) {
      for (const item of section.items) {
        if (this.expandIfContainsRoute(item, route)) {
          break;
        }
      }
    }
  }

  /**
   * Recursively expand items that contain the given route
   */
  private expandIfContainsRoute(item: MenuItem, route: string): boolean {
    if (item.route === route) {
      this.setActiveItem(item.id);
      return true;
    }

    if (item.children) {
      for (const child of item.children) {
        if (this.expandIfContainsRoute(child, route)) {
          this.toggleExpanded(item.id);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Collapse all menu items
   */
  collapseAll(): void {
    const currentState = this.menuStateSubject.getValue();

    const newState: MenuState = {
      ...currentState,
      expandedItems: new Set<string>()
    };

    this.menuStateSubject.next(newState);
    this.menuStateSignal.set(newState);
  }

  /**
   * Get menu sections synchronously
   */
  getMenuSections(): MenuSection[] {
    return this.menuSectionsSubject.getValue();
  }

  /**
   * Get flat list of all menu items
   */
  getAllItems(): MenuItem[] {
    const sections = this.menuSectionsSubject.getValue();
    const items: MenuItem[] = [];

    const collectItems = (menuItems: MenuItem[]) => {
      for (const item of menuItems) {
        items.push(item);
        if (item.children) {
          collectItems(item.children);
        }
      }
    };

    for (const section of sections) {
      collectItems(section.items);
    }

    return items;
  }

  /**
   * Find menu item by route
   */
  findItemByRoute(route: string): MenuItem | undefined {
    return this.getAllItems().find(item => item.route === route);
  }

  /**
   * Find menu item by ID
   */
  findItemById(id: string): MenuItem | undefined {
    return this.getAllItems().find(item => item.id === id);
  }
}
