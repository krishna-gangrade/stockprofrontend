import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { Supplier, SupplierRequest } from '../../../core/models/models';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1"><i class="bi bi-truck text-info me-2"></i>Suppliers</h2>
        <p class="text-muted mb-0">{{ filtered.length }} suppliers</p>
      </div>
      <button class="btn btn-dark" (click)="openModal()"
              *ngIf="authService.hasAnyRole('PURCHASE_OFFICER','ADMIN')">
        <i class="bi bi-plus-lg me-2"></i>Add Supplier
      </button>
    </div>

    <!-- Search Bar -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="row g-2">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-light"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" placeholder="Search by name or contact..."
                     [(ngModel)]="searchKeyword" (ngModelChange)="applyFilter()">
            </div>
          </div>
          <div class="col-md-3">
            <input type="text" class="form-control" placeholder="Filter by city..."
                   [(ngModel)]="cityFilter" (ngModelChange)="applyFilter()">
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="activeFilter" (ngModelChange)="applyFilter()">
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-overlay" *ngIf="loading">
      <div class="spinner-border text-info"></div>
    </div>

    <div class="card border-0 shadow-sm" *ngIf="!loading">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>City</th>
              <th>Payment Terms</th>
              <th class="text-center">Lead Time</th>
              <th class="text-center">Rating</th>
              <th class="text-center">Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of filtered">
              <td>
                <div class="fw-semibold">{{ s.name }}</div>
                <small class="text-muted">{{ s.email }}</small>
              </td>
              <td>
                <div class="small">{{ s.contactPerson }}</div>
                <small class="text-muted">{{ s.phone }}</small>
              </td>
              <td><small>{{ s.city }}{{ s.country ? ', ' + s.country : '' }}</small></td>
              <td><span class="badge bg-light text-dark border">{{ s.paymentTerms }}</span></td>
              <td class="text-center"><small>{{ s.leadTimeDays }}d</small></td>
              <td class="text-center">
                <div class="text-warning small">
                  <span *ngFor="let i of [1,2,3,4,5]">
                    <i [class]="i <= s.rating ? 'bi bi-star-fill' : 'bi bi-star'"></i>
                  </span>
                </div>
                <small class="text-muted">{{ s.rating | number:'1.1-1' }} ({{ s.ratingCount }})</small>
              </td>
              <td class="text-center">
                <span class="badge" [class]="s.isActive ? 'bg-success' : 'bg-secondary'">
                  {{ s.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="text-center">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary" (click)="openModal(s)"
                          *ngIf="authService.hasAnyRole('PURCHASE_OFFICER','ADMIN')" title="Edit">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-warning" (click)="openRateModal(s)" title="Rate">
                    <i class="bi bi-star"></i>
                  </button>
                  <button class="btn btn-outline-secondary"
                          *ngIf="s.isActive && authService.hasAnyRole('PURCHASE_OFFICER','ADMIN')"
                          (click)="deactivate(s)" title="Deactivate">
                    <i class="bi bi-pause-circle"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filtered.length === 0">
              <td colspan="8" class="text-center text-muted py-5">
                <i class="bi bi-truck fs-1 d-block mb-2 text-secondary"></i>No suppliers found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade show" *ngIf="showModal || showRateModal" (click)="closeAll()"></div>

    <!-- Create/Edit Modal -->
    <div class="modal show d-block" *ngIf="showModal" tabindex="-1">
      <div class="modal-dialog modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">
              <i class="bi bi-truck me-2"></i>{{ editing ? 'Edit Supplier' : 'Add Supplier' }}
            </h5>
            <button class="btn-close btn-close-white" (click)="closeAll()"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">Supplier Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.name">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Contact Person</label>
                <input type="text" class="form-control" [(ngModel)]="form.contactPerson">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Email <span class="text-danger">*</span></label>
                <input type="email" class="form-control" [(ngModel)]="form.email">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Phone</label>
                <input type="text" class="form-control" [(ngModel)]="form.phone">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">City</label>
                <input type="text" class="form-control" [(ngModel)]="form.city">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Country</label>
                <input type="text" class="form-control" [(ngModel)]="form.country">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Payment Terms</label>
                <select class="form-select" [(ngModel)]="form.paymentTerms">
                  <option value="IMMEDIATE">IMMEDIATE</option>
                  <option value="NET-15">NET-15</option>
                  <option value="NET-30">NET-30</option>
                  <option value="NET-60">NET-60</option>
                  <option value="NET-90">NET-90</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Lead Time (days)</label>
                <input type="number" class="form-control" [(ngModel)]="form.leadTimeDays" min="1">
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Address</label>
                <textarea class="form-control" rows="2" [(ngModel)]="form.address"></textarea>
              </div>
            </div>
            <div class="alert alert-danger mt-3" *ngIf="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAll()">Cancel</button>
            <button class="btn btn-dark" (click)="save()" [disabled]="saving">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="saving"></span>
              {{ editing ? 'Update' : 'Create' }} Supplier
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Rate Modal -->
    <div class="modal show d-block" *ngIf="showRateModal && selectedSupplier" tabindex="-1">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-star-fill me-2"></i>Rate Supplier — {{ selectedSupplier.name }}
            </h5>
            <button class="btn-close" (click)="closeAll()"></button>
          </div>
          <div class="modal-body text-center">
            <p class="text-muted mb-3">Current rating: <strong>{{ selectedSupplier.rating | number:'1.1-1' }}</strong> ({{ selectedSupplier.ratingCount }} reviews)</p>
            <div class="d-flex justify-content-center gap-2 mb-3">
              <button *ngFor="let i of [1,2,3,4,5]"
                      class="btn btn-lg"
                      [class]="i <= newRating ? 'btn-warning' : 'btn-outline-warning'"
                      (click)="newRating = i">
                <i class="bi bi-star-fill"></i> {{ i }}
              </button>
            </div>
            <textarea class="form-control" rows="2" [(ngModel)]="ratingComment" placeholder="Add a comment (optional)..."></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAll()">Cancel</button>
            <button class="btn btn-warning" (click)="submitRating()" [disabled]="newRating === 0">Submit Rating</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SupplierListComponent implements OnInit {
  suppliers: Supplier[] = [];
  filtered:  Supplier[] = [];

  searchKeyword = '';
  cityFilter    = '';
  activeFilter  = 'all';

  loading    = false;
  saving     = false;
  showModal  = false;
  showRateModal = false;
  editing    = false;
  editingId: number | null = null;
  formError  = '';
  selectedSupplier: Supplier | null = null;
  newRating    = 0;
  ratingComment = '';

  form: SupplierRequest = this.emptyForm();

  constructor(
    private readonly supplierService: SupplierService,
    public readonly authService: AuthService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.supplierService.getAll().subscribe({
      next: r => { this.suppliers = r.data ?? []; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    this.filtered = this.suppliers.filter(s => {
      const kw = this.searchKeyword.toLowerCase();
      const matchKw     = !kw || s.name.toLowerCase().includes(kw) || (s.contactPerson?.toLowerCase().includes(kw) ?? false);
      const matchCity   = !this.cityFilter || (s.city?.toLowerCase().includes(this.cityFilter.toLowerCase()) ?? false);
      const matchActive = this.activeFilter === 'all' || (this.activeFilter === 'active' && s.isActive) || (this.activeFilter === 'inactive' && !s.isActive);
      return matchKw && matchCity && matchActive;
    });
  }

  openModal(s?: Supplier): void {
    this.formError = '';
    this.editing   = !!s;
    this.editingId = s?.id ?? null;
    this.form      = s ? { name: s.name, contactPerson: s.contactPerson, email: s.email, phone: s.phone, address: s.address, city: s.city, country: s.country, paymentTerms: s.paymentTerms, leadTimeDays: s.leadTimeDays } : this.emptyForm();
    this.showModal = true;
  }

  openRateModal(s: Supplier): void {
    this.selectedSupplier = s;
    this.newRating = 0;
    this.ratingComment = '';
    this.showRateModal = true;
  }

  closeAll(): void { this.showModal = false; this.showRateModal = false; this.selectedSupplier = null; }

  save(): void {
    const validationMessage = this.validateForm();
    if (validationMessage) { this.formError = validationMessage; return; }
    this.saving = true; this.formError = '';
    const req$ = this.editing && this.editingId
      ? this.supplierService.update(this.editingId, this.form)
      : this.supplierService.create(this.form);
    req$.subscribe({
      next: () => { this.saving = false; this.closeAll(); this.load(); },
      error: err => { this.saving = false; this.formError = err.error?.message || 'Save failed'; }
    });
  }

  submitRating(): void {
    if (!this.selectedSupplier || this.newRating === 0) return;
    this.supplierService.rate(this.selectedSupplier.id, this.newRating, this.ratingComment).subscribe({
      next: () => { this.closeAll(); this.load(); }
    });
  }

  deactivate(s: Supplier): void {
    if (!confirm(`Deactivate "${s.name}"?`)) return;
    this.supplierService.deactivate(s.id).subscribe({ next: () => this.load() });
  }

  emptyForm(): SupplierRequest {
    return { name: '', contactPerson: '', email: '', phone: '', address: '', city: '', country: '', paymentTerms: 'NET-30', leadTimeDays: 7 };
  }

  private validateForm(): string {
    if (!this.form.name.trim() || !this.form.email.trim()) {
      return 'Name and email are required';
    }
    if (!this.isValidEmail(this.form.email.trim())) {
      return 'Enter a valid supplier email address';
    }
    if (this.form.leadTimeDays < 1) {
      return 'Lead time must be at least 1 day';
    }
    return '';
  }

  private isValidEmail(email: string): boolean {
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.value = email;
    return emailInput.checkValidity();
  }
}
