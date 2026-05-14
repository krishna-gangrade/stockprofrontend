import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // ===== Default redirect =====
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ===== Auth =====
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },

  // ===== Dashboards (role-specific) =====
  {
    path: 'dashboard',
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/dashboard/admin-dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'manager',
        canActivate: [roleGuard(['INVENTORY_MANAGER', 'ADMIN'])],
        loadComponent: () =>
          import('./features/dashboard/manager-dashboard/manager-dashboard.component')
            .then(m => m.ManagerDashboardComponent)
      },
      {
        path: 'officer',
        canActivate: [roleGuard(['PURCHASE_OFFICER', 'ADMIN'])],
        loadComponent: () =>
          import('./features/dashboard/officer-dashboard/officer-dashboard.component')
            .then(m => m.OfficerDashboardComponent)
      },
      {
        path: 'staff',
        canActivate: [roleGuard(['WAREHOUSE_STAFF', 'INVENTORY_MANAGER', 'ADMIN'])],
        loadComponent: () =>
          import('./features/dashboard/staff-dashboard/staff-dashboard.component')
            .then(m => m.StaffDashboardComponent)
      }
    ]
  },

  // ===== Products =====
  {
    path: 'products',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/products/product-list/product-list.component')
        .then(m => m.ProductListComponent)
  },

  // ===== Warehouses =====
  {
    path: 'warehouses',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/warehouses/warehouse-list/warehouse-list.component')
        .then(m => m.WarehouseListComponent)
  },

  // ===== Purchase Orders =====
  {
    path: 'purchase-orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/purchase-orders/po-list/po-list.component')
        .then(m => m.PoListComponent)
  },

  // ===== Payments =====
  {
    path: 'payments',
    canActivate: [roleGuard(['PURCHASE_OFFICER', 'INVENTORY_MANAGER', 'ADMIN'])],
    loadComponent: () =>
      import('./features/payments/payment-list/payment-list.component')
        .then(m => m.PaymentListComponent)
  },

  // ===== Suppliers =====
  {
    path: 'suppliers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/suppliers/supplier-list/supplier-list.component')
        .then(m => m.SupplierListComponent)
  },

  // ===== Stock Movements =====
  {
    path: 'movements',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/movements/movement-list/movement-list.component')
        .then(m => m.MovementListComponent)
  },

  // ===== Alerts =====
  {
    path: 'alerts',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/alerts/alert-centre/alert-centre.component')
        .then(m => m.AlertCentreComponent)
  },

  // ===== Reports =====
  {
    path: 'reports',
    canActivate: [roleGuard(['INVENTORY_MANAGER', 'ADMIN'])],
    loadComponent: () =>
      import('./features/reports/reports-page/reports-page.component')
        .then(m => m.ReportsPageComponent)
  },

  {
    path: 'docs',
    canActivate: [roleGuard(['ADMIN', 'INVENTORY_MANAGER'])],
    loadComponent: () =>
      import('./features/docs/api-docs/api-docs.component')
        .then(m => m.ApiDocsComponent)
  },

  // ===== Fallback =====
  { path: '**', redirectTo: 'login' }
];
