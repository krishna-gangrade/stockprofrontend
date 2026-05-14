import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReportService, WarehouseService, AlertService } from '../../../core/services/api.services';
import { StockLevel, TopMovingProduct } from '../../../core/models/models';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1">
          <i class="bi bi-clipboard-data text-primary me-2"></i>Inventory Manager Dashboard
        </h2>
        <p class="text-muted mb-0">Welcome back, {{ currentUser?.fullName }}</p>
      </div>
      <span class="badge bg-primary fs-6 px-3 py-2">Inventory Manager</span>
    </div>

    <div class="row g-3 mb-4">
      <!-- Low Stock Card -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm border-start border-warning border-3 h-100">
          <div class="card-body">
            <p class="text-muted small mb-1">Low Stock Items</p>
            <h3 class="fw-bold text-warning mb-1">{{ lowStockItems.length }}</h3>
            <a routerLink="/warehouses" class="small text-decoration-none">
              View all <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Overstock Card -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm border-start border-danger border-3 h-100">
          <div class="card-body">
            <p class="text-muted small mb-1">Overstock Items</p>
            <h3 class="fw-bold text-danger mb-1">{{ overstockItems.length }}</h3>
            <a routerLink="/warehouses" class="small text-decoration-none">
              View all <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Unread Alerts Card -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm border-start border-info border-3 h-100">
          <div class="card-body">
            <p class="text-muted small mb-1">Unread Alerts</p>
            <h3 class="fw-bold text-info mb-1">{{ unreadAlerts }}</h3>
            <a routerLink="/alerts" class="small text-decoration-none">
              View alerts <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <!-- Low Stock Table -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-0 py-3">
            <h6 class="fw-bold mb-0">
              <i class="bi bi-exclamation-triangle text-warning me-2"></i>Low Stock Alert
            </h6>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Product</th>
                    <th>Warehouse</th>
                    <th class="text-center">Available</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of lowStockItems.slice(0,6)">
                    <td>
                      <div class="fw-semibold small">{{ item.productName }}</div>
                      <div class="text-muted" style="font-size:11px">{{ item.productSku }}</div>
                    </td>
                    <td><small class="text-muted">{{ item.warehouseName }}</small></td>
                    <td class="text-center">
                      <span class="badge bg-warning text-dark">{{ item.availableQuantity }}</span>
                    </td>
                  </tr>
                  <tr *ngIf="lowStockItems.length === 0">
                    <td colspan="3" class="text-center text-muted py-3">
                      <i class="bi bi-check-circle text-success me-2"></i>All stock levels healthy
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Moving Products -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-0 py-3 d-flex justify-content-between">
            <h6 class="fw-bold mb-0">
              <i class="bi bi-graph-up text-success me-2"></i>Top Moving Products
            </h6>
            <a routerLink="/reports" class="small text-decoration-none">Full Report</a>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th class="text-center">Units Moved</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of topMoving">
                    <td><span class="badge bg-secondary">{{ p.rank }}</span></td>
                    <td>
                      <div class="fw-semibold small">{{ p.productName }}</div>
                      <div class="text-muted" style="font-size:11px">{{ p.category }}</div>
                    </td>
                    <td class="text-center fw-bold">{{ p.totalUnitsMoved }}</td>
                  </tr>
                  <tr *ngIf="topMoving.length === 0">
                    <td colspan="3" class="text-center text-muted py-3">No movement data yet</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ManagerDashboardComponent implements OnInit {
  lowStockItems:  StockLevel[]         = [];
  overstockItems: StockLevel[]         = [];
  topMoving:      TopMovingProduct[]   = [];
  unreadAlerts  = 0;

  constructor(
    public readonly authService: AuthService,
    private readonly warehouseService: WarehouseService,
    private readonly reportService: ReportService,
    private readonly alertService: AlertService
  ) {}

  get currentUser() { return this.authService.getCurrentUser(); }

  ngOnInit(): void {
    this.warehouseService.getLowStock().subscribe({ next: r => this.lowStockItems  = r.data ?? [] });
    this.warehouseService.getOverstock().subscribe({ next: r => this.overstockItems = r.data ?? [] });
    this.reportService.getTopMoving(5).subscribe({ next: r => this.topMoving = r.data ?? [] });
    this.alertService.getUnreadCount().subscribe({ next: r => this.unreadAlerts = r.data ?? 0 });
  }
}
