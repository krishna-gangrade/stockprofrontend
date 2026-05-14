import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('logs in and stores the session when the response is successful', () => {
    localStorage.setItem('token', 'stale-token');
    localStorage.setItem('user', '{"id":99}');

    let responseBody: unknown;
    service.login({ email: 'admin@stockpro.test', password: 'secret' }).subscribe(res => {
      responseBody = res;
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();

    req.flush({
      success: true,
      data: {
        accessToken: 'jwt-token',
        user: { id: 1, role: 'ADMIN', fullName: 'Admin User' }
      }
    });

    expect(responseBody).toEqual(jasmine.objectContaining({ success: true }));
    expect(localStorage.getItem('token')).toBe('jwt-token');
    expect(localStorage.getItem('user')).toContain('"role":"ADMIN"');
  });

  it('does not store a session when login fails', () => {
    service.login({ email: 'admin@stockpro.test', password: 'bad' }).subscribe();

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ success: false, data: null });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('sends a Google login request and stores the session', () => {
    service.googleLogin('google-token').subscribe();

    const req = httpMock.expectOne('/api/v1/auth/google-login');
    expect(req.request.body).toEqual({ token: 'google-token' });
    req.flush({
      success: true,
      data: {
        accessToken: 'google-jwt',
        user: { id: 2, role: 'INVENTORY_MANAGER' }
      }
    });

    expect(localStorage.getItem('token')).toBe('google-jwt');
    expect(service.getRole()).toBe('INVENTORY_MANAGER');
  });

  it('posts register, forgot password, and reset password requests to the expected endpoints', () => {
    service.register({} as never).subscribe();
    service.forgotPassword({} as never).subscribe();
    service.resetPassword({} as never).subscribe();

    expect(httpMock.expectOne('/api/v1/auth/register').request.method).toBe('POST');
    expect(httpMock.expectOne('/api/v1/auth/forgot-password').request.method).toBe('POST');
    expect(httpMock.expectOne('/api/v1/auth/reset-password').request.method).toBe('POST');
  });

  it('clears the session and navigates to login on logout', () => {
    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', '{"role":"ADMIN"}');

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('reports authentication state and current user details', () => {
    expect(service.getToken()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.getRole()).toBeNull();

    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'WAREHOUSE_STAFF', fullName: 'Staff User' }));

    expect(service.getToken()).toBe('jwt-token');
    expect(service.getCurrentUser()).toEqual(jasmine.objectContaining({ role: 'WAREHOUSE_STAFF' }));
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.getRole()).toBe('WAREHOUSE_STAFF');
    expect(service.isStaff()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
    expect(service.hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')).toBeTrue();
  });

  it('normalizes legacy stored users that still use id instead of userId', () => {
    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: 9, role: 'ADMIN', fullName: 'Admin User' }));

    expect(service.getCurrentUser()).toEqual(jasmine.objectContaining({ userId: 9, role: 'ADMIN' }));
    expect(service.getRole()).toBe('ADMIN');
  });

  it('maps each role to the correct dashboard route', () => {
    const roleToRoute: Array<[string | null, string]> = [
      ['ADMIN', '/dashboard/admin'],
      ['INVENTORY_MANAGER', '/dashboard/manager'],
      ['PURCHASE_OFFICER', '/dashboard/officer'],
      ['WAREHOUSE_STAFF', '/dashboard/staff'],
      [null, '/login']
    ];

    roleToRoute.forEach(([role, route]) => {
      if (role) {
        localStorage.setItem('user', JSON.stringify({ role }));
      } else {
        localStorage.removeItem('user');
      }
      expect(service.getDashboardRoute()).toBe(route);
    });
  });

  it('uses the profile and admin endpoints', () => {
    service.getProfile().subscribe();
    service.getAllUsers().subscribe();
    service.updateUserByAdmin(5, {} as never).subscribe();
    service.deactivateUser(6).subscribe();

    expect(httpMock.expectOne('/api/v1/auth/profile').request.method).toBe('GET');
    expect(httpMock.expectOne('/api/v1/auth/users').request.method).toBe('GET');
    expect(httpMock.expectOne('/api/v1/auth/admin/users/5').request.method).toBe('PUT');
    const deactivateReq = httpMock.expectOne('/api/v1/auth/admin/users/6');
    expect(deactivateReq.request.method).toBe('PUT');
    expect(deactivateReq.request.body).toEqual({ isActive: false });
  });
});
