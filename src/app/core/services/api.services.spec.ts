import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  AlertService,
  MovementService,
  PaymentService,
  ProductService,
  PurchaseOrderService,
  ReportService,
  SupplierService,
  WarehouseService
} from './api.services';

describe('API services', () => {
  let httpMock: HttpTestingController;
  let productService: ProductService;
  let warehouseService: WarehouseService;
  let supplierService: SupplierService;
  let purchaseOrderService: PurchaseOrderService;
  let paymentService: PaymentService;
  let movementService: MovementService;
  let alertService: AlertService;
  let reportService: ReportService;

  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ userId: 42 }));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductService,
        WarehouseService,
        SupplierService,
        PurchaseOrderService,
        PaymentService,
        MovementService,
        AlertService,
        ReportService
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    productService = TestBed.inject(ProductService);
    warehouseService = TestBed.inject(WarehouseService);
    supplierService = TestBed.inject(SupplierService);
    purchaseOrderService = TestBed.inject(PurchaseOrderService);
    paymentService = TestBed.inject(PaymentService);
    movementService = TestBed.inject(MovementService);
    alertService = TestBed.inject(AlertService);
    reportService = TestBed.inject(ReportService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('user');
  });

  function expectRequest(url: string, method: string) {
    const matches = httpMock.match(req => req.url === url && req.method === method);
    expect(matches.length).toBe(1, `${method} ${url} should be called once`);
    return matches[0].request;
  }

  it('uses the expected product endpoints', () => {
    productService.getAll().subscribe();
    productService.getActive().subscribe();
    productService.getById(4).subscribe();
    productService.getBySku('SKU-1').subscribe();
    productService.getByCategory('Electronics').subscribe();
    productService.search('laptop').subscribe();
    productService.create({} as never).subscribe();
    productService.update(4, {} as never).subscribe();
    productService.deactivate(7).subscribe();
    productService.activate(8).subscribe();
    productService.delete(9).subscribe();

    expectRequest('/api/v1/products', 'GET');
    expectRequest('/api/v1/products/active', 'GET');
    expectRequest('/api/v1/products/4', 'GET');
    expectRequest('/api/v1/products/sku/SKU-1', 'GET');
    expectRequest('/api/v1/products/category/Electronics', 'GET');

    const searchReq = httpMock.expectOne(req => req.url === '/api/v1/products/search');
    expect(searchReq.request.params.get('keyword')).toBe('laptop');

    expectRequest('/api/v1/products', 'POST');
    expectRequest('/api/v1/products/4', 'PUT');
    expectRequest('/api/v1/products/7/deactivate', 'PUT');
    expectRequest('/api/v1/products/8/activate', 'PUT');
    expectRequest('/api/v1/products/9', 'DELETE');
  });

  it('uses the expected warehouse endpoints', () => {
    warehouseService.getAll().subscribe();
    warehouseService.getActive().subscribe();
    warehouseService.getById(3).subscribe();
    warehouseService.create({} as never).subscribe();
    warehouseService.update(3, {} as never).subscribe();
    warehouseService.deactivate(4).subscribe();
    warehouseService.getStockByWarehouse(10).subscribe();
    warehouseService.getStockByProduct(11).subscribe();
    warehouseService.getLowStock().subscribe();
    warehouseService.getOverstock().subscribe();
    warehouseService.transferStock({} as never).subscribe();

    expectRequest('/api/v1/warehouses', 'GET');
    expectRequest('/api/v1/warehouses/active', 'GET');
    expectRequest('/api/v1/warehouses/3', 'GET');
    expectRequest('/api/v1/warehouses', 'POST');
    expectRequest('/api/v1/warehouses/3', 'PUT');
    expectRequest('/api/v1/warehouses/4/deactivate', 'PUT');
    expectRequest('/api/v1/warehouses/10/stock', 'GET');
    expectRequest('/api/v1/warehouses/stock/product/11', 'GET');
    expectRequest('/api/v1/warehouses/stock/low-stock', 'GET');
    expectRequest('/api/v1/warehouses/stock/overstock', 'GET');
    expectRequest('/api/v1/warehouses/stock/transfer', 'POST');
  });

  it('uses the expected supplier endpoints', () => {
    supplierService.getAll().subscribe();
    supplierService.getActive().subscribe();
    supplierService.getById(2).subscribe();
    supplierService.search('acme').subscribe();
    supplierService.getTopRated().subscribe();
    supplierService.create({} as never).subscribe();
    supplierService.update(2, {} as never).subscribe();
    supplierService.rate(2, 5, 'Great').subscribe();
    supplierService.deactivate(2).subscribe();

    expectRequest('/api/v1/suppliers', 'GET');
    expectRequest('/api/v1/suppliers/active', 'GET');
    expectRequest('/api/v1/suppliers/2', 'GET');

    const searchReq = httpMock.expectOne(req => req.url === '/api/v1/suppliers/search');
    expect(searchReq.request.params.get('keyword')).toBe('acme');

    expectRequest('/api/v1/suppliers/top-rated', 'GET');
    expectRequest('/api/v1/suppliers', 'POST');
    expectRequest('/api/v1/suppliers/2', 'PUT');

    const rateReq = httpMock.expectOne('/api/v1/suppliers/2/rating');
    expect(rateReq.request.method).toBe('PUT');
    expect(rateReq.request.body).toEqual({ rating: 5, comment: 'Great' });

    expectRequest('/api/v1/suppliers/2/deactivate', 'PUT');
  });

  it('uses the expected purchase order endpoints', () => {
    purchaseOrderService.getAll().subscribe();
    purchaseOrderService.getById(1).subscribe();
    purchaseOrderService.getByStatus('PENDING').subscribe();
    purchaseOrderService.getOverdue().subscribe();
    purchaseOrderService.create({} as never).subscribe();
    purchaseOrderService.update(1, {} as never).subscribe();
    purchaseOrderService.submit(1).subscribe();
    purchaseOrderService.approve(1).subscribe();
    purchaseOrderService.reject(1, 'Budget issue').subscribe();
    purchaseOrderService.cancel(1, 'Supplier unavailable').subscribe();
    purchaseOrderService.receiveGoods(1, [] as never).subscribe();

    expectRequest('/api/v1/purchase-orders', 'GET');
    expectRequest('/api/v1/purchase-orders/1', 'GET');
    expectRequest('/api/v1/purchase-orders/status/PENDING', 'GET');
    expectRequest('/api/v1/purchase-orders/overdue', 'GET');
    expectRequest('/api/v1/purchase-orders', 'POST');
    expectRequest('/api/v1/purchase-orders/1', 'PUT');
    expectRequest('/api/v1/purchase-orders/1/submit', 'PUT');
    expectRequest('/api/v1/purchase-orders/1/approve', 'PUT');

    const rejectReq = httpMock.expectOne('/api/v1/purchase-orders/1/reject?reason=Budget%20issue');
    expect(rejectReq.request.method).toBe('PUT');

    const cancelReq = httpMock.expectOne('/api/v1/purchase-orders/1/cancel?reason=Supplier%20unavailable');
    expect(cancelReq.request.method).toBe('PUT');

    expectRequest('/api/v1/purchase-orders/1/receive', 'POST');
  });

  it('uses the expected payment endpoints', () => {
    paymentService.getAll().subscribe();
    paymentService.getById(3).subscribe();
    paymentService.getByPurchaseOrder(4).subscribe();
    paymentService.getBySupplier(5).subscribe();
    paymentService.getByStatus('PENDING' as never).subscribe();
    paymentService.getOverdue().subscribe();
    paymentService.create({} as never).subscribe();
    paymentService.createRazorpayOrder(6).subscribe();
    paymentService.verifyRazorpayPayment({} as never).subscribe();
    paymentService.markFailed(7, 'Bank timeout').subscribe();
    paymentService.cancel(8, 'Duplicate').subscribe();
    paymentService.getByDateRange('2026-01-01', '2026-01-31').subscribe();

    expectRequest('/api/v1/payments', 'GET');
    expectRequest('/api/v1/payments/3', 'GET');
    expectRequest('/api/v1/payments/purchase-order/4', 'GET');
    expectRequest('/api/v1/payments/supplier/5', 'GET');
    expectRequest('/api/v1/payments/status/PENDING', 'GET');
    expectRequest('/api/v1/payments/overdue', 'GET');
    expectRequest('/api/v1/payments', 'POST');
    expectRequest('/api/v1/payments/6/razorpay-order', 'POST');
    expectRequest('/api/v1/payments/razorpay-verify', 'POST');

    const failedReq = httpMock.expectOne('/api/v1/payments/7/failed?reason=Bank%20timeout');
    expect(failedReq.request.method).toBe('PUT');

    const cancelReq = httpMock.expectOne('/api/v1/payments/8/cancel?reason=Duplicate');
    expect(cancelReq.request.method).toBe('PUT');

    const rangeReq = httpMock.expectOne('/api/v1/payments/filter?from=2026-01-01&to=2026-01-31');
    expect(rangeReq.request.method).toBe('GET');
  });

  it('uses the expected movement, alert, and report endpoints', () => {
    movementService.getAll().subscribe();
    movementService.getByProduct(1).subscribe();
    movementService.getByWarehouse(2).subscribe();
    movementService.getByType('IN' as never).subscribe();
    movementService.getHistory(10, 20).subscribe();
    movementService.record({} as never).subscribe();

    alertService.getMyAlerts().subscribe();
    alertService.getMyUnread().subscribe();
    alertService.getUnreadCount().subscribe();
    alertService.getAll().subscribe();
    alertService.markAsRead(1).subscribe();
    alertService.markAllRead().subscribe();
    alertService.acknowledge(2).subscribe();
    alertService.delete(3).subscribe();

    reportService.getTotalStockValue().subscribe();
    reportService.getStockValueByWarehouse(4).subscribe();
    reportService.getTurnover('2026-02-01', '2026-02-28').subscribe();
    reportService.getTopMoving().subscribe();
    reportService.getSlowMoving().subscribe();
    reportService.getDeadStock().subscribe();
    reportService.getPOSummary('2026-03-01', '2026-03-31').subscribe();
    reportService.takeSnapshot().subscribe();

    expectRequest('/api/v1/movements', 'GET');
    expectRequest('/api/v1/movements/product/1', 'GET');
    expectRequest('/api/v1/movements/warehouse/2', 'GET');
    expectRequest('/api/v1/movements/type/IN', 'GET');

    const historyReq = httpMock.expectOne(req => req.url === '/api/v1/movements/history');
    expect(historyReq.request.params.get('productId')).toBe('10');
    expect(historyReq.request.params.get('warehouseId')).toBe('20');
    expectRequest('/api/v1/movements', 'POST');

    const myAlertsReq = httpMock.expectOne(req => req.url === '/api/v1/alerts/my' && req.method === 'GET');
    expect(myAlertsReq.request.params.get('userId')).toBe('42');

    const myUnreadReq = httpMock.expectOne(req => req.url === '/api/v1/alerts/my/unread' && req.method === 'GET');
    expect(myUnreadReq.request.params.get('userId')).toBe('42');

    const unreadCountReq = httpMock.expectOne(req => req.url === '/api/v1/alerts/my/unread/count' && req.method === 'GET');
    expect(unreadCountReq.request.params.get('userId')).toBe('42');

    expectRequest('/api/v1/alerts', 'GET');
    expectRequest('/api/v1/alerts/1/read', 'PUT');

    const markAllReadReq = httpMock.expectOne(req => req.url === '/api/v1/alerts/my/read-all' && req.method === 'PUT');
    expect(markAllReadReq.request.params.get('userId')).toBe('42');

    expectRequest('/api/v1/alerts/2/acknowledge', 'PUT');
    expectRequest('/api/v1/alerts/3', 'DELETE');

    expectRequest('/api/v1/reports/valuation/total', 'GET');
    expectRequest('/api/v1/reports/valuation/warehouse/4', 'GET');

    const turnoverReq = httpMock.expectOne(req => req.url === '/api/v1/reports/turnover');
    expect(turnoverReq.request.params.get('from')).toBe('2026-02-01');
    expect(turnoverReq.request.params.get('to')).toBe('2026-02-28');

    const topMovingReq = httpMock.expectOne(req => req.url === '/api/v1/reports/products/top-moving');
    expect(topMovingReq.request.params.get('topN')).toBe('10');

    const slowMovingReq = httpMock.expectOne(req => req.url === '/api/v1/reports/products/slow-moving');
    expect(slowMovingReq.request.params.get('thresholdDays')).toBe('30');

    const deadStockReq = httpMock.expectOne(req => req.url === '/api/v1/reports/products/dead-stock');
    expect(deadStockReq.request.params.get('days')).toBe('90');

    const poSummaryReq = httpMock.expectOne(req => req.url === '/api/v1/reports/po-summary');
    expect(poSummaryReq.request.params.get('from')).toBe('2026-03-01');
    expect(poSummaryReq.request.params.get('to')).toBe('2026-03-31');

    expectRequest('/api/v1/reports/snapshot', 'POST');
  });
});
