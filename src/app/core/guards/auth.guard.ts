import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/models';

/**
 * authGuard — blocks unauthenticated users, redirects to login.
 * Usage: canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (authService.isLoggedIn()) return true;

  router.navigate(['/login']);
  return false;
};

/**
 * roleGuard — restricts route to specific roles.
 * Usage: canActivate: [roleGuard(['ADMIN', 'INVENTORY_MANAGER'])]
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router      = inject(Router);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    if (authService.hasAnyRole(...allowedRoles)) return true;

    // Logged in but wrong role — send to their dashboard
    router.navigate([authService.getDashboardRoute()]);
    return false;
  };
};
