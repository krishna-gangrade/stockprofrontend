import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PurchaseOrderService, SupplierService, WarehouseService, ProductService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { PurchaseOrder, POStatus, Supplier, Warehouse, Product, POLineItemRequest, ReceiveGoodsRequest } from '../../../core/models/models';

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1"><i class="bi bi-cart text-warning me-2"></i>Purchase Orders</h2>
        <p class="text-muted mb-0">{{ filtered.length }} of {{ orders.length }} orders</p>
      </div>
      <button class="btn btn-dark" (click)="openCreateModal()"
              *ngIf="authService.hasAnyRole('PURCHASE_OFFICER','ADMIN')">
        <i class="bi bi-plus-lg me-2"></i>New PO
      </button>
    </div>

    <div class="alert shadow-sm border-0 d-flex align-items-center gap-2"
         *ngIf="pageMessage"
         [class.alert-success]="pageMessageType === 'success'"
         [class.alert-danger]="pageMessageType === 'error'">
      <i class="bi" [class.bi-check-circle-fill]="pageMessageType === 'success'" [class.bi-x-circle-fill]="pageMessageType === 'error'"></i>
      <span>{{ pageMessage }}</span>
    </div>

    <!-- Status Filter Tabs -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body py-2">
        <div class="d-flex gap-2 flex-wrap">
          <button *ngFor="let s of statusFilters"
                  class="btn btn-sm"
                  [class]="selectedStatus === s.value ? 'btn-dark' : 'btn-outline-secondary'"
                  (click)="filterByStatus(s.value)">
            {{ s.label }}
            <span class="badge ms-1" [class]="s.badge">{{ countByStatus(s.value) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-overlay" *ngIf="loading">
      <div class="text-center">
        <div class="spinner-border text-warning mb-2"></div>
        <p class="text-muted">Loading purchase orders...</p>
      </div>
    </div>

    <!-- PO Table -->
    <div class="card border-0 shadow-sm" *ngIf="!loading">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th>Reference</th>
              <th>Supplier</th>
              <th>Warehouse</th>
              <th>Order Date</th>
              <th>Expected</th>
              <th class="text-end">Amount</th>
              <th class="text-center">Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let po of filtered">
              <td><code class="small">#{{ po.id }} {{ po.referenceNumber ? '- ' + po.referenceNumber : '' }}</code></td>
              <td class="fw-semibold small">{{ po.supplierName }}</td>
              <td><small class="text-muted">{{ po.warehouseName }}</small></td>
              <td><small>{{ po.orderDate | date:'dd MMM yyyy' }}</small></td>
              <td>
                <small [class]="isOverdue(po) ? 'text-danger fw-bold' : 'text-muted'">
                  {{ po.expectedDate | date:'dd MMM yyyy' }}
                  <i class="bi bi-alarm ms-1" *ngIf="isOverdue(po)" title="Overdue"></i>
                </small>
              </td>
              <td class="text-end fw-semibold">₹{{ po.totalAmount | number:'1.0-0' }}</td>
              <td class="text-center">
                <span class="badge" [class]="getStatusBadge(po.status)">{{ po.status }}</span>
              </td>
              <td class="text-center">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" (click)="viewPO(po)" title="View Details">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-outline-success"
                          *ngIf="po.status === 'DRAFT' && authService.hasAnyRole('PURCHASE_OFFICER','ADMIN')"
                          (click)="submit(po)" title="Submit for Approval">
                    <i class="bi bi-send"></i>
                  </button>
                  <button class="btn btn-outline-primary"
                          *ngIf="po.status === 'PENDING' && authService.hasAnyRole('INVENTORY_MANAGER','ADMIN')"
                          (click)="approve(po)" title="Approve">
                    <i class="bi bi-check-lg"></i>
                  </button>
                  <button class="btn btn-outline-danger"
                          *ngIf="po.status === 'PENDING' && authService.hasAnyRole('INVENTORY_MANAGER','ADMIN')"
                          (click)="openRejectModal(po)" title="Reject">
                    <i class="bi bi-x-lg"></i>
                  </button>
                  <button class="btn btn-outline-success"
                          *ngIf="(po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') && authService.hasAnyRole('WAREHOUSE_STAFF','INVENTORY_MANAGER','ADMIN')"
                          (click)="openReceiveModal(po)" title="Receive Goods">
                    <i class="bi bi-box-arrow-in-down"></i>
                  </button>
                  <button class="btn btn-outline-warning"
                          *ngIf="po.status === 'RECEIVED' && authService.hasAnyRole('PURCHASE_OFFICER','INVENTORY_MANAGER','ADMIN')"
                          (click)="goToPayment(po)" title="Pay with Razorpay">
                    <i class="bi bi-credit-card"></i>
                  </button>
                  <button class="btn btn-outline-danger"
                          *ngIf="po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && authService.hasAnyRole('PURCHASE_OFFICER','ADMIN')"
                          (click)="openCancelModal(po)" title="Cancel">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filtered.length === 0">
              <td colspan="8" class="text-center text-muted py-5">
                <i class="bi bi-cart fs-1 d-block mb-2 text-secondary"></i>
                No purchase orders found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CREATE PO MODAL -->
    <div class="modal-backdrop fade show" *ngIf="showCreateModal || showDetailModal || showRejectModal || showCancelModal || showReceiveModal || showConfirmModal" (click)="closeAllModals()"></div>

    <div class="modal show d-block" *ngIf="showCreateModal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title"><i class="bi bi-cart-plus me-2"></i>Create Purchase Order</h5>
            <button type="button" class="btn-close btn-close-white" (click)="closeAllModals()"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <label class="form-label fw-semibold">Supplier <span class="text-danger">*</span></label>
                <select class="form-select"
                        [(ngModel)]="newPO.supplierId"
                        (ngModelChange)="onSupplierChange($event)">
                  <option value="">Select supplier...</option>
                  <option *ngFor="let s of suppliers" [value]="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Warehouse <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="newPO.warehouseId">
                  <option value="">Select warehouse...</option>
                  <option *ngFor="let w of warehouses" [value]="w.id">{{ w.name }}</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label fw-semibold">Order Date</label>
                <input type="date" class="form-control" [(ngModel)]="newPO.orderDate">
              </div>
              <div class="col-md-2">
                <label class="form-label fw-semibold">Expected Date</label>
                <input type="date" class="form-control" [(ngModel)]="newPO.expectedDate">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Reference Number</label>
                <input type="text" class="form-control" [(ngModel)]="newPO.referenceNumber" placeholder="Optional">
              </div>
              <div class="col-md-8">
                <label class="form-label fw-semibold">Notes</label>
                <input type="text" class="form-control" [(ngModel)]="newPO.notes" placeholder="Optional notes">
              </div>
            </div>

            <!-- Line Items -->
            <h6 class="fw-bold mb-3">Line Items</h6>
            <div class="table-responsive mb-3">
              <table class="table table-bordered align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Product</th>
                    <th style="width:120px">Quantity</th>
                    <th style="width:150px">Unit Cost (₹)</th>
                    <th style="width:150px">Total</th>
                    <th style="width:60px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let line of newPO.lineItems; let i = index">
                    <td>
                      <select class="form-select form-select-sm" [(ngModel)]="line.productId">
                        <option value="">{{ newPO.supplierId ? 'Select product...' : 'Select supplier first...' }}</option>
                        <option *ngFor="let p of getAvailableProducts()" [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                      </select>
                    </td>
                    <td><input type="number" class="form-control form-control-sm" [(ngModel)]="line.quantity" min="1"></td>
                    <td><input type="number" class="form-control form-control-sm" [(ngModel)]="line.unitCost" min="0" step="0.01"></td>
                    <td class="fw-semibold">₹{{ (line.quantity * line.unitCost) | number:'1.2-2' }}</td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-outline-danger" (click)="removeLine(i)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="table-light">
                    <td colspan="3" class="fw-bold text-end">Total Amount:</td>
                    <td class="fw-bold text-success">₹{{ getTotalAmount() | number:'1.2-2' }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <button class="btn btn-outline-primary btn-sm" (click)="addLine()">
              <i class="bi bi-plus-lg me-1"></i>Add Line Item
            </button>
            <div class="alert alert-danger mt-3" *ngIf="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAllModals()">Cancel</button>
            <button class="btn btn-dark" (click)="createPO()" [disabled]="saving">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="saving"></span>
              Create Purchase Order
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW DETAIL MODAL -->
    <div class="modal show d-block" *ngIf="showDetailModal && selectedPO" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">
              <i class="bi bi-cart me-2"></i>PO #{{ selectedPO.id }}
              <span class="badge ms-2" [class]="getStatusBadge(selectedPO.status)">{{ selectedPO.status }}</span>
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="closeAllModals()"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <p class="mb-1"><strong>Supplier:</strong> {{ selectedPO.supplierName }}</p>
                <p class="mb-1"><strong>Warehouse:</strong> {{ selectedPO.warehouseName }}</p>
                <p class="mb-1"><strong>Order Date:</strong> {{ selectedPO.orderDate | date:'dd MMM yyyy' }}</p>
              </div>
              <div class="col-md-6">
                <p class="mb-1"><strong>Expected Date:</strong> {{ selectedPO.expectedDate | date:'dd MMM yyyy' }}</p>
                <p class="mb-1"><strong>Reference:</strong> {{ selectedPO.referenceNumber || 'N/A' }}</p>
                <p class="mb-1"><strong>Notes:</strong> {{ selectedPO.notes || 'None' }}</p>
              </div>
            </div>
            <h6 class="fw-bold mb-2">Line Items</h6>
            <table class="table table-sm table-bordered">
              <thead class="table-light">
                <tr>
                  <th>Product</th>
                  <th class="text-center">Ordered</th>
                  <th class="text-center">Received</th>
                  <th class="text-center">Pending</th>
                  <th class="text-end">Unit Cost</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let li of selectedPO.lineItems">
                  <td>{{ li.productName }} <small class="text-muted">({{ li.productSku }})</small></td>
                  <td class="text-center">{{ li.quantity }}</td>
                  <td class="text-center text-success fw-bold">{{ li.receivedQty }}</td>
                  <td class="text-center text-warning fw-bold">{{ li.pendingQty }}</td>
                  <td class="text-end">₹{{ li.unitCost | number:'1.2-2' }}</td>
                  <td class="text-end fw-semibold">₹{{ li.totalCost | number:'1.2-2' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="table-light">
                  <td colspan="5" class="text-end fw-bold">Total:</td>
                  <td class="text-end fw-bold text-success">₹{{ selectedPO.totalAmount | number:'1.2-2' }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAllModals()">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- REJECT MODAL -->
    <div class="modal show d-block" *ngIf="showRejectModal" tabindex="-1">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title"><i class="bi bi-x-circle me-2"></i>Reject Purchase Order</h5>
            <button class="btn-close btn-close-white" (click)="closeAllModals()"></button>
          </div>
          <div class="modal-body">
            <label class="form-label fw-semibold">Reason for Rejection <span class="text-danger">*</span></label>
            <textarea class="form-control" rows="3" [(ngModel)]="rejectReason" placeholder="Enter rejection reason..."></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAllModals()">Cancel</button>
            <button class="btn btn-danger" (click)="reject()" [disabled]="!rejectReason">Reject PO</button>
          </div>
        </div>
      </div>
    </div>

    <!-- CANCEL MODAL -->
    <div class="modal show d-block" *ngIf="showCancelModal" tabindex="-1">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title"><i class="bi bi-trash me-2"></i>Cancel Purchase Order</h5>
            <button class="btn-close btn-close-white" (click)="closeAllModals()"></button>
          </div>
          <div class="modal-body">
            <label class="form-label fw-semibold">Reason for Cancellation <span class="text-danger">*</span></label>
            <textarea class="form-control" rows="3" [(ngModel)]="cancelReason" placeholder="Enter cancellation reason..."></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAllModals()">Back</button>
            <button class="btn btn-danger" (click)="cancel()" [disabled]="!cancelReason">Cancel PO</button>
          </div>
        </div>
      </div>
    </div>

    <!-- RECEIVE GOODS MODAL -->
    <div class="modal show d-block" *ngIf="showReceiveModal && selectedPO" tabindex="-1">
      <div class="modal-dialog modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title"><i class="bi bi-box-arrow-in-down me-2"></i>Receive Goods — PO #{{ selectedPO.id }}</h5>
            <button class="btn-close btn-close-white" (click)="closeAllModals()"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-3">Enter the quantity received for each line item. Partial receipts are supported.</p>
            <table class="table table-bordered align-middle">
              <thead class="table-light">
                <tr>
                  <th>Product</th>
                  <th class="text-center">Ordered</th>
                  <th class="text-center">Already Received</th>
                  <th class="text-center">Pending</th>
                  <th style="width:130px">Receiving Now</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let li of selectedPO.lineItems; let i = index">
                  <td>
                    <div class="fw-semibold small">{{ li.productName }}</div>
                    <code class="small text-muted">{{ li.productSku }}</code>
                  </td>
                  <td class="text-center">{{ li.quantity }}</td>
                  <td class="text-center text-success">{{ li.receivedQty }}</td>
                  <td class="text-center">
                    <span [class]="li.pendingQty > 0 ? 'text-warning fw-bold' : 'text-success'">
                      {{ li.pendingQty }}
                    </span>
                  </td>
                  <td>
                    <input type="number" class="form-control form-control-sm"
                           [(ngModel)]="receiveQtys[i]"
                           [max]="li.pendingQty" min="0"
                           [disabled]="li.pendingQty === 0">
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- Soothing Error Display -->
            <div class="alert border-0 shadow-sm d-flex align-items-start rounded-3 p-3 mt-3" 
                 *ngIf="formError" 
                 style="background-color: #fff5f5; color: #c53030; border-left: 4px solid #f56565 !important;">
              <div class="flex-shrink-0 me-3">
                <i class="bi bi-exclamation-triangle-fill fs-4" style="color: #f56565;"></i>
              </div>
              <div class="flex-grow-1">
                <div class="fw-bold mb-1" style="font-size: 0.95rem;">Something needs your attention</div>
                <div class="small mb-2" style="line-height: 1.4;">{{ formError }}</div>
                
                <!-- Smart Tip for Capacity Errors -->
                <div class="mt-2 p-2 rounded-2" 
                     *ngIf="formError.toLowerCase().includes('capacity')"
                     style="background-color: rgba(245, 101, 101, 0.1); font-size: 0.85rem;">
                  <i class="bi bi-lightbulb me-1 fw-bold"></i> 
                  <strong>Quick Tip:</strong> It looks like your warehouse is full. You can increase its capacity in the <b>Warehouses</b> settings or try receiving a smaller amount.
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAllModals()">Cancel</button>
            <button class="btn btn-success" (click)="receiveGoods()" [disabled]="saving">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="saving"></span>
              Confirm Receipt
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CONFIRM ACTION MODAL -->
    <div class="modal show d-block" *ngIf="showConfirmModal" tabindex="-1">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title"><i class="bi bi-patch-question me-2"></i>{{ confirmTitle }}</h5>
            <button class="btn-close btn-close-white" (click)="closeAllModals()"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">{{ confirmMessage }}</p>
            <div class="alert alert-danger mt-3 mb-0" *ngIf="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAllModals()">Cancel</button>
            <button class="btn btn-dark" (click)="confirmAction()" [disabled]="saving">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="saving"></span>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PoListComponent implements OnInit {
  orders:   PurchaseOrder[] = [];
  filtered: PurchaseOrder[] = [];
  suppliers: Supplier[]  = [];
  warehouses: Warehouse[] = [];
  products:  Product[]   = [];

  selectedStatus = 'ALL';
  loading = false;
  saving  = false;
  formError = '';

  showCreateModal  = false;
  showDetailModal  = false;
  showRejectModal  = false;
  showCancelModal  = false;
  showReceiveModal = false;
  showConfirmModal = false;
  selectedPO: PurchaseOrder | null = null;

  rejectReason = '';
  cancelReason = '';
  receiveQtys: number[] = [];
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: 'submit' | 'approve' | null = null;
  pageMessage = '';
  pageMessageType: 'success' | 'error' = 'success';

  newPO = this.emptyPO();

  statusFilters = [
    { label: 'All',      value: 'ALL',                badge: 'bg-secondary' },
    { label: 'Draft',    value: 'DRAFT',               badge: 'bg-secondary' },
    { label: 'Pending',  value: 'PENDING',             badge: 'bg-warning text-dark' },
    { label: 'Approved', value: 'APPROVED',            badge: 'bg-primary' },
    { label: 'Partial',  value: 'PARTIALLY_RECEIVED',  badge: 'bg-info text-dark' },
    { label: 'Received', value: 'RECEIVED',            badge: 'bg-success' },
    { label: 'Cancelled',value: 'CANCELLED',           badge: 'bg-danger' },
  ];

  constructor(
    private readonly poService: PurchaseOrderService,
    private readonly supplierService: SupplierService,
    private readonly warehouseService: WarehouseService,
    private readonly productService: ProductService,
    private readonly router: Router,
    public readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
    this.supplierService.getActive().subscribe({ next: r => this.suppliers  = r.data ?? [] });
    this.warehouseService.getActive().subscribe({ next: r => this.warehouses = r.data ?? [] });
    this.productService.getActive().subscribe({ next: r => this.products    = r.data ?? [] });
  }

  load(): void {
    this.loading = true;
    this.poService.getAll().subscribe({
      next: r => { this.orders = r.data ?? []; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  filterByStatus(status: string): void { this.selectedStatus = status; this.applyFilter(); }

  applyFilter(): void {
    this.filtered = this.selectedStatus === 'ALL'
      ? this.orders
      : this.orders.filter(o => o.status === this.selectedStatus);
  }

  countByStatus(status: string): number {
    return status === 'ALL' ? this.orders.length : this.orders.filter(o => o.status === status).length;
  }

  isOverdue(po: PurchaseOrder): boolean {
    if (!po.expectedDate) return false;
    return po.status === 'APPROVED' && new Date(po.expectedDate) < new Date();
  }

  getStatusBadge(status: POStatus): string {
    const map: Record<string, string> = {
      DRAFT: 'bg-secondary', PENDING: 'bg-warning text-dark',
      APPROVED: 'bg-primary', PARTIALLY_RECEIVED: 'bg-info text-dark',
      RECEIVED: 'bg-success', CANCELLED: 'bg-danger'
    };
    return map[status] ?? 'bg-secondary';
  }

  openCreateModal(): void { this.newPO = this.emptyPO(); this.formError = ''; this.showCreateModal = true; }
  viewPO(po: PurchaseOrder): void { this.selectedPO = po; this.showDetailModal = true; }
  openRejectModal(po: PurchaseOrder): void { this.selectedPO = po; this.rejectReason = ''; this.showRejectModal = true; }
  openCancelModal(po: PurchaseOrder): void { this.selectedPO = po; this.cancelReason = ''; this.showCancelModal = true; }
  openReceiveModal(po: PurchaseOrder): void {
    this.selectedPO = po;
    this.receiveQtys = po.lineItems.map(() => 0);
    this.formError = '';
    this.showReceiveModal = true;
  }
  openConfirmModal(po: PurchaseOrder, action: 'submit' | 'approve'): void {
    this.selectedPO = po;
    this.pendingAction = action;
    this.formError = '';
    this.confirmTitle = action === 'submit' ? 'Submit Purchase Order' : 'Approve Purchase Order';
    this.confirmMessage = action === 'submit'
      ? 'Submit this purchase order for approval?'
      : 'Approve this purchase order?';
    this.showConfirmModal = true;
  }
  closeAllModals(): void {
    this.showCreateModal = this.showDetailModal = this.showRejectModal =
    this.showCancelModal = this.showReceiveModal = this.showConfirmModal = false;
    this.selectedPO = null;
    this.pendingAction = null;
    this.confirmTitle = '';
    this.confirmMessage = '';
    this.saving = false;
  }

  addLine(): void { this.newPO.lineItems.push({ productId: 0, quantity: 1, unitCost: 0 }); }
  removeLine(i: number): void { this.newPO.lineItems.splice(i, 1); }
  getTotalAmount(): number {
    return this.newPO.lineItems.reduce((sum, l) => sum + (l.quantity * l.unitCost), 0);
  }

  onSupplierChange(supplierId: number | string): void {
    this.newPO.supplierId = +supplierId;
    const allowedProductIds = new Set(this.getAvailableProducts().map(product => product.id));
    this.newPO.lineItems = this.newPO.lineItems.map(line =>
      allowedProductIds.has(+line.productId) ? line : { ...line, productId: 0 }
    );
  }

  createPO(): void {
    const validationMessage = this.validateNewPO();
    if (validationMessage) {
      this.formError = validationMessage;
      return;
    }
    this.saving = true; this.formError = '';
    this.poService.create({ ...this.newPO, supplierId: +this.newPO.supplierId, warehouseId: +this.newPO.warehouseId }).subscribe({
      next: () => { this.saving = false; this.closeAllModals(); this.load(); },
      error: err => { this.saving = false; this.formError = err.error?.message || 'Create failed'; }
    });
  }

  submit(po: PurchaseOrder): void {
    this.openConfirmModal(po, 'submit');
  }

  approve(po: PurchaseOrder): void {
    this.openConfirmModal(po, 'approve');
  }

  goToPayment(po: PurchaseOrder): void {
    this.router.navigate(['/payments'], { queryParams: { purchaseOrderId: po.id } });
  }

  reject(): void {
    if (!this.selectedPO || !this.rejectReason) return;
    this.poService.reject(this.selectedPO.id, this.rejectReason).subscribe({
      next: () => { this.closeAllModals(); this.load(); },
      error: err => { this.formError = this.getErrorMessage(err, 'Reject failed'); }
    });
  }

  cancel(): void {
    if (!this.selectedPO || !this.cancelReason) return;
    this.poService.cancel(this.selectedPO.id, this.cancelReason).subscribe({
      next: () => { this.closeAllModals(); this.load(); },
      error: err => { this.formError = this.getErrorMessage(err, 'Cancel failed'); }
    });
  }

  receiveGoods(): void {
    if (!this.selectedPO) return;
    const receipts: ReceiveGoodsRequest[] = this.selectedPO.lineItems
      .map((li, i) => ({ lineItemId: li.id, receivedQuantity: this.receiveQtys[i] || 0 }))
      .filter(r => r.receivedQuantity > 0);

    if (receipts.length === 0) { this.formError = 'Enter at least one received quantity'; return; }
    this.saving = true;
    this.poService.receiveGoods(this.selectedPO.id, receipts).subscribe({
      next: () => { this.saving = false; this.closeAllModals(); this.load(); },
      error: err => { this.saving = false; this.formError = err.error?.message || 'Receive failed'; }
    });
  }

  confirmAction(): void {
    if (!this.selectedPO || !this.pendingAction) return;
    this.saving = true;
    this.formError = '';

    const request = this.pendingAction === 'submit'
      ? this.poService.submit(this.selectedPO.id)
      : this.poService.approve(this.selectedPO.id);

    request.subscribe({
      next: () => {
        const message = this.pendingAction === 'submit'
          ? 'Purchase order submitted for approval.'
          : 'Purchase order approved successfully.';
        this.saving = false;
        this.closeAllModals();
        this.setPageMessage('success', message);
        this.load();
      },
      error: err => {
        this.saving = false;
        this.formError = this.getErrorMessage(err, this.pendingAction === 'submit' ? 'Submit failed' : 'Approve failed');
        this.setPageMessage('error', this.formError);
      }
    });
  }

  emptyPO() {
    const today = new Date().toISOString().split('T')[0];
    return { supplierId: 0, warehouseId: 0, orderDate: today, expectedDate: '', referenceNumber: '', notes: '', lineItems: [] as POLineItemRequest[] };
  }

  private getErrorMessage(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error || err?.message || fallback;
  }

  private setPageMessage(type: 'success' | 'error', message: string): void {
    this.pageMessageType = type;
    this.pageMessage = message;
  }

  private validateNewPO(): string {
    if (!this.newPO.supplierId || !this.newPO.warehouseId || this.newPO.lineItems.length === 0) {
      return 'Supplier, warehouse and at least one line item are required';
    }
    if (this.newPO.expectedDate && this.newPO.orderDate && this.newPO.expectedDate < this.newPO.orderDate) {
      return 'Expected date cannot be earlier than order date';
    }
    if (this.newPO.lineItems.some(line => !line.productId || line.quantity < 1 || line.unitCost <= 0)) {
      return 'Each line item needs a product, quantity of at least 1, and unit cost greater than zero';
    }
    const availableProductIds = new Set(this.getAvailableProducts().map(product => product.id));
    if (this.newPO.lineItems.some(line => !availableProductIds.has(+line.productId))) {
      return 'Selected products must belong to the chosen supplier';
    }
    return '';
  }

  getAvailableProducts(): Product[] {
    const supplierName = this.getSelectedSupplierName();
    if (!supplierName) {
      return [];
    }

    const normalizedSupplierName = this.normalizeText(supplierName);
    return this.products.filter(product => this.normalizeText(product.brand) === normalizedSupplierName);
  }

  private getSelectedSupplierName(): string | null {
    const supplierId = +this.newPO.supplierId;
    if (!supplierId) {
      return null;
    }

    return this.suppliers.find(supplier => supplier.id === supplierId)?.name ?? null;
  }

  private normalizeText(value?: string | null): string {
    return (value ?? '').trim().toLowerCase();
  }
}
