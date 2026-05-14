import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { Alert, AlertType, AlertSeverity } from '../../../core/models/models';

@Component({
  selector: 'app-alert-centre',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1">
          <i class="bi bi-bell text-danger me-2"></i>Alert Centre
        </h2>
        <p class="text-muted mb-0">
          {{ unreadCount }} unread · {{ alerts.length }} total
        </p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" (click)="markAllRead()"
                [disabled]="unreadCount === 0">
          <i class="bi bi-check-all me-1"></i>Mark All Read
        </button>
        <button class="btn btn-outline-secondary btn-sm" (click)="load()">
          <i class="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body py-2">
        <div class="d-flex gap-2 flex-wrap align-items-center">
          <div class="btn-group btn-group-sm me-3">
            <button class="btn" [class]="readFilter === 'all' ? 'btn-dark' : 'btn-outline-secondary'"
                    (click)="readFilter = 'all'; applyFilter()">All</button>
            <button class="btn" [class]="readFilter === 'unread' ? 'btn-dark' : 'btn-outline-secondary'"
                    (click)="readFilter = 'unread'; applyFilter()">
              Unread <span class="badge bg-danger ms-1">{{ unreadCount }}</span>
            </button>
            <button class="btn" [class]="readFilter === 'acknowledged' ? 'btn-dark' : 'btn-outline-secondary'"
                    (click)="readFilter = 'acknowledged'; applyFilter()">Acknowledged</button>
          </div>

          <select class="form-select form-select-sm" style="width:auto"
                  [(ngModel)]="typeFilter" (ngModelChange)="applyFilter()">
            <option value="">All Types</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OVERSTOCK">Overstock</option>
            <option value="PO_PENDING">PO Pending</option>
            <option value="OVERDUE_RECEIPT">Overdue Receipt</option>
            <option value="SYSTEM">System</option>
          </select>

          <select class="form-select form-select-sm" style="width:auto"
                  [(ngModel)]="severityFilter" (ngModelChange)="applyFilter()">
            <option value="">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-overlay" *ngIf="loading">
      <div class="text-center">
        <div class="spinner-border text-danger mb-2"></div>
        <p class="text-muted">Loading alerts...</p>
      </div>
    </div>

    <!-- Alert List -->
    <div *ngIf="!loading">
      <div *ngFor="let alert of filtered"
           class="card border-0 shadow-sm mb-3"
           [class]="'severity-' + alert.severity.toLowerCase()"
           [class.opacity-75]="alert.isAcknowledged">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div class="d-flex gap-3 flex-grow-1">

              <!-- Severity Icon -->
              <div class="flex-shrink-0 mt-1">
                <i [class]="getSeverityIcon(alert.severity) + ' fs-4 ' + getSeverityColor(alert.severity)"></i>
              </div>

              <!-- Content -->
              <div class="flex-grow-1">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <h6 class="fw-bold mb-0" [class.text-muted]="isRead(alert)">{{ alert.title }}</h6>
                  <span class="badge" [class]="getSeverityBadge(alert.severity)">{{ alert.severity }}</span>
                  <span class="badge bg-light text-dark border">{{ getTypeLabel(alert.type) }}</span>
                  <span class="badge bg-secondary" *ngIf="!isRead(alert)">NEW</span>
                  <span class="badge bg-success" *ngIf="isAck(alert)">
                    <i class="bi bi-check me-1"></i>Acknowledged
                  </span>
                </div>
                <p class="text-muted mb-1 small">{{ alert.message }}</p>
                <small class="text-muted">
                  <i class="bi bi-clock me-1"></i>{{ alert.createdAt | date:'dd MMM yyyy HH:mm' }}
                  <span *ngIf="alert.channel === 'EMAIL'" class="ms-2">
                    <i class="bi bi-envelope me-1"></i>Email sent
                  </span>
                </small>
              </div>
            </div>

            <!-- Actions -->
            <div class="alert-actions d-flex gap-2 flex-shrink-0 ms-3">
              <button class="action-btn read-btn" (click)="markRead(alert)"
                      *ngIf="!isRead(alert)" title="Mark as Read">
                <i class="bi bi-check2"></i>
              </button>
              <button class="action-btn ack-btn" (click)="acknowledge(alert)"
                      *ngIf="!isAck(alert)" title="Acknowledge">
                <i class="bi bi-check2-all"></i>
              </button>
              <button class="action-btn delete-btn" (click)="deleteAlert(alert)"
                      *ngIf="authService.isAdmin()" title="Delete">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="card border-0 shadow-sm" *ngIf="filtered.length === 0">
        <div class="card-body text-center py-5">
          <i class="bi bi-bell-slash fs-1 text-secondary d-block mb-3"></i>
          <h5 class="text-muted">No alerts found</h5>
          <p class="text-muted small">
            {{ readFilter === 'unread' ? 'You have no unread alerts.' : 'No alerts match your filters.' }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .severity-info     { border-left: 5px solid #0dcaf0 !important; }
    .severity-warning  { border-left: 5px solid #ffc107 !important; }
    .severity-critical { border-left: 5px solid #dc3545 !important; }

    .card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border-radius: 12px;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      background: #f8f9fa;
      color: #6c757d;
    }

    .read-btn:hover { background: #e9ecef; color: #343a40; }
    .ack-btn:hover  { background: #d1e7dd; color: #0f5132; }
    .delete-btn:hover { background: #f8d7da; color: #842029; }

    .action-btn i { font-size: 1.1rem; }
  `]
})
export class AlertCentreComponent implements OnInit {
  alerts:   Alert[] = [];
  filtered: Alert[] = [];

  readFilter     = 'all';
  typeFilter     = '';
  severityFilter = '';

  loading     = false;
  unreadCount = 0;

  constructor(
    private readonly alertService: AlertService,
    public readonly authService: AuthService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.alertService.getMyAlerts().subscribe({
      next: r => {
        this.alerts = (r.data ?? []).sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.unreadCount = this.alerts.filter(a => !a.isRead).length;
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    this.filtered = this.alerts.filter(a => {
      const matchRead = this.readFilter === 'all'
        || (this.readFilter === 'unread'       && !this.isRead(a))
        || (this.readFilter === 'acknowledged' &&  this.isAck(a));
      const matchType     = !this.typeFilter     || a.type     === this.typeFilter;
      const matchSeverity = !this.severityFilter || a.severity === this.severityFilter;
      return matchRead && matchType && matchSeverity;
    });
  }

  markRead(alert: Alert): void {
    console.log('ALERT DEBUG - Marking as read:', alert.id);
    this.alertService.markAsRead(alert.id).subscribe({
      next: res => {
        console.log('ALERT DEBUG - Full Data:', JSON.stringify(res.data));
        // Replace or update local data
        this.alerts = this.alerts.map(a => a.id === alert.id ? res.data : a);
        this.unreadCount = this.alerts.filter(a => !this.isRead(a)).length;
        this.applyFilter();
      },
      error: err => console.error('ALERT DEBUG - Mark as read FAILED:', err)
    });
  }

  markAllRead(): void {
    this.alertService.markAllRead().subscribe({ next: () => this.load() });
  }

  acknowledge(alert: Alert): void {
    console.log('ALERT DEBUG - Acknowledging alert:', alert.id);
    this.alertService.acknowledge(alert.id).subscribe({
      next: res => {
        console.log('ALERT DEBUG - Acknowledge success:', res);
        this.alerts = this.alerts.map(a => a.id === alert.id ? res.data : a);
        this.unreadCount = this.alerts.filter(a => !this.isRead(a)).length;
        this.applyFilter();
      },
      error: err => console.error('ALERT DEBUG - Acknowledge FAILED:', err)
    });
  }

  deleteAlert(alert: Alert): void {
    if (!confirm('Delete this alert?')) return;
    this.alertService.delete(alert.id).subscribe({
      next: () => {
        this.alerts = this.alerts.filter(a => a.id !== alert.id);
        this.unreadCount = this.alerts.filter(a => !this.isRead(a)).length;
        this.applyFilter();
      }
    });
  }

  isRead(a: Alert): boolean {
    return a.isRead || (a as any).read === true;
  }

  isAck(a: Alert): boolean {
    return a.isAcknowledged || (a as any).acknowledged === true;
  }

  getSeverityIcon(severity: AlertSeverity): string {
    const map: Record<string, string> = {
      INFO: 'bi bi-info-circle-fill',
      WARNING: 'bi bi-exclamation-triangle-fill',
      CRITICAL: 'bi bi-x-octagon-fill'
    };
    return map[severity] ?? 'bi bi-bell';
  }

  getSeverityColor(severity: AlertSeverity): string {
    const map: Record<string, string> = {
      INFO: 'text-info', WARNING: 'text-warning', CRITICAL: 'text-danger'
    };
    return map[severity] ?? 'text-secondary';
  }

  getSeverityBadge(severity: AlertSeverity): string {
    const map: Record<string, string> = {
      INFO: 'bg-info text-dark', WARNING: 'bg-warning text-dark', CRITICAL: 'bg-danger'
    };
    return map[severity] ?? 'bg-secondary';
  }

  getTypeLabel(type: AlertType): string {
    const map: Record<string, string> = {
      LOW_STOCK: 'Low Stock', OVERSTOCK: 'Overstock', PO_PENDING: 'PO Pending',
      OVERDUE_RECEIPT: 'Overdue', SYSTEM: 'System'
    };
    return map[type] ?? type;
  }
}
