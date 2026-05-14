import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reset-page">
      <div class="reset-shell">
        <section class="reset-brand-panel">
          <div class="brand-badge">
            <i class="bi bi-shield-lock"></i>
            <span>StockPro Security</span>
          </div>

          <h1>Reset your password without the stress.</h1>
          <p>
            We will send a one-time verification code to your email so you can securely regain access to your account.
          </p>

          <div class="benefit-list">
            <div class="benefit-item">
              <i class="bi bi-envelope-check"></i>
              <div>
                <strong>Email verification</strong>
                <span>The OTP expires quickly to keep your account protected.</span>
              </div>
            </div>

            <div class="benefit-item">
              <i class="bi bi-key"></i>
              <div>
                <strong>Choose a fresh password</strong>
                <span>Use a strong password you have not used before.</span>
              </div>
            </div>

            <div class="benefit-item">
              <i class="bi bi-lightning-charge"></i>
              <div>
                <strong>Fast recovery</strong>
                <span>Most users finish the reset in under a minute.</span>
              </div>
            </div>
          </div>
        </section>

        <section class="reset-card">
          <div class="step-indicator">
            <div class="step-pill" [class.active]="step === 1" [class.complete]="step === 2">
              <span>1</span>
              <label>Verify email</label>
            </div>
            <div class="step-line"></div>
            <div class="step-pill" [class.active]="step === 2">
              <span>2</span>
              <label>Set password</label>
            </div>
          </div>

          <div class="reset-card-header">
            <div class="icon-wrap">
              <i class="bi bi-shield-lock-fill"></i>
            </div>
            <div>
              <h2>{{ step === 1 ? 'Forgot your password?' : 'Enter your OTP and new password' }}</h2>
              <p>
                {{ step === 1
                  ? 'Enter the email linked to your StockPro account and we will send a secure one-time code.'
                  : 'Use the OTP from your inbox and create a strong password to finish resetting your account.' }}
              </p>
            </div>
          </div>

          <div class="alert alert-success reset-alert" *ngIf="successMessage">{{ successMessage }}</div>
          <div class="alert alert-danger reset-alert" *ngIf="errorMessage">{{ errorMessage }}</div>

          <form (ngSubmit)="requestOtp()" *ngIf="step === 1" class="reset-form">
            <div class="field-block">
              <label class="form-label">Email Address</label>
              <input
                type="email"
                class="form-control reset-input"
                name="email"
                [(ngModel)]="email"
                placeholder="you@company.com"
                required
                [pattern]="emailPattern"
                #requestEmailCtrl="ngModel"
                [class.is-invalid]="requestEmailCtrl.invalid && requestEmailCtrl.touched">
              <small class="field-help">We will send the verification code to this email address.</small>
              <small class="text-danger" *ngIf="requestEmailCtrl.invalid && requestEmailCtrl.touched">
                Enter a valid email address with a proper alphabetic domain like gmail.com.
              </small>
            </div>

            <button type="submit" class="btn btn-dark reset-primary-btn" [disabled]="loading || requestEmailCtrl.invalid">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              Send OTP
            </button>
          </form>

          <form (ngSubmit)="resetPassword()" *ngIf="step === 2" class="reset-form">
            <div class="field-block">
              <label class="form-label">Email Address</label>
              <input
                type="email"
                class="form-control reset-input"
                name="confirmedEmail"
                [(ngModel)]="email"
                required
                [pattern]="emailPattern"
                #resetEmailCtrl="ngModel"
                [class.is-invalid]="resetEmailCtrl.invalid && resetEmailCtrl.touched">
              <small class="text-danger" *ngIf="resetEmailCtrl.invalid && resetEmailCtrl.touched">
                Enter a valid email address with a proper alphabetic domain like gmail.com.
              </small>
            </div>

            <div class="field-row">
              <div class="field-block field-grow">
                <label class="form-label">OTP</label>
                <input
                  type="text"
                  class="form-control reset-input otp-input"
                  name="otp"
                  [(ngModel)]="otp"
                  maxlength="8"
                  placeholder="6-digit code"
                  required>
              </div>

              <button
                type="button"
                class="btn btn-outline-secondary resend-btn"
                [disabled]="loading"
                (click)="requestOtp()">
                Resend OTP
              </button>
            </div>

            <div class="field-block">
              <div class="password-label-row">
                <label class="form-label">New Password</label>
                <button
                  type="button"
                  class="toggle-link"
                  (click)="showPassword = !showPassword">
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>

              <input
                [type]="showPassword ? 'text' : 'password'"
                class="form-control reset-input"
                name="newPassword"
                [(ngModel)]="newPassword"
                placeholder="Create a strong password"
                required
                [pattern]="passwordPattern"
                #newPasswordCtrl="ngModel"
                [class.is-invalid]="newPasswordCtrl.invalid && newPasswordCtrl.touched">

              <div class="password-note">
                Use uppercase, lowercase, a number, and a special character.
              </div>
              <small class="text-danger" *ngIf="newPasswordCtrl.invalid && newPasswordCtrl.touched">
                Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.
              </small>
            </div>

            <button type="submit" class="btn btn-dark reset-primary-btn" [disabled]="loading || !otp || resetEmailCtrl.invalid || newPasswordCtrl.invalid">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              Reset Password
            </button>
          </form>

          <div class="reset-footer">
            <a routerLink="/login" class="back-link">
              <i class="bi bi-arrow-left"></i>
              Back to login
            </a>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      --reset-ink: #16202a;
      --reset-surface: rgba(255, 255, 255, 0.92);
      --reset-line: rgba(22, 32, 42, 0.1);
      --reset-accent: #f59e0b;
      --reset-accent-deep: #c96a10;
      --reset-shadow: 0 28px 80px rgba(21, 29, 38, 0.18);
    }

    .reset-page {
      min-height: 100vh;
      padding: 32px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 28%),
        radial-gradient(circle at bottom right, rgba(14, 116, 144, 0.14), transparent 34%),
        linear-gradient(135deg, #f6efe4 0%, #eef3f8 48%, #f9fbfd 100%);
    }

    .reset-shell {
      width: min(1120px, 100%);
      display: grid;
      grid-template-columns: 1fr 520px;
      gap: 28px;
      align-items: stretch;
    }

    .reset-brand-panel,
    .reset-card {
      border-radius: 28px;
      box-shadow: var(--reset-shadow);
      overflow: hidden;
      backdrop-filter: blur(10px);
    }

    .reset-brand-panel {
      padding: 38px;
      color: #fff7ed;
      background:
        linear-gradient(160deg, rgba(22, 32, 42, 0.96), rgba(34, 44, 57, 0.92)),
        linear-gradient(120deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0));
      position: relative;
    }

    .reset-brand-panel::after {
      content: '';
      position: absolute;
      inset: auto -120px -120px auto;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.28), transparent 70%);
    }

    .brand-badge {
      width: fit-content;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      font-size: 0.9rem;
      letter-spacing: 0.01em;
      margin-bottom: 26px;
    }

    .brand-badge i {
      color: #fbbf24;
    }

    .reset-brand-panel h1 {
      font-size: clamp(2rem, 4vw, 3.3rem);
      line-height: 1.02;
      font-weight: 800;
      margin-bottom: 18px;
      max-width: 10ch;
    }

    .reset-brand-panel > p {
      max-width: 48ch;
      color: rgba(255, 247, 237, 0.8);
      font-size: 1.03rem;
      margin-bottom: 30px;
    }

    .benefit-list {
      display: grid;
      gap: 16px;
    }

    .benefit-item {
      display: grid;
      grid-template-columns: 42px 1fr;
      gap: 14px;
      padding: 16px 18px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
      z-index: 1;
    }

    .benefit-item i {
      width: 42px;
      height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: rgba(251, 191, 36, 0.16);
      color: #fbbf24;
      font-size: 1.1rem;
    }

    .benefit-item strong,
    .benefit-item span {
      display: block;
    }

    .benefit-item strong {
      margin-bottom: 4px;
      font-size: 0.98rem;
    }

    .benefit-item span {
      color: rgba(255, 247, 237, 0.72);
      font-size: 0.92rem;
      line-height: 1.45;
    }

    .reset-card {
      background: var(--reset-surface);
      padding: 28px;
      border: 1px solid rgba(255, 255, 255, 0.65);
      color: var(--reset-ink);
    }

    .step-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 26px;
    }

    .step-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px 8px 8px;
      border-radius: 999px;
      background: #eef2f6;
      color: #607080;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }

    .step-pill span {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #dbe3ea;
      font-weight: 700;
    }

    .step-pill.active,
    .step-pill.complete {
      background: rgba(245, 158, 11, 0.12);
      color: #8a4b08;
    }

    .step-pill.active span,
    .step-pill.complete span {
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: white;
    }

    .step-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, rgba(22, 32, 42, 0.12), rgba(22, 32, 42, 0.04));
    }

    .reset-card-header {
      display: grid;
      grid-template-columns: 60px 1fr;
      gap: 16px;
      margin-bottom: 22px;
      align-items: start;
    }

    .icon-wrap {
      width: 60px;
      height: 60px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1f2937, #374151);
      color: #fbbf24;
      font-size: 1.5rem;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .reset-card-header h2 {
      margin: 0 0 6px;
      font-size: 1.7rem;
      font-weight: 800;
      line-height: 1.15;
    }

    .reset-card-header p {
      margin: 0;
      color: #617283;
      line-height: 1.55;
    }

    .reset-alert {
      border-radius: 18px;
      padding: 14px 16px;
      margin-bottom: 18px;
    }

    .reset-form {
      display: grid;
      gap: 18px;
    }

    .field-block {
      display: grid;
      gap: 8px;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: end;
    }

    .field-grow {
      min-width: 0;
    }

    .form-label {
      margin: 0;
      font-weight: 700;
      color: #203040;
    }

    .reset-input {
      min-height: 54px;
      border-radius: 16px;
      border: 1px solid var(--reset-line);
      padding: 0 16px;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.85);
      box-shadow: none;
    }

    .reset-input:focus {
      border-color: rgba(245, 158, 11, 0.55);
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.14);
    }

    .otp-input {
      letter-spacing: 0.24em;
      font-weight: 700;
    }

    .field-help,
    .password-note {
      color: #667788;
      font-size: 0.92rem;
      line-height: 1.45;
    }

    .password-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .toggle-link {
      border: 0;
      background: transparent;
      color: var(--reset-accent-deep);
      font-weight: 700;
      padding: 0;
    }

    .reset-primary-btn,
    .resend-btn {
      min-height: 54px;
      border-radius: 16px;
      font-weight: 700;
      border-width: 1px;
    }

    .reset-primary-btn {
      background: linear-gradient(135deg, #1f2937, #111827);
      border-color: #111827;
      box-shadow: 0 14px 28px rgba(17, 24, 39, 0.16);
    }

    .reset-primary-btn:hover,
    .reset-primary-btn:focus {
      background: linear-gradient(135deg, #18212e, #0b1220);
      border-color: #0b1220;
    }

    .resend-btn {
      padding: 0 18px;
      white-space: nowrap;
    }

    .reset-footer {
      margin-top: 22px;
      padding-top: 22px;
      border-top: 1px solid rgba(22, 32, 42, 0.08);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: #1c2b39;
      text-decoration: none;
      font-weight: 700;
    }

    .back-link:hover {
      color: var(--reset-accent-deep);
    }

    @media (max-width: 991.98px) {
      .reset-shell {
        grid-template-columns: 1fr;
      }

      .reset-brand-panel {
        display: none;
      }
    }

    @media (max-width: 575.98px) {
      .reset-page {
        padding: 16px;
      }

      .reset-card {
        padding: 22px 18px;
        border-radius: 22px;
      }

      .step-indicator,
      .field-row,
      .password-label-row {
        grid-template-columns: 1fr;
        display: grid;
      }

      .step-line {
        display: none;
      }

      .step-pill {
        justify-content: flex-start;
      }

      .reset-card-header {
        grid-template-columns: 1fr;
      }

      .icon-wrap {
        width: 54px;
        height: 54px;
      }

      .resend-btn {
        width: 100%;
      }
    }
  `]
})
export class ForgotPasswordComponent {
  readonly emailPattern = String.raw`^(?!.*\.\.)[A-Za-z0-9._%+-]+@[A-Za-z]+(?:\.[A-Za-z]+)+$`;
  readonly passwordPattern = String.raw`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$`;
  email = '';
  otp = '';
  newPassword = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  step = 1;

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  requestOtp(): void {
    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Enter a valid email address with a proper alphabetic domain like gmail.com.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword({ email: this.email.trim().toLowerCase() }).subscribe({
      next: (res) => {
        this.loading = false;
        this.step = 2;
        this.successMessage = res.message || 'OTP sent to your email address.';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Unable to send OTP right now.';
      }
    });
  }

  resetPassword(): void {
    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Enter a valid email address with a proper alphabetic domain like gmail.com.';
      return;
    }

    if (!this.otp || !this.isValidPassword(this.newPassword)) {
      this.errorMessage = 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword({
      email: this.email.trim().toLowerCase(),
      otp: this.otp.trim(),
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'Password reset successful.';
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Unable to reset password.';
      }
    });
  }

  private isValidEmail(email: string): boolean {
    return new RegExp(this.emailPattern).test(email.trim());
  }

  private isValidPassword(password: string): boolean {
    return new RegExp(this.passwordPattern).test(password);
  }
}
