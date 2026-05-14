import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import {
  ApiResponse, Product, ProductRequest,
  Warehouse, WarehouseRequest, StockLevel, TransferRequest,
  Supplier, SupplierRequest,
  PurchaseOrder, PurchaseOrderRequest, ReceiveGoodsRequest,
  Payment, PaymentRequest, PaymentStatus, RazorpayOrderResponse, RazorpayVerifyRequest, SupplierReturnAdjustmentRequest,
  StockMovement, MovementRequest, MovementType,
  Alert,
  StockValuation, TurnoverReport, TopMovingProduct, DeadStock, POSummary
} from '../models/models';

const API = '/api/v1';

// =====================================================================
// PRODUCT SERVICE
// =====================================================================
@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${API}/products`);
  }
  getActive(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${API}/products/active`);
  }
  getById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${API}/products/${id}`);
  }
  getBySku(sku: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${API}/products/sku/${sku}`);
  }
  getByCategory(category: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${API}/products/category/${category}`);
  }
  search(keyword: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${API}/products/search`, {
      params: new HttpParams().set('keyword', keyword)
    });
  }
  create(request: ProductRequest): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${API}/products`, request);
  }
  update(id: number, request: ProductRequest): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${API}/products/${id}`, request);
  }
  deactivate(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/products/${id}/deactivate`, {});
  }
  activate(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/products/${id}/activate`, {});
  }
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/products/${id}`);
  }
}

// =====================================================================
// WAREHOUSE SERVICE
// =====================================================================
@Injectable({ providedIn: 'root' })
export class WarehouseService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<Warehouse[]>> {
    return this.http.get<ApiResponse<Warehouse[]>>(`${API}/warehouses`);
  }
  getActive(): Observable<ApiResponse<Warehouse[]>> {
    return this.http.get<ApiResponse<Warehouse[]>>(`${API}/warehouses/active`);
  }
  getById(id: number): Observable<ApiResponse<Warehouse>> {
    return this.http.get<ApiResponse<Warehouse>>(`${API}/warehouses/${id}`);
  }
  create(request: WarehouseRequest): Observable<ApiResponse<Warehouse>> {
    return this.http.post<ApiResponse<Warehouse>>(`${API}/warehouses`, request);
  }
  update(id: number, request: WarehouseRequest): Observable<ApiResponse<Warehouse>> {
    return this.http.put<ApiResponse<Warehouse>>(`${API}/warehouses/${id}`, request);
  }
  deactivate(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/warehouses/${id}/deactivate`, {});
  }
  getStockByWarehouse(warehouseId: number): Observable<ApiResponse<StockLevel[]>> {
    return this.http.get<ApiResponse<StockLevel[]>>(`${API}/warehouses/${warehouseId}/stock`);
  }
  getStockByProduct(productId: number): Observable<ApiResponse<StockLevel[]>> {
    return this.http.get<ApiResponse<StockLevel[]>>(`${API}/warehouses/stock/product/${productId}`);
  }
  getLowStock(): Observable<ApiResponse<StockLevel[]>> {
    return this.http.get<ApiResponse<StockLevel[]>>(`${API}/warehouses/stock/low-stock`);
  }
  getOverstock(): Observable<ApiResponse<StockLevel[]>> {
    return this.http.get<ApiResponse<StockLevel[]>>(`${API}/warehouses/stock/overstock`);
  }
  transferStock(request: TransferRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/warehouses/stock/transfer`, request);
  }
}

// =====================================================================
// SUPPLIER SERVICE
// =====================================================================
@Injectable({ providedIn: 'root' })
export class SupplierService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(`${API}/suppliers`);
  }
  getActive(): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(`${API}/suppliers/active`);
  }
  getById(id: number): Observable<ApiResponse<Supplier>> {
    return this.http.get<ApiResponse<Supplier>>(`${API}/suppliers/${id}`);
  }
  search(keyword: string): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(`${API}/suppliers/search`, {
      params: new HttpParams().set('keyword', keyword)
    });
  }
  getTopRated(): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(`${API}/suppliers/top-rated`);
  }
  create(request: SupplierRequest): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(`${API}/suppliers`, request);
  }
  update(id: number, request: SupplierRequest): Observable<ApiResponse<Supplier>> {
    return this.http.put<ApiResponse<Supplier>>(`${API}/suppliers/${id}`, request);
  }
  rate(id: number, rating: number, comment?: string): Observable<ApiResponse<Supplier>> {
    return this.http.put<ApiResponse<Supplier>>(`${API}/suppliers/${id}/rating`, { rating, comment });
  }
  deactivate(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/suppliers/${id}/deactivate`, {});
  }
}

