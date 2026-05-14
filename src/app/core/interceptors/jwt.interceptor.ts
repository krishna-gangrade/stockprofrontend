import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * JWT Interceptor (functional style — Angular 17+)
 *
 * Runs on EVERY outgoing HTTP request.
 * Adds Authorization: Bearer <token> header if a token exists in localStorage.
 * On 401 response → clears auth data and redirects to login.
 */
export const jwtInterceptor: HttpInterceptorFn = (req: any, next: any) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const token = authService.getToken();
  const currentUser = authService.getCurrentUser();
  const isPublicAuthRequest =
    req.url.includes('/api/v1/auth/login') ||
    req.url.includes('/api/v1/auth/register') ||
    req.url.includes('/api/v1/auth/forgot-password') ||
    req.url.includes('/api/v1/auth/reset-password');

  // Clone request and add token header if available
  const authReq = token && !isPublicAuthRequest
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          ...(currentUser?.userId ? { 'X-User-Id': String(currentUser.userId) } : {})
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (isPublicAuthRequest) {
          return throwError(() => error);
        }
        // Token expired or invalid — clear session and redirect to login
        authService.logout();
        router.navigate(['/login'], {
          queryParams: { reason: 'session_expired' }
        });
      }
      return throwError(() => error);
    })
  );
};
