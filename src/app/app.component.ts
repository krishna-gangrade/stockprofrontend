import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { AlertService } from './core/services/api.services';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Top Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark" *ngIf="isLoggedIn">
      <div class="container-fluid">

        <!-- Brand -->
        <a class="navbar-brand fw-bold" [routerLink]="authService.getDashboardRoute()">
          <i class="bi bi-box-seam-fill text-warning me-2"></i>StockPro
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">

            <!-- Dashboard -->
            <li class="nav-item">
              <a class="nav-link" [routerLink]="authService.getDashboardRoute()"
                 routerLinkActive="active">
                <i class="bi bi-speedometer2 me-1"></i>Dashboard
              </a>
            </li>

            <!-- Products - all roles -->
            <li class="nav-item">
              <a class="nav-link" routerLink="/products" routerLinkActive="active">
                <i class="bi bi-box me-1"></i>Products
              </a>
            </li>

            <!-- Warehouses - all roles -->
            <li class="nav-item">
              <a class="nav-link" routerLink="/warehouses" routerLinkActive="active">
                <i class="bi bi-building me-1"></i>Warehouses
              </a>
            </li>

            <!-- Purchase Orders - not staff -->
            <li class="nav-item" *ngIf="!authService.isStaff()">
              <a class="nav-link" routerLink="/purchase-orders" routerLinkActive="active">
                <i class="bi bi-cart me-1"></i>Purchase Orders
              </a>
            </li>

            <!-- Payments - purchasing, manager and admin -->
            <li class="nav-item" *ngIf="authService.hasAnyRole('PURCHASE_OFFICER','INVENTORY_MANAGER','ADMIN')">
              <a class="nav-link" routerLink="/payments" routerLinkActive="active">
                <i class="bi bi-credit-card me-1"></i>Payments
              </a>
            </li>

            <!-- Suppliers - officer and admin -->
            <li class="nav-item" *ngIf="authService.hasAnyRole('PURCHASE_OFFICER','ADMIN')">
              <a class="nav-link" routerLink="/suppliers" routerLinkActive="active">
                <i class="bi bi-truck me-1"></i>Suppliers
              </a>
            </li>

            <!-- Movements - all roles -->
            <li class="nav-item">
              <a class="nav-link" routerLink="/movements" routerLinkActive="active">
                <i class="bi bi-arrow-left-right me-1"></i>Movements
              </a>
            </li>

            <!-- Reports - manager and admin -->
            <li class="nav-item" *ngIf="authService.hasAnyRole('INVENTORY_MANAGER','ADMIN')">
              <a class="nav-link" routerLink="/reports" routerLinkActive="active">
                <i class="bi bi-bar-chart me-1"></i>Reports
              </a>
            </li>

            <li class="nav-item" *ngIf="authService.hasAnyRole('INVENTORY_MANAGER','ADMIN')">
              <a class="nav-link" routerLink="/docs" routerLinkActive="active">
                <i class="bi bi-journal-code me-1"></i>API Docs
              </a>
            </li>

          </ul>

          <!-- Right side: Alerts + User -->
          <ul class="navbar-nav">

            <!-- Alert Bell -->
            <li class="nav-item me-2">
              <a class="nav-link position-relative" routerLink="/alerts">
                <i class="bi bi-bell fs-5"></i>
                <span *ngIf="unreadCount > 0"
                      class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {{ unreadCount > 99 ? '99+' : unreadCount }}
                </span>
              </a>
            </li>

            <!-- User Dropdown -->
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle d-flex align-items-center gap-2"
                 href="#" role="button" data-bs-toggle="dropdown">
                <i class="bi bi-person-circle fs-5"></i>
                <span class="d-none d-lg-inline">{{ currentUser?.fullName }}</span>
                <span class="badge text-bg-secondary ms-1 d-none d-lg-inline">
                  {{ getRoleLabel() }}
                </span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><h6 class="dropdown-header">{{ currentUser?.email }}</h6></li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <button class="dropdown-item text-danger" (click)="logout()">
                    <i class="bi bi-box-arrow-right me-2"></i>Logout
                  </button>
                </li>
              </ul>
            </li>

          </ul>
        </div>
      </div>
    </nav>

    <!-- Page Content -->
    <main [class]="isLoggedIn ? 'container-fluid py-4 px-4' : ''">
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  private alertsSub?: Subscription;

  constructor(
    public readonly authService: AuthService,
    private readonly alertService: AlertService,
    private readonly router: Router
  ) {}

  private pollingInterval: any;

  ngOnInit(): void {
    if (this.isLoggedIn) {
      this.loadUnreadCount();
      this.startPolling();

      this.alertsSub = this.alertService.alertsChanged$.subscribe(() => {
        this.loadUnreadCount();
      });
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.alertsSub?.unsubscribe();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  loadUnreadCount(): void {
    this.alertService.getUnreadCount().subscribe({
      next: (res: any) => this.unreadCount = res.data ?? 0,
      error: () => {}
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      if (this.isLoggedIn) this.loadUnreadCount();
    }, 30000); // Poll every 30 seconds
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  getRoleLabel(): string {
    const map: Record<string, string> = {
      ADMIN: 'Admin',
      INVENTORY_MANAGER: 'Manager',
      PURCHASE_OFFICER: 'Officer',
      WAREHOUSE_STAFF: 'Staff'
    };
    return map[this.authService.getRole() ?? ''] ?? '';
  }

  logout(): void {
    this.authService.logout();
  }
}
