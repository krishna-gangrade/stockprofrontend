import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, roleGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'isLoggedIn',
      'hasAnyRole',
      'getDashboardRoute'
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('allows navigation for authenticated users', () => {
    authService.isLoggedIn.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to login', () => {
    authService.isLoggedIn.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});

describe('roleGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'isLoggedIn',
      'hasAnyRole',
      'getDashboardRoute'
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('redirects unauthenticated users to login', () => {
    authService.isLoggedIn.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => roleGuard(['ADMIN'])({} as never, {} as never));

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('allows users with an accepted role', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.hasAnyRole.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => roleGuard(['ADMIN', 'INVENTORY_MANAGER'])({} as never, {} as never));

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects logged-in users without the required role to their dashboard', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.hasAnyRole.and.returnValue(false);
    authService.getDashboardRoute.and.returnValue('/dashboard/staff');

    const result = TestBed.runInInjectionContext(() => roleGuard(['ADMIN'])({} as never, {} as never));

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/staff']);
  });
});
