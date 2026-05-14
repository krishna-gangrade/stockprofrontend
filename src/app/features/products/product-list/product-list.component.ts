import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { Product, ProductRequest } from '../../../core/models/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1"><i class="bi bi-box text-primary me-2"></i>Products</h2>
        <p class="text-muted mb-0">{{ filtered.length }} of {{ products.length }} products</p>
      </div>
      <button class="btn btn-dark" (click)="openModal()"
              *ngIf="authService.hasAnyRole('INVENTORY_MANAGER','ADMIN')">
        <i class="bi bi-plus-lg me-2"></i>Add Product
      </button>
    </div>

    <div class="alert shadow-sm border-0 d-flex align-items-center gap-2"
         *ngIf="pageMessage"
         [class.alert-success]="pageMessageType === 'success'"
         [class.alert-danger]="pageMessageType === 'error'">
      <i class="bi" [class.bi-check-circle-fill]="pageMessageType === 'success'" [class.bi-x-circle-fill]="pageMessageType === 'error'"></i>
      <span>{{ pageMessage }}</span>
    </div>

    <!-- Search + Filter Bar -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="row g-2">
          <div class="col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-light"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" placeholder="Search by name, SKU, category..."
                     [(ngModel)]="searchKeyword" (ngModelChange)="applyFilter()">
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="selectedCategory" (ngModelChange)="applyFilter()">
              <option value="">All Categories</option>
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" [(ngModel)]="activeFilter" (ngModelChange)="applyFilter()">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-secondary w-100" (click)="clearFilter()">
              <i class="bi bi-x-circle me-1"></i>Clear
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-overlay" *ngIf="loading">
      <div class="text-center">
        <div class="spinner-border text-primary mb-2"></div>
        <p class="text-muted">Loading products...</p>
      </div>
    </div>

    <!-- Product Table -->
    <div class="card border-0 shadow-sm" *ngIf="!loading">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th class="text-end">Cost Price</th>
              <th class="text-end">Selling Price</th>
              <th class="text-center">Reorder Level</th>
              <th class="text-center">Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filtered">
              <td><code class="small">{{ p.sku }}</code></td>
              <td>
                <div class="fw-semibold">{{ p.name }}</div>
                <small class="text-muted">{{ p.brand }}</small>
              </td>
              <td><span class="badge bg-light text-dark border">{{ p.category }}</span></td>
              <td class="text-end">₹{{ p.costPrice | number:'1.2-2' }}</td>
              <td class="text-end">₹{{ p.sellingPrice | number:'1.2-2' }}</td>
              <td class="text-center">
                <span class="badge" [class]="p.reorderLevel > 0 ? 'bg-warning text-dark' : 'bg-secondary'">
                  {{ p.reorderLevel }}
                </span>
              </td>
              <td class="text-center">
                <span class="badge" [class]="p.active ? 'bg-success' : 'bg-secondary'">
                  {{ p.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="text-center">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary" (click)="openModal(p)" title="Edit"
                          *ngIf="authService.hasAnyRole('INVENTORY_MANAGER','ADMIN')">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-warning" (click)="deactivate(p)"
                          *ngIf="p.active && authService.hasAnyRole('INVENTORY_MANAGER','ADMIN')"
                          title="Deactivate">
                    <i class="bi bi-pause-circle"></i>
                  </button>
                  <button class="btn btn-outline-success" (click)="activate(p)"
                          *ngIf="!p.active && authService.hasAnyRole('INVENTORY_MANAGER','ADMIN')"
                          title="Activate">
                    <i class="bi bi-play-circle"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filtered.length === 0">
              <td colspan="8" class="text-center text-muted py-5">
                <i class="bi bi-box fs-1 d-block mb-2 text-secondary"></i>
                No products found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div class="modal show d-block" id="productModal" tabindex="-1" *ngIf="showModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">
              <i class="bi bi-box me-2"></i>{{ editing ? 'Edit Product' : 'Add New Product' }}
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">SKU <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.sku" placeholder="e.g. BOLT-M10-001">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Product Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.name">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Category <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.category" placeholder="e.g. Fasteners">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Brand</label>
                <input type="text" class="form-control" [(ngModel)]="form.brand">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Unit of Measure</label>
                <select class="form-select" [(ngModel)]="form.unitOfMeasure">
                  <option value="UNIT">UNIT</option>
                  <option value="KG">KG</option>
                  <option value="LITRE">LITRE</option>
                  <option value="METER">METER</option>
                  <option value="BOX">BOX</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Cost Price (₹)</label>
                <input type="number" class="form-control" [(ngModel)]="form.costPrice" min="0" step="0.01">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Selling Price (₹)</label>
                <input type="number" class="form-control" [(ngModel)]="form.sellingPrice" min="0" step="0.01">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Reorder Level</label>
                <input type="number" class="form-control" [(ngModel)]="form.reorderLevel" min="0">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Max Stock Level</label>
                <input type="number" class="form-control" [(ngModel)]="form.maxStockLevel" min="0">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Lead Time (days)</label>
                <input type="number" class="form-control" [(ngModel)]="form.leadTimeDays" min="1">
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Description</label>
                <textarea class="form-control" rows="2" [(ngModel)]="form.description"></textarea>
              </div>
              <div class="col-12">
                <div class="form-check form-switch mt-2">
                  <input class="form-check-input" type="checkbox" id="isActiveCheck" [(ngModel)]="form.active">
                  <label class="form-check-label fw-semibold" for="isActiveCheck">
                    Active (Visible in Purchase/Sales dropdowns)
                  </label>
                </div>
              </div>
            </div>
            <div class="alert alert-danger mt-3" *ngIf="formError">
              <i class="bi bi-exclamation-circle me-2"></i>{{ formError }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-dark" (click)="save()" [disabled]="saving">
              <span class="spinner-border spinner-border-sm me-2" *ngIf="saving"></span>
              {{ saving ? 'Saving...' : (editing ? 'Update Product' : 'Create Product') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="showModal || showConfirmModal" (click)="closeModal()"></div>

    <div class="modal show d-block" *ngIf="showConfirmModal" tabindex="-1">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title"><i class="bi bi-patch-question me-2"></i>{{ confirmTitle }}</h5>
            <button type="button" class="btn-close btn-close-white" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">{{ confirmMessage }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-dark" (click)="confirmStatusAction()" [disabled]="saving">
              <span class="spinner-border spinner-border-sm me-2" *ngIf="saving"></span>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  products:  Product[] = [];
  filtered:  Product[] = [];
  categories: string[] = [];

  searchKeyword    = '';
  selectedCategory = '';
  activeFilter     = 'all';

  loading  = false;
  showModal = false;
  showConfirmModal = false;
  editing   = false;
  saving    = false;
  formError = '';
  editingId: number | null = null;
  confirmTitle = '';
  confirmMessage = '';
  pendingProduct: Product | null = null;
  pendingAction: 'activate' | 'deactivate' | null = null;
  pageMessage = '';
  pageMessageType: 'success' | 'error' = 'success';

  form: ProductRequest = this.emptyForm();

  constructor(
    private readonly productService: ProductService,
    public readonly authService: AuthService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: r => {
        this.products = r.data ?? [];
        this.categories = [...new Set(this.products.map(p => p.category))]
          .sort((left, right) => left.localeCompare(right));
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    this.filtered = this.products.filter(p => {
      const kw = this.searchKeyword.toLowerCase();
      const matchKw = !kw || p.name.toLowerCase().includes(kw)
                           || p.sku.toLowerCase().includes(kw)
                           || p.category.toLowerCase().includes(kw);
      const matchCat    = !this.selectedCategory || p.category === this.selectedCategory;
      const matchActive = this.activeFilter === 'all'
                       || (this.activeFilter === 'active'   &&  p.active)
                       || (this.activeFilter === 'inactive' && !p.active);
      return matchKw && matchCat && matchActive;
    });
  }

  clearFilter(): void {
    this.searchKeyword = ''; this.selectedCategory = ''; this.activeFilter = 'all';
    this.applyFilter();
  }

  openModal(product?: Product): void {
    this.formError = '';
    if (product) {
      this.editing   = true;
      this.editingId = product.id;
      this.form = {
        sku: product.sku, name: product.name, description: product.description,
        category: product.category, brand: product.brand,
        unitOfMeasure: product.unitOfMeasure, costPrice: product.costPrice,
        sellingPrice: product.sellingPrice, reorderLevel: product.reorderLevel,
        maxStockLevel: product.maxStockLevel, leadTimeDays: product.leadTimeDays,
        imageUrl: product.imageUrl, active: product.active
      };
    } else {
      this.editing = false; this.editingId = null;
      this.form = this.emptyForm();
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.showConfirmModal = false;
    this.pendingProduct = null;
    this.pendingAction = null;
    this.confirmTitle = '';
    this.confirmMessage = '';
  }

  save(): void {
    const validationMessage = this.validateForm();
    if (validationMessage) {
      this.formError = validationMessage;
      return;
    }
    this.saving = true; this.formError = '';
    const req$ = this.editing && this.editingId
      ? this.productService.update(this.editingId, this.form)
      : this.productService.create(this.form);

    req$.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.load(); },
      error: err => { this.saving = false; this.formError = err.error?.message || 'Save failed'; }
    });
  }

  deactivate(p: Product): void {
    this.openConfirmModal(p, 'deactivate');
  }

  activate(p: Product): void {
    this.openConfirmModal(p, 'activate');
  }

  confirmStatusAction(): void {
    if (!this.pendingProduct || !this.pendingAction) return;
    this.saving = true;
    this.formError = '';

    const request = this.pendingAction === 'deactivate'
      ? this.productService.deactivate(this.pendingProduct.id)
      : this.productService.activate(this.pendingProduct.id);

    request.subscribe({
      next: () => {
        const actionLabel = this.pendingAction === 'deactivate' ? 'deactivated' : 'activated';
        this.saving = false;
        this.closeModal();
        this.setPageMessage('success', `"${this.pendingProduct?.name}" ${actionLabel} successfully.`);
        this.load();
      },
      error: err => {
        this.saving = false;
        this.setPageMessage('error', err?.error?.message || `${this.pendingAction === 'deactivate' ? 'Deactivate' : 'Activate'} failed`);
      }
    });
  }

  emptyForm(): ProductRequest {
    return { sku: '', name: '', description: '', category: '', brand: '',
             unitOfMeasure: 'UNIT', costPrice: 0, sellingPrice: 0,
             reorderLevel: 10, maxStockLevel: 500, leadTimeDays: 7,
             imageUrl: '', active: true };
  }

  private validateForm(): string {
    if (!this.form.sku.trim() || !this.form.name.trim() || !this.form.category.trim()) {
      return 'SKU, Name and Category are required';
    }
    if (this.form.costPrice < 0 || this.form.sellingPrice < 0) {
      return 'Cost price and selling price cannot be negative';
    }
    if (this.form.reorderLevel < 0 || this.form.maxStockLevel < 0) {
      return 'Stock levels cannot be negative';
    }
    if (this.form.leadTimeDays < 1) {
      return 'Lead time must be at least 1 day';
    }
    return '';
  }

  private openConfirmModal(product: Product, action: 'activate' | 'deactivate'): void {
    this.pendingProduct = product;
    this.pendingAction = action;
    this.confirmTitle = action === 'deactivate' ? 'Deactivate Product' : 'Activate Product';
    this.confirmMessage = action === 'deactivate'
      ? `Deactivate "${product.name}"?`
      : `Activate "${product.name}"?`;
    this.showConfirmModal = true;
  }

  private setPageMessage(type: 'success' | 'error', message: string): void {
    this.pageMessageType = type;
    this.pageMessage = message;
  }
}
