import { Component, AfterViewInit, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThirdPartyScriptService } from '../../../core/services/third-party-script.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div class="card shadow-lg border-0" style="width: 420px;">

        <!-- Header -->
        <div class="card-header bg-dark text-white text-center py-4">
          <i class="bi bi-box-seam-fill fs-2 text-warning"></i>
          <h4 class="mb-0 mt-2 fw-bold">StockPro</h4>
          <small class="text-muted">Track. Control. Optimise. Grow.</small>
        </div>

        <div class="card-body p-4">

          <!-- Session expired notice -->
          <div class="alert alert-warning d-flex align-items-center gap-2"
               *ngIf="sessionExpired">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>Your session has expired. Please log in again.</span>
          </div>

          <!-- Error -->
          <div class="alert alert-danger d-flex align-items-center gap-2" *ngIf="errorMessage">
            <i class="bi bi-x-circle-fill"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Login Form -->
          <form (ngSubmit)="onLogin()" #loginForm="ngForm">

            <div class="mb-3">
              <label class="form-label fw-semibold">Email Address</label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-envelope"></i>
                </span>
                <input type="email" class="form-control" placeholder="you@company.com"
                       [(ngModel)]="email" name="email" required
                       [pattern]="emailPattern"
                       #emailCtrl="ngModel"
                       [class.is-invalid]="submitted && emailCtrl.invalid">
                <div class="invalid-feedback">Enter a valid email address with a proper alphabetic domain like gmail.com</div>
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label fw-semibold">Password</label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-lock"></i>
                </span>
                <input [type]="showPassword ? 'text' : 'password'"
                       class="form-control" placeholder="••••••••"
                       [(ngModel)]="password" name="password" required
                       [class.is-invalid]="submitted && !password">
                <button type="button" class="btn btn-outline-secondary"
                        (click)="showPassword = !showPassword">
                  <i [class]="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
                <div class="invalid-feedback">Password is required</div>
              </div>
            </div>

            <button type="submit" class="btn btn-dark w-100 py-2 fw-semibold mb-3"
                    [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i *ngIf="!loading" class="bi bi-box-arrow-in-right me-2"></i>
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>

            <button type="button"
                    class="btn btn-outline-secondary w-100 py-2 mb-3"
                    [disabled]="loading"
                    (click)="useLocalAdmin()">
              <i class="bi bi-person-badge me-2"></i>
              Use Local Admin
            </button>

            <div class="d-flex align-items-center my-3">
              <hr class="flex-grow-1">
              <span class="mx-3 text-muted small">OR</span>
              <hr class="flex-grow-1">
            </div>

            <!-- Google Login Container -->
            <div id="googleBtn" class="d-flex justify-content-center mb-4"></div>
            <div *ngIf="googleAuthMessage"
                 class="alert mb-4"
                 [class.alert-warning]="!googleAuthAvailable"
                 [class.alert-info]="googleAuthAvailable">
              <i class="bi"
                 [class.bi-shield-lock]="!googleAuthAvailable"
                 [class.bi-info-circle]="googleAuthAvailable"></i>
              <span class="ms-2">{{ googleAuthMessage }}</span>
            </div>

            <div class="text-center">
              <a routerLink="/forgot-password" class="text-decoration-none small fw-semibold text-secondary">Forgot password?</a>
            </div>

            <div class="text-center mt-3">
              <span class="text-muted">Don't have an account? </span>
              <a routerLink="/register" class="text-decoration-none fw-bold text-dark">Sign Up</a>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="card-footer text-center text-muted py-3 bg-light">
          <small>
            <i class="bi bi-shield-lock me-1"></i>
            Secured with JWT Authentication
          </small>
        </div>

      </div>
    </div>
  `
})
export class LoginComponent implements OnInit, AfterViewInit {
  readonly emailPattern = String.raw`^(?!.*\.\.)[A-Za-z0-9._%+-]+@[A-Za-z]+(?:\.[A-Za-z]+)+$`;
  email    = '';
  password = '';
  loading  = false;
  submitted = false;
  errorMessage = '';
  showPassword = false;
  sessionExpired = false;
  googleAuthMessage = '';
  googleAuthAvailable = true;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly ngZone: NgZone,
    private readonly thirdPartyScriptService: ThirdPartyScriptService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.authService.getDashboardRoute()]);
      return;
    }

    this.route.queryParams.subscribe((params: any) => {
      this.sessionExpired = params['reason'] === 'session_expired';
    });
  }

  ngAfterViewInit(): void {
    void this.initGoogleLogin();
  }

  private async initGoogleLogin(): Promise<void> {
    if (!this.isGoogleSignInSupportedOrigin()) {
      this.googleAuthAvailable = false;
      this.googleAuthMessage = 'Google Sign-In requires HTTPS on your deployed domain. Open this app over https://stockpro.linkpc.net after SSL is enabled.';
      return;
    }

    if (!environment.googleClientId?.trim()) {
      this.googleAuthAvailable = false;
      this.googleAuthMessage = 'Google Sign-In is not configured yet. Add the Google client ID in the frontend environment first.';
      return;
    }

    try {
      await this.thirdPartyScriptService.load('google-gsi');
    } catch {
      this.googleAuthAvailable = false;
      this.googleAuthMessage = 'Google Sign-In could not load from Google. Check your browser console, CSP, and network access.';
      return;
    }

    const googleApi = (globalThis as typeof globalThis & { google?: any }).google;
    if (googleApi === undefined) {
      this.googleAuthAvailable = false;
      this.googleAuthMessage = 'Google Sign-In did not initialize. Verify your Google Cloud OAuth origin settings for this domain.';
      return;
    }

    googleApi.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleLogin(response)
    });

    googleApi.accounts.id.renderButton(
      document.getElementById('googleBtn'),
      { theme: 'outline', size: 'large', width: 340, text: 'signin_with', shape: 'pill' }
    );

    this.googleAuthAvailable = true;
    this.googleAuthMessage = '';
  }

  private handleGoogleLogin(response: any): void {
    this.ngZone.run(() => {
      this.loading = true;
      this.errorMessage = '';

      this.authService.googleLogin(response.credential).subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.success) {
            this.router.navigate([this.authService.getDashboardRoute()]);
          } else {
            this.errorMessage = res.message || 'Google login failed';
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.errorMessage = this.getAuthErrorMessage(err, 'Authentication failed with Google');
        }
      });
    });
  }

  onLogin(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.email || !this.password) return;

    const normalizedEmail = this.email.trim().toLowerCase();
    if (!new RegExp(this.emailPattern).test(normalizedEmail)) {
      this.errorMessage = 'Enter a valid email address with a proper alphabetic domain like gmail.com';
      return;
    }

    this.loading = true;
    this.authService.login({ email: normalizedEmail, password: this.password }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate([this.authService.getDashboardRoute()]);
        } else {
          this.errorMessage = res.message || 'Login failed';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = this.getAuthErrorMessage(err, 'Invalid email or password');
      }
    });
  }

  useLocalAdmin(): void {
    this.email = 'admin@stockpro.local';
    this.password = '';
    this.errorMessage = 'Enter the local admin password to continue.';
    this.submitted = false;
  }

  private getAuthErrorMessage(err: any, fallbackMessage: string): string {
    const backendMessage = err?.error?.message;
    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      return backendMessage;
    }

    if (err?.status === 403) {
      return 'Account has been deactivated. Contact your administrator.';
    }

    return fallbackMessage;
  }

  private isGoogleSignInSupportedOrigin(): boolean {
    const { protocol, hostname } = window.location;
    return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
  }
}
