import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div class="card shadow-lg border-0" style="width: 500px;">

        <!-- Header -->
        <div class="card-header bg-dark text-white text-center py-4">
          <i class="bi bi-person-plus-fill fs-2 text-warning"></i>
          <h4 class="mb-0 mt-2 fw-bold">Create Account</h4>
          <small class="text-muted">Join the StockPro network</small>
        </div>

        <div class="card-body p-4">

          <!-- Success -->
          <div class="alert alert-success d-flex align-items-center gap-2" *ngIf="successMessage">
            <i class="bi bi-check-circle-fill"></i>
            <span>{{ successMessage }}</span>
          </div>

          <!-- Error -->
          <div class="alert alert-danger d-flex align-items-center gap-2" *ngIf="errorMessage">
            <i class="bi bi-x-circle-fill"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Register Form -->
          <form (ngSubmit)="onRegister(registerForm.valid)" #registerForm="ngForm" novalidate>

            <div class="row">
              <!-- Full Name -->
              <div class="col-md-12 mb-3">
                <label class="form-label fw-semibold">Full Name</label>
                <input type="text" class="form-control" placeholder="John Doe"
                       [(ngModel)]="form.fullName" name="fullName" required
                       [pattern]="fullNamePattern"
                       #fullNameCtrl="ngModel"
                       [class.is-invalid]="submitted && fullNameCtrl.invalid">
                <div class="invalid-feedback">
                  Name can contain letters and spaces only.
                </div>
              </div>

              <!-- Email -->
              <div class="col-md-12 mb-3">
                <label class="form-label fw-semibold">Email Address</label>
                <input type="email" class="form-control" placeholder="john@company.com"
                       [(ngModel)]="form.email" name="email" required
                       [pattern]="emailPattern"
                       #emailCtrl="ngModel"
                       [class.is-invalid]="submitted && emailCtrl.invalid">
                <div class="invalid-feedback">
                  Enter a valid email address with a proper alphabetic domain like gmail.com.
                </div>
              </div>

              <!-- Password -->
              <div class="col-md-12 mb-3">
                <label class="form-label fw-semibold">Password</label>
                <input type="password" class="form-control" placeholder="••••••••"
                       [(ngModel)]="form.password" name="password" required minlength="8"
                       [pattern]="passwordPattern"
                       #passwordCtrl="ngModel"
                       [class.is-invalid]="submitted && passwordCtrl.invalid">
                <div class="invalid-feedback">
                  Password must be at least 8 characters, containing uppercase, lowercase, digit, and special character.
                </div>
              </div>

              <div class="col-md-12 mb-2">
                <div class="alert alert-info mb-0">
                  New public registrations are created as <strong>Warehouse Staff</strong>. Promotions are handled by an administrator.
                </div>
              </div>

              <!-- Department -->
              <div class="col-md-12 mb-4">
                <label class="form-label fw-semibold">Department</label>
                <select class="form-select" [(ngModel)]="form.department" name="department" required>
                  <option value="" disabled>Select Dept</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Inventory Control">Inventory Control</option>
                  <option value="Sales">Sales</option>
                  <option value="Administration">Administration</option>
                  <option value="IT Support">IT Support</option>
                </select>
              </div>
            </div>

            <button type="submit" class="btn btn-dark w-100 py-2 fw-semibold mb-3"
                    [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ loading ? 'Creating Account...' : 'Register' }}
            </button>

            <div class="text-center">
              <span class="text-muted">Already have an account? </span>
              <a routerLink="/login" class="text-decoration-none fw-bold text-dark">Sign In</a>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="card-footer text-center text-muted py-3 bg-light">
          <small>
            <i class="bi bi-shield-lock me-1"></i>
            StockPro Identity Management
          </small>
        </div>

      </div>
    </div>
  `
})
export class RegisterComponent {
  readonly fullNamePattern = String.raw`^[A-Za-z]+(?: [A-Za-z]+)*$`;
  readonly emailPattern = String.raw`^(?!.*\.\.)[A-Za-z0-9._%+-]+@[A-Za-z]+(?:\.[A-Za-z]+)+$`;
  readonly passwordPattern = String.raw`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$`;

  form = {
    fullName: '',
    email: '',
    password: '',
    department: ''
  };

  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  onRegister(isValid: boolean | null): void {
    this.submitted = true;
    this.errorMessage = '';

    if (!isValid) {
      return;
    }

    this.loading = true;
    const { department, ...payload } = this.form;
    const normalizedPayload = {
      ...payload,
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase()
    };
    
    this.authService.register(normalizedPayload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.successMessage = 'Account created successfully! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.errorMessage = res.message || 'Registration failed';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  private getErrorMessage(err: any): string {
    if (typeof err?.error === 'string') {
      try {
        const parsed = JSON.parse(err.error);
        return parsed?.message || 'An error occurred during registration';
      } catch {
        return err.error;
      }
    }

    return err?.error?.message
      || err?.message
      || 'An error occurred during registration';
  }
}
