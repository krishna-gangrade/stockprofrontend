import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/api.services';
import { StockValuation, TurnoverReport, TopMovingProduct, DeadStock, POSummary } from '../../../core/models/models';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1">
          <i class="bi bi-bar-chart text-primary me-2"></i>Reports & Analytics
        </h2>
        <p class="text-muted mb-0">Inventory intelligence dashboard</p>
      </div>
      <button class="btn btn-outline-secondary btn-sm" (click)="takeSnapshot()">
        <i class="bi bi-camera me-1"></i>Take Snapshot
      </button>
    </div>

    <!-- Date Range Selector -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="row g-2 align-items-center">
          <div class="col-auto"><label class="form-label mb-0 fw-semibold">Date Range:</label></div>
          <div class="col-auto">
            <input type="date" class="form-control form-control-sm" [(ngModel)]="fromDate">
          </div>
          <div class="col-auto"><span class="text-muted">to</span></div>
          <div class="col-auto">
            <input type="date" class="form-control form-control-sm" [(ngModel)]="toDate">
          </div>
          <div class="col-auto">
            <button class="btn btn-dark btn-sm" (click)="loadAll()" [disabled]="loading">
              <i class="bi" [class]="loading ? 'spinner-border spinner-border-sm me-1' : 'bi-arrow-clockwise me-1'"></i>
              {{ loading ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Valuation & Turnover Row -->
    <div class="row g-3 mb-4">
      <!-- Total Stock Value -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-success text-white py-3">
            <h6 class="mb-0 fw-bold"><i class="bi bi-currency-rupee me-2"></i>Total Stock Value</h6>
          </div>
          <div class="card-body text-center py-4">
            <div class="display-6 fw-bold text-success mb-1">
              ₹{{ valuation?.totalValue | number:'1.0-0' }}
            </div>
            <p class="text-muted mb-0">{{ valuation?.totalProducts }} products · as of {{ valuation?.asOfDate | date }}</p>
          </div>
        </div>
      </div>

      <!-- Inventory Turnover -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-primary text-white py-3">
            <h6 class="mb-0 fw-bold"><i class="bi bi-arrow-repeat me-2"></i>Inventory Turnover</h6>
          </div>
          <div class="card-body text-center py-4">
            <div class="display-6 fw-bold text-primary mb-1">
              {{ turnover?.turnoverRate | number:'1.2-2' }}x
            </div>
            <p class="text-muted mb-1">COGS: ₹{{ turnover?.totalCOGS | number:'1.0-0' }}</p>
            <p class="text-muted mb-0">Avg Inventory: ₹{{ turnover?.averageInventoryValue | number:'1.0-0' }}</p>
          </div>
        </div>
      </div>

      <!-- PO Summary -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-warning py-3">
            <h6 class="mb-0 fw-bold"><i class="bi bi-cart me-2"></i>PO Summary</h6>
          </div>
          <div class="card-body py-3">
            <div class="row text-center g-2">
              <div class="col-6">
                <div class="fw-bold fs-4 text-primary">{{ poSummary?.totalPOs }}</div>
                <small class="text-muted">Total POs</small>
              </div>
              <div class="col-6">
                <div class="fw-bold fs-4 text-success">₹{{ poSummary?.totalSpend | number:'1.0-0' }}</div>
                <small class="text-muted">Total Spend</small>
              </div>
              <div class="col-4">
                <div class="fw-bold text-success">{{ poSummary?.approvedPOs }}</div>
                <small class="text-muted" style="font-size:10px">Approved</small>
              </div>
              <div class="col-4">
                <div class="fw-bold text-warning">{{ poSummary?.pendingPOs }}</div>
                <small class="text-muted" style="font-size:10px">Pending</small>
              </div>
              <div class="col-4">
                <div class="fw-bold text-danger">{{ poSummary?.cancelledPOs }}</div>
                <small class="text-muted" style="font-size:10px">Cancelled</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Moving + Slow Moving Row -->
    <div class="row g-3 mb-4">
      <!-- Top Moving Products -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
            <h6 class="fw-bold mb-0">
              <i class="bi bi-graph-up-arrow text-success me-2"></i>Top Moving Products
            </h6>
            <span class="badge bg-secondary">Top {{ topMoving.length }}</span>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th class="text-center">In</th>
                  <th class="text-center">Out</th>
                  <th class="text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of topMoving">
                  <td><span class="badge bg-primary">{{ p.rank }}</span></td>
                  <td>
                    <div class="fw-semibold small">{{ p.productName }}</div>
                    <small class="text-muted">{{ p.category }}</small>
                  </td>
                  <td class="text-center text-success fw-bold">{{ p.totalUnitsIn }}</td>
                  <td class="text-center text-danger fw-bold">{{ p.totalUnitsOut }}</td>
                  <td class="text-center fw-bold">{{ p.totalUnitsMoved }}</td>
                </tr>
                <tr *ngIf="topMoving.length === 0">
                  <td colspan="5" class="text-center text-muted py-3">No movement data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Dead Stock -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
            <h6 class="fw-bold mb-0">
              <i class="bi bi-archive text-danger me-2"></i>Dead Stock
              <small class="text-muted fw-normal">(90+ days no movement)</small>
            </h6>
            <span class="badge bg-danger">{{ deadStock.length }} items</span>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Product</th>
                  <th class="text-center">Qty</th>
                  <th class="text-end">Value</th>
                  <th class="text-center">Days Idle</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let d of deadStock.slice(0,8)">
                  <td>
                    <div class="fw-semibold small">{{ d.productName }}</div>
                    <code class="small text-muted">{{ d.productSku }}</code>
                  </td>
                  <td class="text-center">{{ d.currentQuantity }}</td>
                  <td class="text-end text-danger fw-semibold">₹{{ d.stockValue | number:'1.0-0' }}</td>
                  <td class="text-center">
                    <span class="badge bg-danger">{{ d.daysSinceLastMovement }}d</span>
                  </td>
                </tr>
                <tr *ngIf="deadStock.length === 0">
                  <td colspan="4" class="text-center text-muted py-3">
                    <i class="bi bi-check-circle text-success me-1"></i>No dead stock!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Slow Moving Products -->
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
        <h6 class="fw-bold mb-0">
          <i class="bi bi-graph-down text-warning me-2"></i>Slow Moving Products
          <small class="text-muted fw-normal">(no movement in 30 days)</small>
        </h6>
        <span class="badge bg-warning text-dark">{{ slowMoving.length }} products</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th class="text-center">Total In</th>
              <th class="text-center">Total Out</th>
              <th class="text-center">Total Moved</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of slowMoving.slice(0,8)">
              <td>
                <div class="fw-semibold small">{{ p.productName }}</div>
                <code class="small text-muted">{{ p.productSku }}</code>
              </td>
              <td><span class="badge bg-light text-dark border">{{ p.category }}</span></td>
              <td class="text-center text-success">{{ p.totalUnitsIn }}</td>
              <td class="text-center text-danger">{{ p.totalUnitsOut }}</td>
              <td class="text-center fw-bold">{{ p.totalUnitsMoved }}</td>
            </tr>
            <tr *ngIf="slowMoving.length === 0">
              <td colspan="5" class="text-center text-muted py-3">
                <i class="bi bi-check-circle text-success me-1"></i>All products are moving!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Snapshot Success Toast -->
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index:1100" *ngIf="snapshotTaken">
      <div class="toast show bg-success text-white">
        <div class="toast-body">
          <i class="bi bi-check-circle me-2"></i>Daily snapshot taken successfully!
        </div>
      </div>
    </div>
  `
})
export class ReportsPageComponent implements OnInit {
  valuation:  StockValuation | null  = null;
  turnover:   TurnoverReport | null  = null;
  topMoving:  TopMovingProduct[]     = [];
  slowMoving: TopMovingProduct[]     = [];
  deadStock:  DeadStock[]            = [];
  poSummary:  POSummary | null       = null;

  fromDate    = this.defaultFrom();
  toDate      = this.defaultTo();
  snapshotTaken = false;
  loading = false;

  constructor(private readonly reportService: ReportService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    let completed = 0;
    const totalRequests = 6;
    const check = () => { completed++; if (completed === totalRequests) this.loading = false; };

    this.reportService.getTotalStockValue().subscribe({ next: r => { this.valuation = r.data; check(); }, error: check });
    this.reportService.getTurnover(this.fromDate, this.toDate).subscribe({ next: r => { this.turnover = r.data; check(); }, error: check });
    this.reportService.getTopMoving(10).subscribe({ next: r => { this.topMoving = r.data ?? []; check(); }, error: check });
    this.reportService.getSlowMoving(30).subscribe({ next: r => { this.slowMoving = r.data ?? []; check(); }, error: check });
    this.reportService.getDeadStock(90).subscribe({ next: r => { this.deadStock = r.data ?? []; check(); }, error: check });
    this.reportService.getPOSummary(this.fromDate, this.toDate).subscribe({ next: r => { this.poSummary = r.data; check(); }, error: check });
  }

  takeSnapshot(): void {
    this.reportService.takeSnapshot().subscribe({
      next: () => {
        this.snapshotTaken = true;
        setTimeout(() => this.snapshotTaken = false, 3000);
      }
    });
  }

  defaultFrom(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }

  defaultTo(): string {
    return new Date().toISOString().split('T')[0];
  }
}
