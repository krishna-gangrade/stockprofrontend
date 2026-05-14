import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarehouseService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { Warehouse, WarehouseRequest, StockLevel } from '../../../core/models/models';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1">
          <i class="bi bi-building text-success me-2"></i>Warehouses
        </h2>
        <p class="text-muted mb-0">{{ warehouses.length }} warehouses</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-warning btn-sm" (click)="loadLowStock()">
          <i class="bi bi-exclamation-triangle me-1"></i>Low Stock
          <span class="badge bg-warning text-dark ms-1">{{ lowStockCount }}</span>
        </button>
        <button class="btn btn-dark" (click)="openModal()"
                *ngIf="authService.isAdmin()">
          <i class="bi bi-plus-lg me-2"></i>Add Warehouse
        </button>
      </div>
    </div>

    <div class="alert shadow-sm border-0 d-flex align-items-center gap-2"
         *ngIf="pageMessage"
         [class.alert-success]="pageMessageType === 'success'"
         [class.alert-danger]="pageMessageType === 'error'">
      <i class="bi" [class.bi-check-circle-fill]="pageMessageType === 'success'" [class.bi-x-circle-fill]="pageMessageType === 'error'"></i>
      <span>{{ pageMessage }}</span>
    </div>

    <div class="loading-overlay" *ngIf="loading">
      <div class="spinner-border text-success"></div>
    </div>

    <!-- Warehouse Cards -->
    <div class="row g-3 mb-4" *ngIf="!loading && !showStock">
      <div class="col-md-4" *ngFor="let wh of warehouses">
        <div class="card border-0 shadow-sm h-100 hover-lift">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 class="fw-bold mb-1">{{ wh.name }}</h5>
                <small class="text-muted">
                  <i class="bi bi-geo-alt me-1"></i>{{ wh.location }}
                </small>
              </div>
              <span class="badge" [class]="wh.isActive ? 'bg-success' : 'bg-secondary'">
                {{ wh.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <!-- Utilisation Bar -->
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <small class="text-muted">Capacity Utilisation</small>
                <small class="fw-semibold">{{ wh.utilisationPercent }}%</small>
              </div>
              <div class="progress" style="height:8px">
                <div class="progress-bar"
                     [class]="getUtilBar(wh.utilisationPercent)"
                     [style.width]="wh.utilisationPercent + '%'"></div>
              </div>
              <div class="d-flex justify-content-between mt-1">
                <small class="text-muted">{{ wh.usedCapacity }} used</small>
                <small class="text-muted">{{ wh.capacity }} total</small>
              </div>
            </div>

            <!-- Actions -->
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary flex-grow-1"
                      (click)="viewStock(wh)">
                <i class="bi bi-box me-1"></i>View Stock
              </button>
              <button class="btn btn-sm btn-outline-secondary" (click)="openModal(wh)"
                      *ngIf="authService.isAdmin()" title="Edit">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" (click)="deactivate(wh)"
                      *ngIf="wh.isActive && authService.isAdmin()" title="Deactivate">
                <i class="bi bi-pause-circle"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12" *ngIf="warehouses.length === 0">
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5 text-muted">
            <i class="bi bi-building fs-1 d-block mb-2"></i>No warehouses found
          </div>
        </div>
      </div>
    </div>

    <!-- Stock Level Table -->
    <div *ngIf="showStock && selectedWarehouse" class="card border-0 shadow-sm">
      <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
        <h6 class="fw-bold mb-0">
          <i class="bi bi-box me-2 text-primary"></i>
          Stock — {{ selectedWarehouse.name }}
        </h6>
        <button class="btn btn-sm btn-outline-secondary" (click)="showStock = false">
          <i class="bi bi-arrow-left me-1"></i>Back to Warehouses
        </button>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th class="text-center">Total Qty</th>
              <th class="text-center">Reserved</th>
              <th class="text-center">Available</th>
              <th>Bin Location</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let sl of stockLevels">
              <td class="fw-semibold small">{{ sl.productName }}</td>
              <td><code class="small">{{ sl.productSku }}</code></td>
              <td class="text-center fw-bold">{{ sl.quantity }}</td>
              <td class="text-center text-warning">{{ sl.reservedQuantity }}</td>
              <td class="text-center">
                <span class="badge"
                      [class]="sl.availableQuantity > 0 ? 'bg-success' : 'bg-danger'">
                  {{ sl.availableQuantity }}
                </span>
              </td>
              <td><small class="text-muted">{{ sl.binLocation || '—' }}</small></td>
              <td><small class="text-muted">{{ sl.lastUpdated | date:'dd MMM HH:mm' }}</small></td>
            </tr>
            <tr *ngIf="stockLevels.length === 0">
              <td colspan="7" class="text-center text-muted py-4">
                No stock records for this warehouse
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Low Stock Panel -->
    <div *ngIf="showLowStock" class="card border-0 shadow-sm">
      <div class="card-header bg-warning border-0 py-3 d-flex justify-content-between">
        <h6 class="fw-bold mb-0">
          <i class="bi bi-exclamation-triangle me-2"></i>Low Stock Items ({{ lowStockItems.length }})
        </h6>
        <button class="btn btn-sm btn-outline-dark" (click)="showLowStock = false">
          <i class="bi bi-x"></i>
        </button>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr><th>Product</th><th>Warehouse</th><th class="text-center">Available</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let sl of lowStockItems">
              <td>
                <div class="fw-semibold small">{{ sl.productName }}</div>
                <code class="small text-muted">{{ sl.productSku }}</code>
              </td>
              <td><small>{{ sl.warehouseName }}</small></td>
              <td class="text-center">
                <span class="badge bg-warning text-dark">{{ sl.availableQuantity }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade show" *ngIf="showModal || showConfirmModal" (click)="closeModal()"></div>

    <!-- Create/Edit Warehouse Modal -->
    <div class="modal show d-block" *ngIf="showModal" tabindex="-1">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">
              <i class="bi bi-building me-2"></i>{{ editing ? 'Edit Warehouse' : 'Add Warehouse' }}
            </h5>
            <button class="btn-close btn-close-white" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label fw-semibold">Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.name">
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Location <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.location" placeholder="City, State">
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Address</label>
                <textarea class="form-control" rows="2" [(ngModel)]="form.address"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Capacity</label>
                <input type="number" class="form-control" [(ngModel)]="form.capacity" min="1">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Phone</label>
                <input type="text" class="form-control" [(ngModel)]="form.phone">
              </div>
              <div class="col-12" *ngIf="editing">
                <div class="form-check form-switch mt-2">
                  <input class="form-check-input" type="checkbox" id="whActive" [(ngModel)]="form.isActive">
                  <label class="form-check-label fw-semibold" for="whActive">
                    Active Status
                  </label>
                  <div class="form-text">Inactive warehouses are hidden from new orders and movements.</div>
                </div>
              </div>
            </div>
            <div class="alert alert-danger mt-3" *ngIf="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-dark" (click)="save()" [disabled]="saving">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="saving"></span>
              {{ editing ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal show d-block" *ngIf="showConfirmModal" tabindex="-1">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title"><i class="bi bi-patch-question me-2"></i>Deactivate Warehouse</h5>
            <button class="btn-close btn-close-white" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">{{ confirmMessage }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-dark" (click)="confirmDeactivate()" [disabled]="saving">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="saving"></span>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.hover-lift:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.1) !important; transition: .2s; }`]
})
export class WarehouseListComponent implements OnInit {
  warehouses:    Warehouse[]  = [];
  stockLevels:   StockLevel[] = [];
  lowStockItems: StockLevel[] = [];

  loading      = false;
  saving       = false;
  showModal    = false;
  showConfirmModal = false;
  showStock    = false;
  showLowStock = false;
  editing      = false;
  editingId: number | null = null;
  formError    = '';
  selectedWarehouse: Warehouse | null = null;
  lowStockCount = 0;
  pendingWarehouse: Warehouse | null = null;
  confirmMessage = '';
  pageMessage = '';
  pageMessageType: 'success' | 'error' = 'success';

  form: WarehouseRequest = this.emptyForm();

  constructor(
    private readonly warehouseService: WarehouseService,
    public readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
    this.warehouseService.getLowStock().subscribe({
      next: r => this.lowStockCount = r.data?.length ?? 0
    });
  }

  load(): void {
    this.loading = true;
    this.warehouseService.getAll().subscribe({
      next: r => { this.warehouses = r.data ?? []; this.loading = false; },
      error: () => this.loading = false
    });
  }

  viewStock(wh: Warehouse): void {
    this.selectedWarehouse = wh;
    this.showStock = true;
    this.showLowStock = false;
    this.warehouseService.getStockByWarehouse(wh.id).subscribe({
      next: r => this.stockLevels = r.data ?? []
    });
  }

  loadLowStock(): void {
    this.showLowStock = !this.showLowStock;
    this.showStock = false;
    if (this.showLowStock) {
      this.warehouseService.getLowStock().subscribe({
        next: r => { this.lowStockItems = r.data ?? []; this.lowStockCount = this.lowStockItems.length; }
      });
    }
  }

  openModal(wh?: Warehouse): void {
    this.editing   = !!wh;
    this.editingId = wh?.id ?? null;
    this.formError = '';
    this.form      = wh ? { name: wh.name, location: wh.location, address: wh.address, managerId: wh.managerId, capacity: wh.capacity, phone: wh.phone, isActive: wh.isActive } : this.emptyForm();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.showConfirmModal = false;
    this.pendingWarehouse = null;
    this.confirmMessage = '';
  }

  save(): void {
    const validationMessage = this.validateForm();
    if (validationMessage) { this.formError = validationMessage; return; }
    this.saving = true; this.formError = '';
    const req$ = this.editing && this.editingId
      ? this.warehouseService.update(this.editingId, this.form)
      : this.warehouseService.create(this.form);
    req$.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.load(); },
      error: err => { this.saving = false; this.formError = err.error?.message || 'Save failed'; }
    });
  }

  deactivate(wh: Warehouse): void {
    this.pendingWarehouse = wh;
    this.confirmMessage = `Deactivate "${wh.name}"?`;
    this.showConfirmModal = true;
  }

  confirmDeactivate(): void {
    if (!this.pendingWarehouse) return;
    this.saving = true;
    this.warehouseService.deactivate(this.pendingWarehouse.id).subscribe({
      next: () => {
        const warehouseName = this.pendingWarehouse?.name;
        this.saving = false;
        this.closeModal();
        this.setPageMessage('success', `"${warehouseName}" deactivated successfully.`);
        this.load();
      },
      error: err => {
        this.saving = false;
        this.setPageMessage('error', err?.error?.message || 'Deactivate failed');
      }
    });
  }

  getUtilBar(pct: number): string {
    if (pct >= 90) return 'bg-danger';
    if (pct >= 70) return 'bg-warning';
    return 'bg-success';
  }

  emptyForm(): WarehouseRequest {
    return { name: '', location: '', address: '', managerId: undefined, capacity: 1000, phone: '', isActive: true };
  }

  private validateForm(): string {
    if (!this.form.name.trim() || !this.form.location.trim()) {
      return 'Name and location are required';
    }
    if (this.form.capacity < 1) {
      return 'Capacity must be at least 1';
    }
    return '';
  }

  private setPageMessage(type: 'success' | 'error', message: string): void {
    this.pageMessageType = type;
    this.pageMessage = message;
  }
}