// =====================================================================
// PURCHASE ORDER SERVICE
// =====================================================================
@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<PurchaseOrder[]>> {
    return this.http.get<ApiResponse<PurchaseOrder[]>>(`${API}/purchase-orders`);
  }
  getById(id: number): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.get<ApiResponse<PurchaseOrder>>(`${API}/purchase-orders/${id}`);
  }
  getByStatus(status: string): Observable<ApiResponse<PurchaseOrder[]>> {
    return this.http.get<ApiResponse<PurchaseOrder[]>>(`${API}/purchase-orders/status/${status}`);
  }
  getOverdue(): Observable<ApiResponse<PurchaseOrder[]>> {
    return this.http.get<ApiResponse<PurchaseOrder[]>>(`${API}/purchase-orders/overdue`);
  }
  create(request: PurchaseOrderRequest): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(`${API}/purchase-orders`, request);
  }
  update(id: number, request: PurchaseOrderRequest): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.put<ApiResponse<PurchaseOrder>>(`${API}/purchase-orders/${id}`, request);
  }
  submit(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/purchase-orders/${id}/submit`, {});
  }
  approve(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/purchase-orders/${id}/approve`, {});
  }
  reject(id: number, reason: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/purchase-orders/${id}/reject`, null, {
      params: new HttpParams().set('reason', reason)
    });
  }
  cancel(id: number, reason: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/purchase-orders/${id}/cancel`, null, {
      params: new HttpParams().set('reason', reason)
    });
  }
  receiveGoods(id: number, receipts: ReceiveGoodsRequest[]): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(`${API}/purchase-orders/${id}/receive`, receipts);
  }
}

// =====================================================================
// PAYMENT SERVICE
// =====================================================================
@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${API}/payments`);
  }
  getById(id: number): Observable<ApiResponse<Payment>> {
    return this.http.get<ApiResponse<Payment>>(`${API}/payments/${id}`);
  }
  getByPurchaseOrder(purchaseOrderId: number): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${API}/payments/purchase-order/${purchaseOrderId}`);
  }
  getBySupplier(supplierId: number): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${API}/payments/supplier/${supplierId}`);
  }
  getByStatus(status: PaymentStatus): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${API}/payments/status/${status}`);
  }
  getOverdue(): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${API}/payments/overdue`);
  }
  create(request: PaymentRequest): Observable<ApiResponse<RazorpayOrderResponse>> {
    return this.http.post<ApiResponse<RazorpayOrderResponse>>(`${API}/payments`, request);
  }
  createRazorpayOrder(id: number): Observable<ApiResponse<RazorpayOrderResponse>> {
    return this.http.post<ApiResponse<RazorpayOrderResponse>>(`${API}/payments/${id}/razorpay-order`, {});
  }
  verifyRazorpayPayment(request: RazorpayVerifyRequest): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(`${API}/payments/razorpay-verify`, request);
  }
  markFailed(id: number, reason: string): Observable<ApiResponse<Payment>> {
    return this.http.put<ApiResponse<Payment>>(`${API}/payments/${id}/failed`, null, {
      params: new HttpParams().set('reason', reason)
    });
  }
    cancel(id: number, reason: string): Observable<ApiResponse<void>> {
      return this.http.put<ApiResponse<void>>(`${API}/payments/${id}/cancel`, null, {
        params: new HttpParams().set('reason', reason)
      });
    }
  getByDateRange(from: string, to: string): Observable<ApiResponse<Payment[]>> {
      return this.http.get<ApiResponse<Payment[]>>(`${API}/payments/filter`, {
        params: new HttpParams().set('from', from).set('to', to)
      });
    }
    applySupplierReturn(purchaseOrderId: number, request: SupplierReturnAdjustmentRequest): Observable<ApiResponse<Payment>> {
      return this.http.post<ApiResponse<Payment>>(`${API}/payments/purchase-order/${purchaseOrderId}/supplier-return`, request);
    }
}

// =====================================================================
// STOCK MOVEMENT SERVICE
// =====================================================================
@Injectable({ providedIn: 'root' })
export class MovementService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<StockMovement[]>> {
    return this.http.get<ApiResponse<StockMovement[]>>(`${API}/movements`);
  }
  getByProduct(productId: number): Observable<ApiResponse<StockMovement[]>> {
    return this.http.get<ApiResponse<StockMovement[]>>(`${API}/movements/product/${productId}`);
  }
  getByWarehouse(warehouseId: number): Observable<ApiResponse<StockMovement[]>> {
    return this.http.get<ApiResponse<StockMovement[]>>(`${API}/movements/warehouse/${warehouseId}`);
  }
  getByType(type: MovementType): Observable<ApiResponse<StockMovement[]>> {
    return this.http.get<ApiResponse<StockMovement[]>>(`${API}/movements/type/${type}`);
  }
  getHistory(productId: number, warehouseId: number): Observable<ApiResponse<StockMovement[]>> {
    return this.http.get<ApiResponse<StockMovement[]>>(`${API}/movements/history`, {
      params: new HttpParams().set('productId', productId).set('warehouseId', warehouseId)
    });
  }
  record(request: MovementRequest): Observable<ApiResponse<StockMovement>> {
    return this.http.post<ApiResponse<StockMovement>>(`${API}/movements`, request);
  }
}

// =====================================================================
// ALERT SERVICE
// =====================================================================
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly alertsChanged = new Subject<void>();
  alertsChanged$ = this.alertsChanged.asObservable();

  constructor(private readonly http: HttpClient) {}

  notify(): void { this.alertsChanged.next(); }

  private getCurrentUserId(): number | null {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;

    try {
      const user = JSON.parse(rawUser) as { userId?: number };
      return typeof user.userId === 'number' ? user.userId : null;
    } catch {
      return null;
    }
  }

  private getCurrentUserParams(): HttpParams {
    const userId = this.getCurrentUserId();
    return userId == null ? new HttpParams() : new HttpParams().set('userId', String(userId));
  }

  getMyAlerts(): Observable<ApiResponse<Alert[]>> {
    return this.http.get<ApiResponse<Alert[]>>(`${API}/alerts/my`, {
      params: this.getCurrentUserParams()
    });
  }
  getMyUnread(): Observable<ApiResponse<Alert[]>> {
    return this.http.get<ApiResponse<Alert[]>>(`${API}/alerts/my/unread`, {
      params: this.getCurrentUserParams()
    });
  }
  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${API}/alerts/my/unread/count`, {
      params: this.getCurrentUserParams()
    });
  }
  getAll(): Observable<ApiResponse<Alert[]>> {
    return this.http.get<ApiResponse<Alert[]>>(`${API}/alerts`);
  }
  markAsRead(id: number): Observable<ApiResponse<Alert>> {
    return this.http.put<ApiResponse<Alert>>(`${API}/alerts/${id}/read`, {}).pipe(
      tap(() => this.notify())
    );
  }
  markAllRead(): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/alerts/my/read-all`, {}, {
      params: this.getCurrentUserParams()
    }).pipe(tap(() => this.notify()));
  }
  acknowledge(id: number): Observable<ApiResponse<Alert>> {
    return this.http.put<ApiResponse<Alert>>(`${API}/alerts/${id}/acknowledge`, {}).pipe(
      tap(() => this.notify())
    );
  }
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/alerts/${id}`).pipe(
      tap(() => this.notify())
    );
  }
}

