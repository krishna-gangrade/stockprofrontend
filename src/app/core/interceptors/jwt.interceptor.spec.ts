import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'getCurrentUser', 'logout']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds a bearer token to protected requests', () => {
    authService.getToken.and.returnValue('jwt-token');
    authService.getCurrentUser.and.returnValue({ userId: 7 } as never);

    http.get('/api/v1/products').subscribe();

    const req = httpMock.expectOne('/api/v1/products');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(req.request.headers.get('X-User-Id')).toBe('7');
    req.flush({});
  });

  it('does not add a bearer token to public auth requests', () => {
    authService.getToken.and.returnValue('jwt-token');
    authService.getCurrentUser.and.returnValue({ userId: 7 } as never);

    http.post('/api/v1/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('logs out and redirects on 401 responses from protected endpoints', () => {
    authService.getToken.and.returnValue('jwt-token');
    authService.getCurrentUser.and.returnValue({ userId: 7 } as never);
    let capturedStatus: number | undefined;

    http.get('/api/v1/warehouses').subscribe({
      error: error => {
        capturedStatus = error.status;
      }
    });

    const req = httpMock.expectOne('/api/v1/warehouses');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(capturedStatus).toBe(401);
    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { reason: 'session_expired' }
    });
  });

  it('does not force logout on 401 responses from public auth endpoints', () => {
    authService.getToken.and.returnValue('jwt-token');
    authService.getCurrentUser.and.returnValue({ userId: 7 } as never);

    http.post('/api/v1/auth/forgot-password', {}).subscribe({
      error: () => undefined
    });

    const req = httpMock.expectOne('/api/v1/auth/forgot-password');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('passes through non-401 errors without forcing logout', () => {
    authService.getToken.and.returnValue('jwt-token');
    authService.getCurrentUser.and.returnValue({ userId: 7 } as never);

    http.get('/api/v1/reports/valuation/total').subscribe({
      error: () => undefined
    });

    const req = httpMock.expectOne('/api/v1/reports/valuation/total');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(authService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('still sends protected requests when the current user is unavailable', () => {
    authService.getToken.and.returnValue('jwt-token');
    authService.getCurrentUser.and.returnValue(null);

    http.get('/api/v1/products').subscribe();

    const req = httpMock.expectOne('/api/v1/products');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(req.request.headers.has('X-User-Id')).toBeFalse();
    req.flush({});
  });
});
