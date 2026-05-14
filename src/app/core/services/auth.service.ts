import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AdminUserUpdateRequest, ApiResponse, AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordWithOtpRequest, UserResponse, UserRole } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return this.http.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', request).pipe(
      tap((res: ApiResponse<AuthResponse>) => { if (res.success && res.data) this.saveSession(res.data); })
    );
  }
  
  googleLogin(token: string): Observable<ApiResponse<AuthResponse>> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return this.http.post<ApiResponse<AuthResponse>>('/api/v1/auth/google-login', { token }).pipe(
      tap((res: ApiResponse<AuthResponse>) => { if (res.success && res.data) this.saveSession(res.data); })
    );
  }

  register(request: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>('/api/v1/auth/forgot-password', request);
  }

  resetPassword(request: ResetPasswordWithOtpRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>('/api/v1/auth/reset-password', request);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  private saveSession(auth: AuthResponse): void {
    localStorage.setItem('token', auth.accessToken);
    localStorage.setItem('user', JSON.stringify(this.normalizeCurrentUser(auth.user)));
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  getCurrentUser(): UserResponse | null {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      return null;
    }

    try {
      return this.normalizeCurrentUser(JSON.parse(rawUser));
    } catch {
      return null;
    }
  }
  isLoggedIn(): boolean { return !!this.getToken(); }
  getRole(): UserRole | null { return this.getCurrentUser()?.role ?? null; }
  isAdmin(): boolean { return this.getRole() === 'ADMIN'; }
  isManager(): boolean { return this.getRole() === 'INVENTORY_MANAGER'; }
  isOfficer(): boolean { return this.getRole() === 'PURCHASE_OFFICER'; }
  isStaff(): boolean { return this.getRole() === 'WAREHOUSE_STAFF'; }
  hasAnyRole(...roles: UserRole[]): boolean { const r = this.getRole(); return r ? roles.includes(r) : false; }

  getProfile(): Observable<ApiResponse<UserResponse>> { return this.http.get<ApiResponse<UserResponse>>('/api/v1/auth/profile'); }
  getAllUsers(): Observable<ApiResponse<UserResponse[]>> { return this.http.get<ApiResponse<UserResponse[]>>('/api/v1/auth/users'); }
  updateUserByAdmin(id: number, request: AdminUserUpdateRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`/api/v1/auth/admin/users/${id}`, request);
  }
  deactivateUser(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`/api/v1/auth/admin/users/${id}`, { isActive: false });
  }

  getDashboardRoute(): string {
    switch (this.getRole()) {
      case 'ADMIN': return '/dashboard/admin';
      case 'INVENTORY_MANAGER': return '/dashboard/manager';
      case 'PURCHASE_OFFICER': return '/dashboard/officer';
      case 'WAREHOUSE_STAFF': return '/dashboard/staff';
      default: return '/login';
    }
  }

  private normalizeCurrentUser(rawUser: unknown): UserResponse {
    const user = (rawUser ?? {}) as Partial<UserResponse> & { id?: number };
    return {
      ...user,
      userId: typeof user.userId === 'number' ? user.userId : (user.id ?? 0)
    } as UserResponse;
  }
}