// =====================================================================
// REPORT SERVICE
// =====================================================================
@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private readonly http: HttpClient) {}

  getTotalStockValue(): Observable<ApiResponse<StockValuation>> {
    return this.http.get<ApiResponse<StockValuation>>(`${API}/reports/valuation/total`);
  }
  getStockValueByWarehouse(warehouseId: number): Observable<ApiResponse<StockValuation>> {
    return this.http.get<ApiResponse<StockValuation>>(`${API}/reports/valuation/warehouse/${warehouseId}`);
  }
  getTurnover(from: string, to: string): Observable<ApiResponse<TurnoverReport>> {
    return this.http.get<ApiResponse<TurnoverReport>>(`${API}/reports/turnover`, {
      params: new HttpParams().set('from', from).set('to', to)
    });
  }
  getTopMoving(topN: number = 10): Observable<ApiResponse<TopMovingProduct[]>> {
    return this.http.get<ApiResponse<TopMovingProduct[]>>(`${API}/reports/products/top-moving`, {
      params: new HttpParams().set('topN', topN)
    });
  }
  getSlowMoving(days: number = 30): Observable<ApiResponse<TopMovingProduct[]>> {
    return this.http.get<ApiResponse<TopMovingProduct[]>>(`${API}/reports/products/slow-moving`, {
      params: new HttpParams().set('thresholdDays', days)
    });
  }
  getDeadStock(days: number = 90): Observable<ApiResponse<DeadStock[]>> {
    return this.http.get<ApiResponse<DeadStock[]>>(`${API}/reports/products/dead-stock`, {
      params: new HttpParams().set('days', days)
    });
  }
  getPOSummary(from: string, to: string): Observable<ApiResponse<POSummary>> {
    return this.http.get<ApiResponse<POSummary>>(`${API}/reports/po-summary`, {
      params: new HttpParams().set('from', from).set('to', to)
    });
  }
  takeSnapshot(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/reports/snapshot`, {});
  }
}
