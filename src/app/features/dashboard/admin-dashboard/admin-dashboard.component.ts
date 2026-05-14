import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReportService, WarehouseService, AlertService } from '../../../core/services/api.services';
import { StockValuation, UserResponse, UserRole, Warehouse } from '../../../core/models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1">
          <i class="bi bi-shield-check text-dark me-2"></i>Admin Dashboard
        </h2>
        <p class="text-muted mb-0">Welcome back, {{ currentUser?.fullName }}</p>
      </div>
      <span class="badge bg-dark fs-6 px-3 py-2">Administrator</span>
    </div>

    <!-- KPI Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <p class="text-muted small mb-1">Total Stock Value</p>
                <h4 class="fw-bold mb-0">
                  ₹{{ valuation?.totalValue | number:'1.0-0' }}
                </h4>
                <small class="text-muted">{{ valuation?.totalProducts }} products</small>
              </div>
              <div class="bg-success bg-opacity-10 rounded p-2">
                <i class="bi bi-currency-rupee text-success fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <p class="text-muted small mb-1">Active Warehouses</p>
                <h4 class="fw-bold mb-0">{{ activeWarehouses.length }}</h4>
                <small class="text-muted">{{ totalWarehouses }} total</small>
              </div>
              <div class="bg-primary bg-opacity-10 rounded p-2">
                <i class="bi bi-building text-primary fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <p class="text-muted small mb-1">Unread Alerts</p>
                <h4 class="fw-bold mb-0 text-danger">{{ unreadAlerts }}</h4>
                <small class="text-muted">system-wide</small>
              </div>
              <div class="bg-danger bg-opacity-10 rounded p-2">
                <i class="bi bi-bell text-danger fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <p class="text-muted small mb-1">Low Stock Items</p>
                <h4 class="fw-bold mb-0 text-warning">{{ lowStockCount }}</h4>
                <small class="text-muted">needs reorder</small>
              </div>
              <div class="bg-warning bg-opacity-10 rounded p-2">
                <i class="bi bi-exclamation-triangle text-warning fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="row g-3 mb-4">
      <div class="col-12">
        <h5 class="fw-semibold mb-3">Quick Actions</h5>
      </div>
      <div class="col-md-2" *ngFor="let action of quickActions">
        <a [routerLink]="action.route"
           class="card border-0 shadow-sm text-decoration-none text-center h-100 action-card">
          <div class="card-body py-4">
            <i [class]="action.icon + ' fs-3 mb-2 d-block ' + action.color"></i>
            <small class="fw-semibold text-dark">{{ action.label }}</small>
          </div>
        </a>
      </div>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
        <div>
          <h6 class="fw-bold mb-1">
            <i class="bi bi-people me-2 text-dark"></i>Employee Access Control
          </h6>
          <small class="text-muted">Promote, demote, and activate employees from one place.</small>
        </div>
        <span class="badge text-bg-dark">{{ users.length }} users</span>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Status</th>
                <th>Change Role</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users">
                <td>
                  <div class="fw-semibold">{{ user.fullName }}</div>
                  <small class="text-muted">ID #{{ user.userId }}</small>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="badge" [class]="getRoleBadge(user.role)">{{ getRoleLabel(user.role) }}</span>
                </td>
                <td>
                  <span class="badge" [class]="user.isActive ? 'text-bg-success' : 'text-bg-secondary'">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td style="min-width: 210px;">
                  <select class="form-select form-select-sm"
                          [ngModel]="roleSelections[user.userId]"
                          (ngModelChange)="roleSelections[user.userId] = $event">
                    <option *ngFor="let role of manageableRoles" [ngValue]="role">{{ getRoleLabel(role) }}</option>
                  </select>
                </td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary"
                            (click)="saveRole(user)"
                            [disabled]="savingUserId === user.userId || roleSelections[user.userId] === user.role">
                      Save
                    </button>
                    <button class="btn btn-outline-danger"
                            *ngIf="user.isActive"
                            (click)="deactivateUser(user)"
                            [disabled]="savingUserId === user.userId">
                      Deactivate
                    </button>
                    <button class="btn btn-outline-success"
                            *ngIf="!user.isActive"
                            (click)="reactivateUser(user)"
                            [disabled]="savingUserId === user.userId">
                      Reactivate
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="users.length === 0">
                <td colspan="6" class="text-center text-muted py-4">No users found</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="alert alert-danger mb-0 mt-3" *ngIf="userError">{{ userError }}</div>
      </div>
    </div>

    <!-- Warehouse Utilisation -->
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white border-0 py-3">
        <h6 class="fw-bold mb-0">
          <i class="bi bi-bar-chart me-2 text-primary"></i>Warehouse Utilisation
        </h6>
      </div>
      <div class="card-body">
        <div *ngFor="let wh of activeWarehouses" class="mb-3">
          <div class="d-flex justify-content-between mb-1">
            <span class="fw-semibold small">{{ wh.name }}</span>
            <span class="text-muted small">{{ wh.utilisationPercent }}%</span>
          </div>
          <div class="progress" style="height: 8px;">
            <div class="progress-bar"
                 [class]="getUtilBar(wh.utilisationPercent)"
                 [style.width]="wh.utilisationPercent + '%'"></div>
          </div>
        </div>
        <p *ngIf="activeWarehouses.length === 0" class="text-muted text-center py-3">
          No warehouses found
        </p>
      </div>
    </div>
  `,
  styles: [`.action-card:hover { transform: translateY(-2px); transition: transform .2s; }`]
})
export class AdminDashboardComponent implements OnInit {
  valuation: StockValuation | null = null;
  activeWarehouses: Warehouse[] = [];
  totalWarehouses = 0;
  unreadAlerts = 0;
  lowStockCount = 0;
  users: UserResponse[] = [];
  roleSelections: Record<number, UserRole> = {};
  savingUserId: number | null = null;
  userError = '';
  manageableRoles: UserRole[] = ['WAREHOUSE_STAFF', 'PURCHASE_OFFICER', 'INVENTORY_MANAGER', 'ADMIN'];

  quickActions = [
    { label: 'Products',       route: '/products',        icon: 'bi bi-box',            color: 'text-primary'   },
    { label: 'Warehouses',     route: '/warehouses',      icon: 'bi bi-building',       color: 'text-success'   },
    { label: 'Purchase Orders',route: '/purchase-orders', icon: 'bi bi-cart',           color: 'text-warning'   },
    { label: 'Suppliers',      route: '/suppliers',       icon: 'bi bi-truck',          color: 'text-info'      },
    { label: 'Movements',      route: '/movements',       icon: 'bi bi-arrow-left-right',color: 'text-secondary'},
    { label: 'Reports',        route: '/reports',         icon: 'bi bi-bar-chart',      color: 'text-danger'    },
    { label: 'API Docs',       route: '/docs',            icon: 'bi bi-journal-code',   color: 'text-dark'      },
  ];

  constructor(
    public readonly authService: AuthService,
    private readonly reportService: ReportService,
    private readonly warehouseService: WarehouseService,
    private readonly alertService: AlertService
  ) {}

  get currentUser() { return this.authService.getCurrentUser(); }

  ngOnInit(): void {
    this.reportService.getTotalStockValue().subscribe({
      next: r => this.valuation = r.data
    });
    this.warehouseService.getAll().subscribe({
      next: r => {
        this.totalWarehouses = r.data?.length ?? 0;
        this.activeWarehouses = (r.data ?? []).filter(w => w.isActive);
      }
    });
    this.alertService.getUnreadCount().subscribe({
      next: r => this.unreadAlerts = r.data ?? 0
    });
    this.warehouseService.getLowStock().subscribe({
      next: r => this.lowStockCount = r.data?.length ?? 0
    });
    this.loadUsers();
  }

  getUtilBar(pct: number): string {
    if (pct >= 90) return 'bg-danger';
    if (pct >= 70) return 'bg-warning';
    return 'bg-success';
  }

  loadUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: r => {
        this.users = r.data ?? [];
        this.roleSelections = {};
        for (const user of this.users) {
          this.roleSelections[user.userId] = user.role;
        }
      },
      error: err => {
        this.userError = err?.error?.message || 'Unable to load users';
      }
    });
  }

  saveRole(user: UserResponse): void {
    const nextRole = this.roleSelections[user.userId];
    if (!nextRole || nextRole === user.role) return;
    this.savingUserId = user.userId;
    this.userError = '';
    this.authService.updateUserByAdmin(user.userId, { role: nextRole, isActive: user.isActive }).subscribe({
      next: () => {
        this.savingUserId = null;
        this.loadUsers();
      },
      error: err => {
        this.savingUserId = null;
        this.userError = err?.error?.message || 'Unable to update user role';
      }
    });
  }

  deactivateUser(user: UserResponse): void {
    this.savingUserId = user.userId;
    this.userError = '';
    this.authService.deactivateUser(user.userId).subscribe({
      next: () => {
        this.savingUserId = null;
        this.loadUsers();
      },
      error: err => {
        this.savingUserId = null;
        this.userError = err?.error?.message || 'Unable to deactivate user';
      }
    });
  }

  reactivateUser(user: UserResponse): void {
    this.savingUserId = user.userId;
    this.userError = '';
    this.authService.updateUserByAdmin(user.userId, { isActive: true, role: this.roleSelections[user.userId] || user.role }).subscribe({
      next: () => {
        this.savingUserId = null;
        this.loadUsers();
      },
      error: err => {
        this.savingUserId = null;
        this.userError = err?.error?.message || 'Unable to reactivate user';
      }
    });
  }

  getRoleLabel(role: UserRole): string {
    const map: Record<UserRole, string> = {
      ADMIN: 'Administrator',
      INVENTORY_MANAGER: 'Inventory Manager',
      PURCHASE_OFFICER: 'Purchase Officer',
      WAREHOUSE_STAFF: 'Warehouse Staff'
    };
    return map[role];
  }

  getRoleBadge(role: UserRole): string {
    const map: Record<UserRole, string> = {
      ADMIN: 'text-bg-dark',
      INVENTORY_MANAGER: 'text-bg-primary',
      PURCHASE_OFFICER: 'text-bg-warning',
      WAREHOUSE_STAFF: 'text-bg-secondary'
    };
    return map[role];
  }
}
