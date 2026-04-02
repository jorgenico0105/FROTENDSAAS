import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard
 * Protects routes that require authentication
 * Redirects to login page if user is not authenticated
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Check if token is about to expire and refresh if needed
    if (authService.isTokenExpired()) {
      // Token is expired or about to expire, try to refresh
      authService.refreshToken().subscribe({
        error: () => {
          // Refresh failed, redirect to login
          router.navigate(['/authentication'], {
            queryParams: { returnUrl: state.url }
          });
        }
      });
    }
    return true;
  }

  // Not authenticated, redirect to login
  router.navigate(['/authentication'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

/**
 * Guest Guard
 * Prevents authenticated users from accessing login/register pages
 * Redirects to dashboard if user is already authenticated
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Already authenticated, redirect to dashboard
  router.navigate(['/dashboard']);
  return false;
};
