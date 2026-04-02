import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role Guard
 * Protects routes based on user roles
 * Usage: canActivate: [roleGuard], data: { roles: ['admin', 'manager'] }
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check if authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/authentication'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as string[] | undefined;

  // If no roles specified, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Check if user has any of the required roles
  const hasRole = authService.hasAnyRole(requiredRoles);

  if (!hasRole) {
    // User doesn't have required role, redirect to unauthorized page or dashboard
    console.warn(`Access denied: User lacks required roles [${requiredRoles.join(', ')}]`);
    router.navigate(['/dashboard'], {
      queryParams: { error: 'unauthorized' }
    });
    return false;
  }

  return true;
};

/**
 * Permission Guard
 * Protects routes based on user permissions
 * Usage: canActivate: [permissionGuard], data: { permissions: ['users.create', 'users.edit'] }
 */
export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check if authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/authentication'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Get required permissions from route data
  const requiredPermissions = route.data['permissions'] as string[] | undefined;
  const requireAll = route.data['requireAllPermissions'] as boolean | undefined;

  // If no permissions specified, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // Check permissions
  let hasPermission: boolean;
  if (requireAll) {
    hasPermission = authService.hasAllPermissions(requiredPermissions);
  } else {
    hasPermission = authService.hasAnyPermission(requiredPermissions);
  }

  if (!hasPermission) {
    // User doesn't have required permission
    console.warn(`Access denied: User lacks required permissions [${requiredPermissions.join(', ')}]`);
    router.navigate(['/dashboard'], {
      queryParams: { error: 'forbidden' }
    });
    return false;
  }

  return true;
};
