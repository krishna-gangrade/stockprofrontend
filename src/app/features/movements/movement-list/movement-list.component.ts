import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovementService, PaymentService, ProductService, PurchaseOrderService, WarehouseService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { MovementRequest, MovementType, Product, PurchaseOrder, StockMovement, SupplierReturnAdjustmentAction, Warehouse } from '../../../core/models/models';

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1">
          <i class="bi bi-arrow-left-right text-secondary me-2"></i>Stock Movements
        </h2>
        <p class="text-muted mb-0">Immutable audit trail — {{ filtered.length }} records</p>
      </div>
      <button class="btn btn-dark" (click)="openModal()"
              *ngIf="authService.hasAnyRole('WAREHOUSE_STAFF','INVENTORY_MANAGER','ADMIN')">
        <i class="bi bi-plus-lg me-2"></i>Record Movement
      </button>
    </div>

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="row g-2">
          <div class="col-md-4">
            <select class="form-select" [(ngModel)]="typeFilter" (ngModelChange)="applyFilter()">
              <option value="">All Types</option>
              <option *ngFor="let t of movementTypes" [value]="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="warehouseFilter" (ngModelChange)="applyFilter()">
              <option value="">All Warehouses</option>
              <option *ngFor="let w of warehouses" [value]="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <input type="text" class="form-control" placeholder="Search product..."
                   [(ngModel)]="productFilter" (ngModelChange)="applyFilter()">
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-secondary w-100" (click)="clearFilter()">
              <i class="bi bi-x-circle me-1"></i>Clear
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-overlay" *ngIf="loading">
      <div class="spinner-border text-secondary"></div>
    </div>

    <div class="card border-0 shadow-sm" *ngIf="!loading">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Product</th>
              <th>Warehouse / Flow</th>
              <th class="text-center">Quantity</th>
              <th class="text-center">Balance After</th>
              <th>Performed By</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of filtered">
              <td>
                <small class="fw-semibold">{{ m.movementDate | date:'dd MMM yyyy' }}</small>
                <br><small class="text-muted">{{ m.movementDate | date:'HH:mm:ss' }}</small>
              </td>
              <td>
                <span class="badge" [class]="getTypeBadge(m.movementType)">
                  <i [class]="getTypeIcon(m.movementType) + ' me-1'"></i>
                  {{ getMovementLabel(m) }}
                </span>
              </td>
              <td>
                <div class="fw-semibold small">{{ m.productName }}</div>
                <code class="small text-muted">{{ m.productSku }}</code>
              </td>
              <td>
                <div><small>{{ m.warehouseName }}</small></div>
                <small class="text-muted" *ngIf="isTransfer(m.movementType) && getTransferFlow(m)">{{ getTransferFlow(m) }}</small>
              </td>
              <td class="text-center">
                <span class="fw-bold" [class]="isInbound(m) ? 'text-success' : 'text-danger'">
                  {{ isInbound(m) ? '+' : '-' }}{{ m.quantity }}
                </span>
              </td>
              <td class="text-center">
                <span class="badge bg-light text-dark border fw-bold">{{ m.balanceAfter }}</span>
              </td>
              <td><small class="text-muted">{{ m.performedByName }}</small></td>
              <td><small class="text-muted">{{ m.notes || '—' }}</small></td>
            </tr>
            <tr *ngIf="filtered.length === 0">
              <td colspan="8" class="text-center text-muted py-5">
                <i class="bi bi-arrow-left-right fs-1 d-block mb-2 text-secondary"></i>No movements found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Record Movement Modal -->
    <div class="modal-backdrop fade show" *ngIf="showModal" (click)="closeModal()"></div>
    <div class="modal show d-block" *ngIf="showModal" tabindex="-1">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title"><i class="bi bi-arrow-left-right me-2"></i>Record Stock Movement</h5>
            <button class="btn-close btn-close-white" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info d-flex align-items-center gap-2 mb-3">
              <i class="bi bi-info-circle-fill"></i>
              <small>Movements are <strong>immutable</strong>. Corrections require a new opposing movement.</small>
            </div>
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label fw-semibold">Movement Type <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="form.movementType">
                  <option value="">Select type...</option>
                  <option *ngFor="let t of formMovementTypes" [value]="t.value">{{ t.label }}</option>
                </select>
              </div>
              <div class="col-12" *ngIf="isReturn(form.movementType)">
                <label class="form-label fw-semibold">Return Flow <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="returnFlow">
                  <option value="">Select return flow...</option>
                  <option value="CUSTOMER_RETURN">Customer Return (stock comes back)</option>
                  <option value="SUPPLIER_RETURN">Supplier Return (stock goes back out)</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Product <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="form.productId">
                  <option value="">Select product...</option>
                  <option *ngFor="let p of products" [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                </select>
              </div>
              <div class="col-12" *ngIf="!isTransfer(form.movementType)">
                <label class="form-label fw-semibold">{{ getWarehouseLabel() }} <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="form.warehouseId">
                  <option value="">Select warehouse...</option>
                  <option *ngFor="let w of warehouses" [value]="w.id">{{ w.name }}</option>
                </select>
              </div>
              <div class="col-md-6" *ngIf="isTransfer(form.movementType)">
                <label class="form-label fw-semibold">From Warehouse <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="form.fromWarehouseId">
                  <option value="">Select source warehouse...</option>
                  <option *ngFor="let w of warehouses" [value]="w.id">{{ w.name }}</option>
                </select>
              </div>
              <div class="col-md-6" *ngIf="isTransfer(form.movementType)">
                <label class="form-label fw-semibold">To Warehouse <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="form.toWarehouseId">
                  <option value="">Select destination warehouse...</option>
                  <option *ngFor="let w of warehouses" [value]="w.id">{{ w.name }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Quantity <span class="text-danger">*</span></label>
                <input type="number" class="form-control" [(ngModel)]="form.quantity" min="1">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">{{ getUnitCostLabel() }}</label>
                <input type="number" class="form-control" [(ngModel)]="form.unitCost" min="0" step="0.01">
              </div>
              <div class="col-12" *ngIf="isSupplierReturnSelected()">
                <label class="form-label fw-semibold">Purchase Order <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="supplierReturnPurchaseOrderId">
                  <option [ngValue]="0">Select purchase order...</option>
                  <option *ngFor="let po of supplierReturnOrders" [ngValue]="po.id">
                    PO #{{ po.id }} - {{ po.supplierName }} - ₹{{ po.totalAmount | number:'1.0-0' }}
                  </option>
                </select>
              </div>
              <div class="col-md-6" *ngIf="isSupplierReturnSelected()">
                <label class="form-label fw-semibold">Payment Handling</label>
                <select class="form-select" [(ngModel)]="supplierReturnAction">
                  <option value="">Stock only (no payment change)</option>
                  <option value="REDUCE_PAYABLE">Reduce supplier payable</option>
                  <option value="RECORD_SUPPLIER_REFUND">Record supplier refund received</option>
                </select>
              </div>
              <div class="col-md-6" *ngIf="isSupplierReturnSelected()">
                <label class="form-label fw-semibold">Supplier Return Amount (₹)</label>
                <input type="number" class="form-control" [(ngModel)]="supplierReturnAmount" min="0" step="0.01">
              </div>
              <div class="col-md-6" *ngIf="isCustomerReturnSelected()">
                <label class="form-label fw-semibold">Customer Refund Amount (₹)</label>
                <input type="number" class="form-control" [(ngModel)]="customerRefundAmount" min="0" step="0.01">
              </div>
              <div class="col-12" *ngIf="isCustomerReturnSelected() && customerRefundAmount > 0">
                <div class="alert alert-warning small mb-0">
                  This project does not have a customer billing module yet, so the refund will be recorded in the movement notes only.
                </div>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Notes</label>
                <textarea class="form-control" rows="2" [(ngModel)]="form.notes" placeholder="Reason or reference..."></textarea>
              </div>
            </div>
            <div class="alert alert-danger mt-3" *ngIf="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-dark" (click)="record()" [disabled]="saving">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="saving"></span>
              Record Movement
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MovementListComponent implements OnInit {
  movements: StockMovement[] = [];
  filtered:  StockMovement[] = [];
  products:  Product[]   = [];
  warehouses: Warehouse[] = [];
  purchaseOrders: PurchaseOrder[] = [];

  typeFilter      = '';
  warehouseFilter: number | '' = '';
  productFilter   = '';

  loading   = false;
  saving    = false;
  showModal = false;
  formError = '';

  form: MovementRequest = this.emptyForm();
  returnFlow: '' | 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN' = '';
  supplierReturnPurchaseOrderId = 0;
  supplierReturnAction: '' | SupplierReturnAdjustmentAction = '';
  supplierReturnAmount = 0;
  customerRefundAmount = 0;

  movementTypes = [
    { value: 'STOCK_IN',      label: 'Stock In (GRN)'        },
    { value: 'STOCK_OUT',     label: 'Stock Out (Issue)'      },
    { value: 'TRANSFER_IN',   label: 'Transfer In'            },
    { value: 'TRANSFER_OUT',  label: 'Transfer Out'           },
    { value: 'ADJUSTMENT',    label: 'Adjustment (Correction)'},
    { value: 'WRITE_OFF',     label: 'Write-Off (Damage/Expiry)' },
    { value: 'RETURN',        label: 'Return'                 },
  ];

  formMovementTypes = [
    { value: 'STOCK_IN',      label: 'Stock In (GRN)' },
    { value: 'STOCK_OUT',     label: 'Stock Out (Issue)' },
    { value: 'TRANSFER_OUT',  label: 'Transfer Between Warehouses' },
    { value: 'ADJUSTMENT',    label: 'Adjustment (Correction)' },
    { value: 'WRITE_OFF',     label: 'Write-Off (Damage/Expiry)' },
    { value: 'RETURN',        label: 'Return' },
  ];

  constructor(
    private readonly movementService: MovementService,
    private readonly paymentService: PaymentService,
    private readonly productService: ProductService,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly warehouseService: WarehouseService,
    public readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
    this.productService.getActive().subscribe({ next: r => this.products   = r.data ?? [] });
    this.purchaseOrderService.getAll().subscribe({ next: r => this.purchaseOrders = r.data ?? [] });
    this.warehouseService.getActive().subscribe({ next: r => this.warehouses = r.data ?? [] });
  }

  load(): void {
    this.loading = true;
    this.movementService.getAll().subscribe({
      next: r => {
        this.movements = (r.data ?? []).sort((a, b) =>
          new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime());
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    this.filtered = this.movements.filter(m => {
      const matchType = !this.typeFilter || m.movementType === this.typeFilter;
      const matchWh   = !this.warehouseFilter || m.warehouseId === +this.warehouseFilter;
      const kw = this.productFilter.toLowerCase();
      const matchProd = !kw || m.productName.toLowerCase().includes(kw) || m.productSku.toLowerCase().includes(kw);
      return matchType && matchWh && matchProd;
    });
  }

  clearFilter(): void { this.typeFilter = ''; this.warehouseFilter = ''; this.productFilter = ''; this.applyFilter(); }

  isInbound(movement: Pick<StockMovement, 'movementType' | 'referenceType'>): boolean {
    if (movement.movementType === 'RETURN') {
      return movement.referenceType !== 'SUPPLIER_RETURN';
    }
    return ['STOCK_IN', 'TRANSFER_IN', 'ADJUSTMENT'].includes(movement.movementType);
  }

  getTypeBadge(type: MovementType): string {
    const map: Record<string, string> = {
      STOCK_IN: 'bg-success', STOCK_OUT: 'bg-danger', TRANSFER_IN: 'bg-info text-dark',
      TRANSFER_OUT: 'bg-primary', ADJUSTMENT: 'bg-warning text-dark', WRITE_OFF: 'bg-dark', RETURN: 'bg-secondary'
    };
    return map[type] ?? 'bg-secondary';
  }

  getTypeIcon(type: MovementType): string {
    const map: Record<string, string> = {
      STOCK_IN: 'bi bi-box-arrow-in-down', STOCK_OUT: 'bi bi-box-arrow-up',
      TRANSFER_IN: 'bi bi-arrow-down-circle', TRANSFER_OUT: 'bi bi-arrow-up-circle',
      ADJUSTMENT: 'bi bi-sliders', WRITE_OFF: 'bi bi-trash', RETURN: 'bi bi-arrow-return-left'
    };
    return map[type] ?? 'bi bi-arrow-left-right';
  }

  isTransfer(type: MovementType | ''): boolean {
    return type === 'TRANSFER_IN' || type === 'TRANSFER_OUT';
  }

  isReturn(type: MovementType | ''): boolean {
    return type === 'RETURN';
  }

  isSupplierReturnSelected(): boolean {
    return this.isReturn(this.form.movementType) && this.returnFlow === 'SUPPLIER_RETURN';
  }

  isCustomerReturnSelected(): boolean {
    return this.isReturn(this.form.movementType) && this.returnFlow === 'CUSTOMER_RETURN';
  }

  getMovementLabel(movement: Pick<StockMovement, 'movementType' | 'referenceType'>): string {
    if (movement.movementType === 'RETURN') {
      return movement.referenceType === 'SUPPLIER_RETURN' ? 'SUPPLIER_RETURN' : 'CUSTOMER_RETURN';
    }
    return movement.movementType;
  }

  getTransferFlow(movement: StockMovement): string {
    if (!this.isTransfer(movement.movementType)) {
      return '';
    }
    const from = movement.fromWarehouseName || 'Unknown';
    const to = movement.toWarehouseName || 'Unknown';
    return `${from} -> ${to}`;
  }

  openModal(): void { this.resetMovementForm(); this.formError = ''; this.showModal = true; }
  closeModal(): void { this.showModal = false; }

  record(): void {
    const validationError = this.validateMovementForm();
    if (validationError) {
      this.formError = validationError;
      return;
    }

    this.saving = true;
    this.formError = '';

    const movementNotes = this.buildMovementNotes();
    const payload = this.buildMovementPayload(movementNotes);

    this.movementService.record(payload).subscribe({
      next: () => {
        if (!this.shouldApplySupplierReturnPayment()) {
          this.finishSuccessfulRecord();
          return;
        }

        this.applySupplierReturnPayment(movementNotes);
      },
      error: err => {
        this.saving = false;
        this.formError = err.error?.message || err.error?.error || err.message || 'Record failed';
      }
    });
  }

  emptyForm(): MovementRequest {
    return { productId: 0, warehouseId: 0, fromWarehouseId: 0, toWarehouseId: 0, movementType: '' as MovementType, quantity: 1, unitCost: 0, notes: '' };
  }

  get supplierReturnOrders(): PurchaseOrder[] {
    return this.purchaseOrders.filter(po => po.status === 'RECEIVED' || po.status === 'PARTIALLY_RECEIVED');
  }

  getWarehouseLabel(): string {
    if (this.isSupplierReturnSelected()) {
      return 'Warehouse (stock goes out from here)';
    }
    if (this.isCustomerReturnSelected()) {
      return 'Warehouse (stock comes back here)';
    }
    return 'Warehouse';
  }

  getUnitCostLabel(): string {
    if (this.isSupplierReturnSelected() || this.isCustomerReturnSelected()) {
      return 'Return Unit Value (₹)';
    }
    return 'Unit Cost (₹)';
  }

  private buildMovementNotes(): string {
    const notes = (this.form.notes ?? '').trim();
    const extraNotes: string[] = [];

    if (this.isCustomerReturnSelected() && this.customerRefundAmount > 0) {
      extraNotes.push(`Customer refund to process: INR ${this.customerRefundAmount.toFixed(2)}.`);
    }

    if (this.isSupplierReturnSelected() && this.supplierReturnAction && this.supplierReturnAmount > 0) {
      const actionLabel = this.supplierReturnAction === 'REDUCE_PAYABLE'
        ? 'Reduce supplier payable'
        : 'Supplier refund received';
      extraNotes.push(`${actionLabel}: INR ${this.supplierReturnAmount.toFixed(2)}.`);
    }

    return [notes, ...extraNotes].filter(Boolean).join('\n');
  }

  private validateMovementForm(): string {
    if (!this.form.movementType || !this.form.productId || this.form.quantity < 1) {
      return 'Type, product and quantity are required';
    }

    if (this.isReturn(this.form.movementType) && !this.returnFlow) {
      return 'Return flow is required';
    }

    if (this.isTransfer(this.form.movementType)) {
      return this.validateTransferFields();
    }

    if (!this.form.warehouseId) {
      return 'Warehouse is required';
    }

    if ((this.form.unitCost ?? 0) < 0) {
      return 'Unit cost cannot be negative';
    }

    if ((this.form.notes ?? '').trim().length > 500) {
      return 'Notes cannot exceed 500 characters';
    }

    if (this.isSupplierReturnSelected()) {
      return this.validateSupplierReturnFields();
    }

    if (this.isCustomerReturnSelected() && this.customerRefundAmount < 0) {
      return 'Customer refund amount cannot be negative';
    }

    return '';
  }

  private validateTransferFields(): string {
    if (!this.form.fromWarehouseId || !this.form.toWarehouseId) {
      return 'Source warehouse, destination warehouse and quantity are required';
    }

    if (+this.form.fromWarehouseId === +this.form.toWarehouseId) {
      return 'Source and destination warehouses must be different';
    }

    return '';
  }

  private validateSupplierReturnFields(): string {
    if (!this.supplierReturnPurchaseOrderId) {
      return 'Purchase order is required for supplier returns';
    }

    if (!!this.supplierReturnAction !== !!this.supplierReturnAmount) {
      return 'Supplier return amount and payment handling must be provided together';
    }

    if (this.supplierReturnAmount < 0) {
      return 'Supplier return amount cannot be negative';
    }

    return '';
  }

  private buildMovementPayload(movementNotes: string): MovementRequest {
    if (this.isTransfer(this.form.movementType)) {
      return {
        ...this.form,
        movementType: 'TRANSFER_OUT',
        productId: +this.form.productId,
        warehouseId: +this.form.fromWarehouseId!,
        fromWarehouseId: +this.form.fromWarehouseId!,
        toWarehouseId: +this.form.toWarehouseId!,
        notes: movementNotes
      };
    }

    return {
      ...this.form,
      productId: +this.form.productId,
      warehouseId: +this.form.warehouseId,
      referenceId: this.isSupplierReturnSelected() ? this.supplierReturnPurchaseOrderId : this.form.referenceId,
      referenceType: this.isReturn(this.form.movementType) ? this.returnFlow : this.form.referenceType,
      notes: movementNotes
    };
  }

  private shouldApplySupplierReturnPayment(): boolean {
    return this.isSupplierReturnSelected() && !!this.supplierReturnAction && this.supplierReturnAmount > 0;
  }

  private applySupplierReturnPayment(movementNotes: string): void {
    const action = this.supplierReturnAction;
    if (!action) {
      this.finishSuccessfulRecord();
      return;
    }

    this.paymentService.applySupplierReturn(this.supplierReturnPurchaseOrderId, {
      action,
      amount: this.supplierReturnAmount,
      reason: movementNotes || undefined
    }).subscribe({
      next: () => this.finishSuccessfulRecord(),
      error: err => {
        this.saving = false;
        this.formError = `Movement was recorded, but payment adjustment failed: ${err.error?.message || err.error?.error || err.message || 'Unknown error'}`;
        this.load();
      }
    });
  }

  private finishSuccessfulRecord(): void {
    this.saving = false;
    this.closeModal();
    this.load();
  }

  private resetMovementForm(): void {
    this.form = this.emptyForm();
    this.returnFlow = '';
    this.supplierReturnPurchaseOrderId = 0;
    this.supplierReturnAction = '';
    this.supplierReturnAmount = 0;
    this.customerRefundAmount = 0;
  }
}
