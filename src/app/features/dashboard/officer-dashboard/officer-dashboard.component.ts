import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PurchaseOrderService, SupplierService } from '../../../core/services/api.services';
import { PurchaseOrder, Supplier } from '../../../core/models/models';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1">
          <i class="bi bi-cart-check text-warning me-2"></i>Purchase Officer Dashboard
        </h2>
        <p class="text-muted mb-0">Welcome back, {{ currentUser?.fullName }}</p>
      </div>
      <span class="badge bg-warning text-dark fs-6 px-3 py-2">Purchase Officer</span>
    </div>

    <!-- KPI Row -->
    <div class="row g-3 mb-4">
      <div class="col-md-3" *ngFor="let stat of stats">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <i [class]="stat.icon + ' fs-2 mb-2 d-block ' + stat.color"></i>
            <h4 class="fw-bold mb-0">{{ stat.value }}</h4>
            <small class="text-muted">{{ stat.label }}</small>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <!-- Pending POs -->
      <div class="col-md-7">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-0 py-3 d-flex justify-content-between">
            <h6 class="fw-bold mb-0">
              <i class="bi bi-hourglass-split text-warning me-2"></i>Pending Approval
            </h6>
            <a routerLink="/purchase-orders" class="btn btn-sm btn-outline-dark">
              <i class="bi bi-plus me-1"></i>New PO
            </a>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Reference</th>
                    <th>Supplier</th>
                    <th>Warehouse</th>
                    <th class="text-end">Amount</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let po of pendingPOs.slice(0,5)">
                    <td><code class="small">{{ po.referenceNumber || '#' + po.id }}</code></td>
                    <td><small>{{ po.supplierName }}</small></td>
                    <td><small class="text-muted">{{ po.warehouseName }}</small></td>
                    <td class="text-end fw-semibold small">₹{{ po.totalAmount | number:'1.0-0' }}</td>
                    <td class="text-center">
                      <span class="badge bg-warning text-dark">{{ po.status }}</span>
                    </td>
                  </tr>
                  <tr *ngIf="pendingPOs.length === 0">
                    <td colspan="5" class="text-center text-muted py-3">
                      <i class="bi bi-check-circle text-success me-1"></i>No pending approvals
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Suppliers -->
      <div class="col-md-5">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-0 py-3">
            <h6 class="fw-bold mb-0">
              <i class="bi bi-star text-warning me-2"></i>Top Rated Suppliers
            </h6>
          </div>
          <div class="card-body p-0">
            <ul class="list-group list-group-flush">
              <li *ngFor="let s of topSuppliers" class="list-group-item d-flex justify-content-between align-items-center py-3">
                <div>
                  <div class="fw-semibold small">{{ s.name }}</div>
                  <small class="text-muted">{{ s.city }}, {{ s.country }}</small>
                </div>
                <div class="text-end">
                  <div class="text-warning small">
                    <i class="bi bi-star-fill" *ngFor="let i of [1,2,3,4,5]; let idx = index"
                       [class.text-secondary]="idx >= s.rating"></i>
                  </div>
                  <small class="text-muted">{{ s.rating | number:'1.1-1' }}</small>
                </div>
              </li>
              <li *ngIf="topSuppliers.length === 0" class="list-group-item text-center text-muted py-3">
                No suppliers yet
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OfficerDashboardComponent implements OnInit {
  pendingPOs:   PurchaseOrder[] = [];
  overduePOs:   PurchaseOrder[] = [];
  topSuppliers: Supplier[]      = [];
  totalPOs = 0;

  get stats() {
    return [
      { label: 'Pending Approval', value: this.pendingPOs.length, icon: 'bi bi-hourglass-split', color: 'text-warning' },
      { label: 'Overdue POs',      value: this.overduePOs.length, icon: 'bi bi-alarm',           color: 'text-danger'  },
      { label: 'Total POs',        value: this.totalPOs,           icon: 'bi bi-cart',            color: 'text-primary' },
      { label: 'Suppliers',        value: this.topSuppliers.length, icon: 'bi bi-truck',          color: 'text-success' },
    ];
  }

  constructor(
    public readonly authService: AuthService,
    private readonly poService: PurchaseOrderService,
    private readonly supplierService: SupplierService
  ) {}

  get currentUser() { return this.authService.getCurrentUser(); }

  ngOnInit(): void {
    this.poService.getByStatus('PENDING').subscribe({ next: r => this.pendingPOs = r.data ?? [] });
    this.poService.getOverdue().subscribe({ next: r => this.overduePOs = r.data ?? [] });
    this.poService.getAll().subscribe({ next: r => this.totalPOs = r.data?.length ?? 0 });
    this.supplierService.getTopRated().subscribe({ next: r => this.topSuppliers = (r.data ?? []).slice(0, 5) });
  }
}
