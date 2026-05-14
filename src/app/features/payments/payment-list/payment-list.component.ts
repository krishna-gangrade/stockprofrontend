import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PaymentService, PurchaseOrderService, SupplierService } from '../../../core/services/api.services';
import { Payment, PaymentMethod, PaymentRequest, PaymentStatus, PurchaseOrder, RazorpayOrderResponse, Supplier } from '../../../core/models/models';
import { ThirdPartyScriptService } from '../../../core/services/third-party-script.service';

type PaymentFilterValue = 'ALL' | 'UNPAID' | PaymentStatus;

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1"><i class="bi bi-credit-card text-warning me-2"></i>Payments</h2>
        <p class="text-muted mb-0">{{ filtered.length }} of {{ payments.length }} supplier payments</p>
      </div>
      <button class="btn btn-dark" (click)="openCreateModal()">
        <i class="bi bi-plus-lg me-2"></i>New Payment
      </button>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <!-- Status Filters -->
          <div class="d-flex gap-2 flex-wrap">
            <button *ngFor="let s of statusFilters"
                    class="btn btn-sm"
                    [class]="selectedStatus === s.value ? 'btn-dark' : 'btn-outline-secondary'"
                    (click)="filterByStatus(s.value)">
              {{ s.label }}
              <span class="badge ms-1" [class]="s.badge">{{ countByStatus(s.value) }}</span>
            </button>
          </div>
          
          <!-- Date Filter -->
          <div class="d-flex align-items-center gap-2 ms-auto">
            <div class="input-group input-group-sm" style="width: auto;">
              <span class="input-group-text bg-white border-end-0"><i class="bi bi-calendar-range small text-muted"></i></span>
              <input type="date" class="form-control border-start-0 ps-0" [(ngModel)]="dateFrom" (change)="applyDateFilter()" placeholder="From">
              <span class="input-group-text bg-white border-start-0 border-end-0">-</span>
              <input type="date" class="form-control border-start-0 ps-0" [(ngModel)]="dateTo" (change)="applyDateFilter()" placeholder="To">
              <button class="btn btn-outline-secondary" type="button" *ngIf="dateFrom || dateTo" (click)="resetDateFilter()">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-overlay" *ngIf="loading">
      <div class="text-center">
        <div class="spinner-border text-warning mb-2"></div>
        <p class="text-muted">Loading payments...</p>
      </div>
    </div>

    <div class="card border-0 shadow-sm" *ngIf="!loading">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th>Payment</th>
              <th>PO</th>
              <th>Supplier</th>
              <th>Method</th>
              <th>Due</th>
              <th class="text-end">Amount</th>
              <th class="text-end">Paid</th>
              <th class="text-end">Balance</th>
              <th class="text-center">Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let payment of filtered">
              <td><code class="small">#{{ payment.id }}</code></td>
              <td><span class="badge text-bg-light">PO #{{ payment.purchaseOrderId }}</span></td>
              <td class="fw-semibold small">{{ getSupplierName(payment.supplierId) }}</td>
              <td><small>{{ getMethodLabel(payment.paymentMethod) }}</small></td>
              <td>
                <small [class]="isOverdue(payment) ? 'text-danger fw-bold' : 'text-muted'">
                  {{ payment.dueDate ? (payment.dueDate | date:'dd MMM yyyy') : 'N/A' }}
                </small>
              </td>
              <td class="text-end">₹{{ getPoTotalAmount(payment) | number:'1.2-2' }}</td>
              <td class="text-end text-success fw-semibold">₹{{ getPoPaidAmount(payment) | number:'1.2-2' }}</td>
              <td class="text-end fw-semibold">₹{{ getPoBalance(payment) | number:'1.2-2' }}</td>
              <td class="text-center">
                <span class="badge" [class]="getStatusBadge(getDisplayStatus(payment))">{{ getDisplayStatus(payment) }}</span>
              </td>
              <td class="text-center">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" (click)="viewPayment(payment)" title="View Details">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-outline-success"
                          *ngIf="canPay(payment)"
                          (click)="payExisting(payment)" title="Pay with Razorpay">
                    <i class="bi bi-credit-card"></i>
                  </button>
                  <button class="btn btn-outline-danger"
                          *ngIf="canMarkFailed(payment)"
                          (click)="markFailed(payment)" title="Mark Failed">
                    <i class="bi bi-exclamation-octagon"></i>
                  </button>
                  <button class="btn btn-outline-danger"
                          *ngIf="canCancel(payment)"
                          (click)="cancel(payment)" title="Cancel">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filtered.length === 0">
              <td colspan="10" class="text-center text-muted py-5">
                <i class="bi bi-credit-card fs-1 d-block mb-2 text-secondary"></i>
                No payments found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-backdrop fade show" *ngIf="showCreateModal || showDetailModal || showMockModal" (click)="closeAllModals()"></div>

    <div class="modal show d-block" *ngIf="showCreateModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title"><i class="bi bi-credit-card me-2"></i>Pay with Razorpay</h5>
            <button class="btn-close btn-close-white" (click)="closeAllModals()"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">Purchase Order <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="newPayment.purchaseOrderId" (change)="syncFromPO()">
                  <option [ngValue]="0">Select received PO...</option>
                  <option *ngFor="let po of payableOrders" [ngValue]="po.id">
                    #{{ po.id }} - {{ po.supplierName }} - ₹{{ po.totalAmount | number:'1.0-0' }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Supplier <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="newPayment.supplierId">
                  <option [ngValue]="0">Select supplier...</option>
                  <option *ngFor="let s of suppliers" [ngValue]="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Amount <span class="text-danger">*</span></label>
                <input type="number" class="form-control" [(ngModel)]="newPayment.amount" min="0" step="0.01" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Due Date</label>
                <input type="date" class="form-control" [(ngModel)]="newPayment.dueDate">
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Notes</label>
                <textarea class="form-control" rows="2" [(ngModel)]="newPayment.notes"></textarea>
              </div>
            </div>
            <div class="alert alert-danger mt-3" *ngIf="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAllModals()">Cancel</button>
            <button class="btn btn-dark" (click)="createPayment()" [disabled]="saving">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="saving"></span>
              Continue to Razorpay
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal show d-block" *ngIf="showDetailModal && selectedPayment" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">Payment #{{ selectedPayment.id }}</h5>
            <button class="btn-close btn-close-white" (click)="closeAllModals()"></button>
          </div>
          <div class="modal-body">
            <p class="mb-1"><strong>Purchase Order:</strong> #{{ selectedPayment.purchaseOrderId }}</p>
            <p class="mb-1"><strong>Supplier:</strong> {{ getSupplierName(selectedPayment.supplierId) }}</p>
            <p class="mb-1"><strong>Method:</strong> {{ getMethodLabel(selectedPayment.paymentMethod) }}</p>
            <p class="mb-1"><strong>Status:</strong> {{ getDisplayStatus(selectedPayment) }}</p>
            <p class="mb-1"><strong>Amount:</strong> ₹{{ getPoTotalAmount(selectedPayment) | number:'1.2-2' }}</p>
            <p class="mb-1"><strong>Paid:</strong> ₹{{ getPoPaidAmount(selectedPayment) | number:'1.2-2' }}</p>
            <p class="mb-1"><strong>Balance:</strong> ₹{{ getPoBalance(selectedPayment) | number:'1.2-2' }}</p>
            <p class="mb-1"><strong>Reference:</strong> {{ selectedPayment.transactionReference || 'N/A' }}</p>
            <p class="mb-0"><strong>Notes:</strong> {{ selectedPayment.notes || 'None' }}</p>
            <p class="mb-0 mt-2 small text-muted"><strong>Created At:</strong> {{ selectedPayment.createdAt | date:'medium' }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAllModals()">Close</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal show d-block" *ngIf="showMockModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
        <div class="modal-content shadow-lg border-0" (click)="$event.stopPropagation()">
          <div class="modal-header bg-primary text-white border-0 py-3">
            <h5 class="modal-title fw-bold"><i class="bi bi-shield-check me-2"></i>Mock Gateway</h5>
            <button class="btn-close btn-close-white" (click)="closeAllModals()"></button>
          </div>
          <div class="modal-body p-4">
            <p class="text-muted small mb-3 text-center">Enter amount and select method to simulate:</p>
            <div class="mb-4">
              <label class="form-label small fw-bold text-muted">Amount to Pay (INR)</label>
              <div class="input-group">
                <span class="input-group-text bg-white">₹</span>
                <input type="number" class="form-control fw-bold" [(ngModel)]="mockPaidAmount" min="1">
              </div>
              <div class="form-text x-small text-info mt-1" *ngIf="pendingMockOrder && mockPaidAmount < getPoBalance(pendingMockOrder.payment)">
                <i class="bi bi-info-circle me-1"></i>A partial payment will keep the remaining balance on this PO.
              </div>
            </div>
            <div class="d-grid gap-2">
              <button class="btn btn-outline-primary py-3 d-flex align-items-center gap-3" (click)="completeMockPayment('upi')">
                <i class="bi bi-phone fs-4"></i>
                <div class="text-start">
                  <div class="fw-bold">UPI</div>
                  <small class="text-muted">GPay, PhonePe, Paytm</small>
                </div>
              </button>
              <button class="btn btn-outline-primary py-3 d-flex align-items-center gap-3" (click)="completeMockPayment('card')">
                <i class="bi bi-credit-card fs-4"></i>
                <div class="text-start">
                  <div class="fw-bold">Card</div>
                  <small class="text-muted">Visa, Mastercard</small>
                </div>
              </button>
              <button class="btn btn-outline-primary py-3 d-flex align-items-center gap-3" (click)="completeMockPayment('netbanking')">
                <i class="bi bi-bank fs-4"></i>
                <div class="text-start">
                  <div class="fw-bold">Netbanking</div>
                  <small class="text-muted">All Banks</small>
                </div>
              </button>
            </div>
          </div>
          <div class="modal-footer border-0 justify-content-center pb-4 pt-0">
            <small class="text-muted x-small text-center">
              <i class="bi bi-lock-fill me-1"></i>Secure Test Environment
            </small>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentListComponent implements OnInit {
  payments: Payment[] = [];
  filtered: Payment[] = [];
  suppliers: Supplier[] = [];
  purchaseOrders: PurchaseOrder[] = [];
  payableOrders: PurchaseOrder[] = [];

  selectedStatus: PaymentFilterValue = 'UNPAID';
  dateFrom = '';
  dateTo = '';
  loading = false;
  saving = false;
  formError = '';

  showCreateModal = false;
  showDetailModal = false;
  showMockModal = false;
  selectedPayment: Payment | null = null;
  pendingMockOrder: RazorpayOrderResponse | null = null;
  mockPaidAmount: number = 0;

  statusFilters = [
    { label: 'Unpaid', value: 'UNPAID' as PaymentFilterValue, badge: 'bg-warning text-dark' },
    { label: 'All', value: 'ALL' as PaymentFilterValue, badge: 'bg-secondary' },
    { label: 'Pending', value: 'PENDING' as PaymentFilterValue, badge: 'bg-warning text-dark' },
    { label: 'Partial', value: 'PARTIAL' as PaymentFilterValue, badge: 'bg-info text-dark' },
    { label: 'Paid', value: 'PAID' as PaymentFilterValue, badge: 'bg-success' },
    { label: 'Failed', value: 'FAILED' as PaymentFilterValue, badge: 'bg-danger' },
    { label: 'Cancelled', value: 'CANCELLED' as PaymentFilterValue, badge: 'bg-secondary' }
  ];

  newPayment: PaymentRequest = this.emptyPayment();

  constructor(
    private readonly paymentService: PaymentService,
    private readonly poService: PurchaseOrderService,
    private readonly supplierService: SupplierService,
    private readonly route: ActivatedRoute,
    private readonly thirdPartyScriptService: ThirdPartyScriptService
  ) {}

  ngOnInit(): void {
    this.load();
    this.supplierService.getActive().subscribe({ next: r => this.suppliers = r.data ?? [] });
    this.poService.getAll().subscribe({
      next: r => {
        this.purchaseOrders = r.data ?? [];
        this.updatePayableOrders();
        this.prefillFromQuery();
      }
    });
  }

  private updatePayableOrders(): void {
    // Only show RECEIVED orders that do not already have a payment record
    const paidPoIds = new Set(this.payments
      .filter(p => p.status !== 'CANCELLED')
      .map(p => p.purchaseOrderId));
    this.payableOrders = this.purchaseOrders.filter(po => 
      po.status === 'RECEIVED' && !paidPoIds.has(po.id)
    );
  }

  load(): void {
    this.loading = true;
    
    // If date filter is active, use the filter API
    if (this.dateFrom && this.dateTo) {
      this.paymentService.getByDateRange(this.dateFrom, this.dateTo).subscribe({
        next: r => {
          this.payments = r.data ?? [];
          this.updatePayableOrders();
          this.applyFilter();
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else {
      this.paymentService.getAll().subscribe({
        next: r => { 
          this.payments = r.data ?? []; 
          this.updatePayableOrders(); 
          this.applyFilter(); 
          this.loading = false; 
        },
        error: () => this.loading = false
      });
    }
  }

  applyDateFilter(): void {
    if (this.dateFrom && this.dateTo) {
      this.load();
    }
  }

  resetDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.load();
  }

  prefillFromQuery(): void {
    const poId = Number(this.route.snapshot.queryParamMap.get('purchaseOrderId'));
    if (!poId) return;
    const po = this.purchaseOrders.find(p => p.id === poId);
    if (!po) return;
    this.openCreateModal();
    this.newPayment.purchaseOrderId = po.id;
    this.syncFromPO();
  }

  filterByStatus(status: PaymentFilterValue): void { this.selectedStatus = status; this.applyFilter(); }

  applyFilter(): void {
    this.filtered = this.payments.filter(payment => this.matchesFilter(payment, this.selectedStatus));
  }

  countByStatus(status: PaymentFilterValue): number {
    return this.payments.filter(payment => this.matchesFilter(payment, status)).length;
  }

  openCreateModal(): void { this.newPayment = this.emptyPayment(); this.formError = ''; this.showCreateModal = true; }
  viewPayment(payment: Payment): void { this.selectedPayment = payment; this.showDetailModal = true; }

  closeAllModals(): void {
    this.showCreateModal = this.showDetailModal = this.showMockModal = false;
    this.selectedPayment = null;
    this.pendingMockOrder = null;
  }

  syncFromPO(): void {
    const po = this.purchaseOrders.find(p => p.id === Number(this.newPayment.purchaseOrderId));
    if (!po) return;
    this.newPayment.supplierId = po.supplierId;
    this.newPayment.amount = po.totalAmount;
  }

  createPayment(): void {
    const validationMessage = this.validateNewPayment();
    if (validationMessage) {
      this.formError = validationMessage;
      return;
    }

    const selectedPo = this.purchaseOrders.find(p => p.id === Number(this.newPayment.purchaseOrderId));
    if (selectedPo) {
      this.newPayment.amount = selectedPo.totalAmount;
    }

    this.saving = true; this.formError = '';
    const payload: PaymentRequest = {
      ...this.newPayment,
      dueDate: this.newPayment.dueDate || undefined,
      notes: this.newPayment.notes || undefined
    };
    this.paymentService.create(payload).subscribe({
      next: r => {
        this.saving = false;
        this.closeAllModals();
        void this.startRazorpayCheckout(r.data);
      },
      error: err => { this.saving = false; this.formError = this.getErrorMessage(err, 'Create payment failed'); }
    });
  }

  payExisting(payment: Payment): void {
    this.paymentService.createRazorpayOrder(payment.id).subscribe({
      next: r => void this.startRazorpayCheckout(r.data),
      error: err => alert(this.getErrorMessage(err, 'Unable to start Razorpay checkout'))
    });
  }

  private async startRazorpayCheckout(order: RazorpayOrderResponse): Promise<void> {
    if (order.razorpayOrderId.startsWith('order_mock_')) {
      // Mock mode: show selection modal
      this.pendingMockOrder = order;
      this.mockPaidAmount = this.getPoBalance(order.payment); // Default to remaining balance
      this.showMockModal = true;
      return;
    }

    try {
      await this.thirdPartyScriptService.load('razorpay-checkout');
    } catch {
      alert('Razorpay checkout could not be loaded. Please check your internet connection.');
      this.load();
      return;
    }

    const razorpayConstructor = (globalThis as typeof globalThis & { Razorpay?: new (options: unknown) => { open(): void } }).Razorpay;
    if (razorpayConstructor === undefined) {
      alert('Razorpay checkout could not be loaded. Please check your internet connection.');
      this.load();
      return;
    }

    const options = {
      key: order.razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: 'StockPro',
      description: `Payment for PO #${order.payment.purchaseOrderId}`,
      order_id: order.razorpayOrderId,
      handler: (response: any) => {
        this.paymentService.verifyRazorpayPayment({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        }).subscribe({
          next: () => this.load(),
          error: err => alert(this.getErrorMessage(err, 'Payment verification failed'))
        });
      },
      modal: {
        ondismiss: () => this.load()
      },
      theme: {
        color: '#212529'
      }
    };

    new razorpayConstructor(options).open();
  }

  completeMockPayment(method: string): void {
    if (!this.pendingMockOrder) return;
    
    this.loading = true;
    this.paymentService.verifyRazorpayPayment({
      razorpayOrderId: this.pendingMockOrder.razorpayOrderId,
      razorpayPaymentId: `pay_mock_${method}_${this.createMockPaymentId()}`,
      razorpaySignature: 'mock_signature',
      mockPaidAmount: this.mockPaidAmount
    }).subscribe({
      next: () => {
        this.loading = false;
        this.closeAllModals();
        this.load();
      },
      error: err => {
        this.loading = false;
        alert(this.getErrorMessage(err, 'Mock payment verification failed'));
      }
    });
  }

  markFailed(payment: Payment): void {
    const reason = prompt('Reason for failed payment?');
    if (!reason) return;
    this.paymentService.markFailed(payment.id, reason).subscribe({
      next: () => this.load(),
      error: err => alert(this.getErrorMessage(err, 'Mark failed failed'))
    });
  }

  cancel(payment: Payment): void {
    const reason = prompt('Reason for cancellation?');
    if (!reason) return;
    this.paymentService.cancel(payment.id, reason).subscribe({
      next: () => this.load(),
      error: err => alert(this.getErrorMessage(err, 'Cancel failed'))
    });
  }

  isOverdue(payment: Payment): boolean {
    if (!payment.dueDate) return false;
    const status = this.getDisplayStatus(payment);
    return (status === 'PENDING' || status === 'PARTIAL') && new Date(payment.dueDate) < new Date();
  }

  getPoTotalAmount(payment: Payment): number {
    return this.purchaseOrders.find(po => po.id === payment.purchaseOrderId)?.totalAmount ?? payment.amount;
  }

  getPoPaidAmount(payment: Payment): number {
    return this.payments
      .filter(p => p.purchaseOrderId === payment.purchaseOrderId && p.status !== 'CANCELLED')
      .reduce((sum, p) => sum + (p.paidAmount ?? 0), 0);
  }

  getPoBalance(payment: Payment): number {
    return Math.max(0, this.getPoTotalAmount(payment) - this.getPoPaidAmount(payment));
  }

  getDisplayStatus(payment: Payment): PaymentStatus {
    if (payment.status === 'CANCELLED' || payment.status === 'FAILED') {
      return payment.status;
    }

    const total = this.getPoTotalAmount(payment);
    const paid = this.getPoPaidAmount(payment);

    if (paid <= 0) {
      return 'PENDING';
    }
    if (paid < total) {
      return 'PARTIAL';
    }
    return 'PAID';
  }

  private matchesFilter(payment: Payment, filter: PaymentFilterValue): boolean {
    if (filter === 'ALL') {
      return true;
    }

    const status = this.getDisplayStatus(payment);
    if (filter === 'UNPAID') {
      return status === 'PENDING';
    }

    return status === filter;
  }

  canPay(payment: Payment): boolean {
    const status = this.getDisplayStatus(payment);
    return status === 'PENDING' || status === 'FAILED' || status === 'PARTIAL';
  }

  canMarkFailed(payment: Payment): boolean {
    const status = this.getDisplayStatus(payment);
    return status === 'PENDING' || status === 'PARTIAL';
  }

  canCancel(payment: Payment): boolean {
    const status = this.getDisplayStatus(payment);
    return status !== 'PAID' && status !== 'CANCELLED';
  }

  getStatusBadge(status: PaymentStatus): string {
    const map: Record<string, string> = {
      PENDING: 'bg-warning text-dark',
      PARTIAL: 'bg-info text-dark',
      PAID: 'bg-success',
      FAILED: 'bg-danger',
      CANCELLED: 'bg-secondary'
    };
    return map[status] ?? 'bg-secondary';
  }

  getSupplierName(supplierId: number): string {
    return this.suppliers.find(s => s.id === supplierId)?.name ?? `Supplier #${supplierId}`;
  }

  getMethodLabel(method: PaymentMethod): string {
    const map: Record<PaymentMethod, string> = {
      BANK_TRANSFER: 'Bank Transfer',
      UPI: 'UPI',
      CARD: 'Card',
      CASH: 'Cash',
      CHEQUE: 'Cheque',
      RAZORPAY: 'Razorpay'
    };
    return map[method];
  }

  emptyPayment(): PaymentRequest {
    return {
      purchaseOrderId: 0,
      supplierId: 0,
      amount: 0,
      dueDate: '',
      notes: ''
    };
  }

  private getErrorMessage(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error || err?.message || fallback;
  }

  private validateNewPayment(): string {
    if (!this.newPayment.purchaseOrderId || !this.newPayment.supplierId || !this.newPayment.amount) {
      return 'Purchase order, supplier and amount are required';
    }
    if (this.newPayment.amount <= 0) {
      return 'Payment amount must be greater than zero';
    }
    if ((this.newPayment.notes ?? '').trim().length > 500) {
      return 'Notes cannot exceed 500 characters';
    }
    return '';
  }

  private createMockPaymentId(): string {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replaceAll('-', '');
    }

    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
