import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { AlertService } from './core/services/api.services';

describe('AppComponent', () => {
  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
    getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(null),
    getRole: jasmine.createSpy('getRole').and.returnValue('ADMIN'),
    getDashboardRoute: jasmine.createSpy('getDashboardRoute').and.returnValue('/dashboard/admin'),
    hasAnyRole: jasmine.createSpy('hasAnyRole').and.returnValue(true),
    isStaff: jasmine.createSpy('isStaff').and.returnValue(false),
    logout: jasmine.createSpy('logout')
  };

  const alertServiceMock = {
    getUnreadCount: jasmine.createSpy('getUnreadCount').and.returnValue(of({ data: 3 }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: AlertService, useValue: alertServiceMock }
      ]
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the StockPro brand when logged in', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getCurrentUser.and.returnValue({ fullName: 'Admin User', email: 'admin@stockpro.test' });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('StockPro');
  });
});
