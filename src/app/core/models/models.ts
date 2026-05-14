// =====================================================================
// AUTH MODELS
// =====================================================================
export interface LoginRequest { email: string; password: string; }
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordWithOtpRequest { email: string; otp: string; newPassword: string; }
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface UserResponse {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type UserRole = 'WAREHOUSE_STAFF' | 'INVENTORY_MANAGER' | 'PURCHASE_OFFICER' | 'ADMIN';
export interface RegisterRequest { fullName: string; email: string; password: string; phone?: string; role?: UserRole; department?: string; }
export interface AdminUserUpdateRequest { fullName?: string; phone?: string; role?: UserRole; isActive?: boolean; }

// =====================================================================
// PRODUCT MODELS
// =====================================================================
export interface Product { id: number; sku: string; name: string; description?: string; category: string; brand?: string; unitOfMeasure: string; costPrice: number; sellingPrice: number; reorderLevel: number; maxStockLevel: number; leadTimeDays: number; imageUrl?: string; active: boolean; createdAt: string; updatedAt?: string; }
export interface ProductRequest { sku: string; name: string; description?: string; category: string; brand?: string; unitOfMeasure: string; costPrice: number; sellingPrice: number; reorderLevel: number; maxStockLevel: number; leadTimeDays: number; imageUrl?: string; active?: boolean; }

// =====================================================================
// WAREHOUSE MODELS
// =====================================================================
export interface Warehouse { id: number; name: string; location: string; address?: string; managerId?: number; capacity: number; usedCapacity: number; phone?: string; isActive: boolean; createdAt: string; utilisationPercent: number; }
export interface WarehouseRequest { name: string; location: string; address?: string; managerId?: number; capacity: number; phone?: string; isActive?: boolean; }
export interface StockLevel { id: number; warehouseId: number; warehouseName: string; productId: number; productName: string; productSku: string; quantity: number; reservedQuantity: number; availableQuantity: number; binLocation?: string; lastUpdated: string; }
export interface TransferRequest { productId: number; fromWarehouseId: number; toWarehouseId: number; quantity: number; reason?: string; }

// =====================================================================
// SUPPLIER MODELS
// =====================================================================
export interface Supplier { id: number; name: string; contactPerson?: string; email: string; phone?: string; address?: string; city?: string; country?: string; paymentTerms: string; leadTimeDays: number; rating: number; ratingCount: number; isActive: boolean; createdAt: string; }
export interface SupplierRequest { name: string; contactPerson?: string; email: string; phone?: string; address?: string; city?: string; country?: string; paymentTerms: string; leadTimeDays: number; }

// =====================================================================
// PURCHASE ORDER MODELS
// =====================================================================
export interface POLineItem { id: number; productId: number; productName: string; productSku: string; quantity: number; unitCost: number; totalCost: number; receivedQty: number; pendingQty: number; fullyReceived: boolean; }
export interface PurchaseOrder { id: number; supplierId: number; supplierName: string; warehouseId: number; warehouseName: string; createdById: number; status: POStatus; totalAmount: number; orderDate: string; expectedDate?: string; receivedDate?: string; referenceNumber?: string; notes?: string; createdAt: string; lineItems: POLineItem[]; }
export interface POLineItemRequest { productId: number; quantity: number; unitCost: number; }
export interface PurchaseOrderRequest { supplierId: number; warehouseId: number; orderDate: string; expectedDate?: string; referenceNumber?: string; notes?: string; lineItems: POLineItemRequest[]; }
export interface ReceiveGoodsRequest { lineItemId: number; receivedQuantity: number; }
export type POStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

// =====================================================================
// PAYMENT MODELS
// =====================================================================
export interface Payment { id: number; purchaseOrderId: number; supplierId: number; amount: number; paidAmount: number; balanceAmount: number; status: PaymentStatus; paymentMethod: PaymentMethod; transactionReference?: string; razorpayOrderId?: string; razorpayPaymentId?: string; paymentDate?: string; dueDate?: string; notes?: string; createdById: number; createdAt: string; updatedAt?: string; }
export interface PaymentRequest { purchaseOrderId: number; supplierId: number; amount: number; dueDate?: string; notes?: string; }
export interface RazorpayOrderResponse { payment: Payment; razorpayKeyId: string; razorpayOrderId: string; amount: number; currency: string; }
export interface RazorpayVerifyRequest { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; mockPaidAmount?: number; }
export interface SupplierReturnAdjustmentRequest { amount: number; action: SupplierReturnAdjustmentAction; reason?: string; }
export type SupplierReturnAdjustmentAction = 'REDUCE_PAYABLE' | 'RECORD_SUPPLIER_REFUND';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'FAILED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CHEQUE' | 'RAZORPAY';

// =====================================================================
// STOCK MOVEMENT MODELS
// =====================================================================
export interface StockMovement { id: number; productId: number; productName: string; productSku: string; warehouseId: number; warehouseName: string; fromWarehouseId?: number; fromWarehouseName?: string; toWarehouseId?: number; toWarehouseName?: string; movementType: MovementType; quantity: number; unitCost?: number; referenceId?: number; referenceType?: string; performedBy: number; performedByName: string; notes?: string; balanceAfter: number; movementDate: string; }
export interface MovementRequest { productId: number; warehouseId: number; fromWarehouseId?: number; toWarehouseId?: number; movementType: MovementType; quantity: number; unitCost?: number; referenceId?: number; referenceType?: string; notes?: string; }
export type MovementType = 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'WRITE_OFF' | 'RETURN';

// =====================================================================
// ALERT MODELS
// =====================================================================
export interface Alert { id: number; recipientId: number; type: AlertType; severity: AlertSeverity; title: string; message: string; relatedProductId?: number; relatedWarehouseId?: number; channel: string; isRead: boolean; isAcknowledged: boolean; createdAt: string; }
export type AlertType = 'LOW_STOCK' | 'OVERSTOCK' | 'PO_PENDING' | 'OVERDUE_RECEIPT' | 'SYSTEM';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

// =====================================================================
// REPORT MODELS
// =====================================================================
export interface StockValuation { totalValue: number; asOfDate: string; warehouseId?: number; warehouseName?: string; totalProducts: number; }
export interface TurnoverReport { turnoverRate: number; totalCOGS: number; averageInventoryValue: number; fromDate: string; toDate: string; warehouseId?: number; }
export interface TopMovingProduct { productId: number; productName: string; productSku: string; category: string; totalUnitsIn: number; totalUnitsOut: number; totalUnitsMoved: number; totalValueMoved: number; rank: number; }
export interface DeadStock { productId: number; productName: string; productSku: string; category: string; currentQuantity: number; stockValue: number; lastMovementDate?: string; daysSinceLastMovement: number; }
export interface POSummary { totalPOs: number; approvedPOs: number; pendingPOs: number; cancelledPOs: number; totalSpend: number; fromDate: string; toDate: string; supplierId?: number; supplierName?: string; }

// =====================================================================
// GENERIC API WRAPPER
// =====================================================================
export interface ApiResponse<T> { success: boolean; message: string; data: T; }
