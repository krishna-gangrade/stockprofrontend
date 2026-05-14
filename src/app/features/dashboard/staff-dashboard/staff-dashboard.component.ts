import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { WarehouseService, AlertService } from '../../../core/services/api.services';
import { StockLevel } from '../../../core/models/models';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1">
          <i class="bi bi-person-workspace text-success me-2"></i>Warehouse Staff Dashboard
        </h2>
        <p class="text-muted mb-0">Welcome back, {{ currentUser?.fullName }}</p>
      </div>
      <span class="badge bg-success fs-6 px-3 py-2">Warehouse Staff</span>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm border-start border-warning border-3">
          <div class="card-body text-center">
            <i class="bi bi-exclamation-triangle text-warning fs-2 mb-2 d-block"></i>
            <h3 class="fw-bold mb-0">{{ lowStockItems.length }}</h3>
            <small class="text-muted">Low Stock Items</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm border-start border-danger border-3">
          <div class="card-body text-center">
            <i class="bi bi-bell text-danger fs-2 mb-2 d-block"></i>
            <h3 class="fw-bold mb-0">{{ unreadCount }}</h3>
            <small class="text-muted">Unread Alerts</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm border-start border-success border-3">
          <div class="card-body text-center">
            <i class="bi bi-arrow-left-right text-success fs-2 mb-2 d-block"></i>
            <a routerLink="/movements" class="text-decoration-none">
              <h3 class="fw-bold mb-0 text-dark">Record</h3>
              <small class="text-muted">Stock Movement</small>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="row g-3 mb-4">
      <div class="col-12"><h5 class="fw-semibold">Quick Actions</h5></div>
      <div class="col-md-3" *ngFor="let action of quickActions">
        <a [routerLink]="action.route"
           class="card border-0 shadow-sm text-decoration-none text-center p-3 d-block hover-lift">
          <i [class]="action.icon + ' fs-2 mb-2 d-block ' + action.color"></i>
          <small class="fw-semibold text-dark">{{ action.label }}</small>
        </a>
      </div>
    </div>

    <!-- Low Stock Items -->
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white border-0 py-3">
        <h6 class="fw-bold mb-0">
          <i class="bi bi-exclamation-triangle text-warning me-2"></i>
          Items Requiring Attention
        </h6>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Warehouse</th>
                <th class="text-center">Available</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of lowStockItems.slice(0,8)">
                <td class="fw-semibold small">{{ item.productName }}</td>
                <td><code class="small">{{ item.productSku }}</code></td>
                <td><small class="text-muted">{{ item.warehouseName }}</small></td>
                <td class="text-center">
                  <span class="badge bg-warning text-dark">{{ item.availableQuantity }}</span>
                </td>
                <td class="text-center">
                  <a routerLink="/movements" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-plus-circle me-1"></i>Record
                  </a>
                </td>
              </tr>
              <tr *ngIf="lowStockItems.length === 0">
                <td colspan="5" class="text-center text-muted py-4">
                  <i class="bi bi-check-circle text-success fs-4 d-block mb-2"></i>
                  All stock levels are healthy!
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.hover-lift:hover { transform: translateY(-2px); transition: .2s; }`]
})
export class StaffDashboardComponent implements OnInit {
  lowStockItems: StockLevel[] = [];
  unreadCount = 0;

  quickActions = [
    { label: 'Record Movement', route: '/movements',  icon: 'bi bi-arrow-left-right', color: 'text-primary' },
    { label: 'View Products',   route: '/products',   icon: 'bi bi-box',              color: 'text-success' },
    { label: 'Warehouses',      route: '/warehouses', icon: 'bi bi-building',         color: 'text-warning' },
    { label: 'My Alerts',       route: '/alerts',     icon: 'bi bi-bell',             color: 'text-danger'  },
  ];

  constructor(
    public readonly authService: AuthService,
    private readonly warehouseService: WarehouseService,
    private readonly alertService: AlertService
  ) {}

  get currentUser() { return this.authService.getCurrentUser(); }

  ngOnInit(): void {
    this.warehouseService.getLowStock().subscribe({ next: r => this.lowStockItems = r.data ?? [] });
    this.alertService.getUnreadCount().subscribe({ next: r => this.unreadCount = r.data ?? 0 });
  }
}
