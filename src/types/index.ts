export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  role?: string;
  parentId: number | null;
  effectiveParentId: number | null;
  referralCode?: string;
  referralLink?: string;
  affiliateCode?: string;
  lastSaleAt: string | null;
  inactiveSince: string | null;
  createdAt: string | null;
}

export interface ReferralTreeNode {
  userId: number;
  username: string;
  isActive: boolean;
  level: number;
  children?: ReferralTreeNode[];
}

export interface Sale {
  id: number;
  sellerUserId: number;
  buyerId: number | null;
  affiliateUserId: number | null;
  totalAmount: number;
  createdAt: string;
}

export interface Order {
  orderId: number;
  buyerId: number;
  sellerUserId: number | null;
  productId: number;
  paymentProofUrl: string;
  amount: number;
  status: string;
  quantity?: number;
  affiliateCode?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  deliveryName?: string;
  createdAt: string;
  deliveryEmail: string;
}

export interface Product {
  sku?: string;
  productId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock: number | 0;
}

export interface CommissionLedger {
  saleId: number;
  beneficiaryUserId: number;
  level: number;
  percentage: number;
  amount: number;
  createdAt: string;
  sellerUserId: number;
}

export interface ReferralShiftHistory {
  affectedChildId: number;
  inactiveUserId: number;
  previousEffectiveParentId: number;
  newEffectiveParentId: number;
  changedAt: string;
  reverted: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Legacy single-product order type (deprecated - use unified CreateOrderRequest)
export interface LegacyCreateOrderRequest {
  buyerId?: number;
  sellerId?: number;
  productId: number;
  quantity: number;
  paymentProofUrl?: string | null;
  amount: number;
  affiliateCode?: string;
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryName: string;
  deliveryEmail: string;
}

export interface CreateSaleRequest {
  buyerId: number;
  sellerId?: number;
  productId: number;
  quantity: number;
  paymentProofUrl: string;
  amount: number;
  affiliateCode?: string;
}

// Cart Types
export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  stock: number | 0;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  clearCart: () => void;
}

// Unified Order Types (for both single and multi-item orders)
export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
  sellerId: number | null;
}

export interface CreateOrderRequest {
  buyerId?: number;
  items: OrderItem[];
  totalAmount: number;
  paymentProofUrl: string;
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryName: string;
  deliveryEmail: string;
  affiliateCode: string | null;
}

export interface OrderResponse {
  orderId: number;
  buyerId: number;
  totalAmount: number;
  status: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
    sellerId: number | null;
    orderId: number;
  }>;
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryName: string;
  deliveryEmail: string;
  paymentProofUrl: string | null;
  affiliateCode: string | null;
  createdAt: string;
}

// Legacy types for backward compatibility (deprecated - use CreateOrderRequest instead)
export interface CreateCartOrderRequest extends CreateOrderRequest {}
export interface CartOrderResponse extends OrderResponse {}
export interface CartOrderItem extends OrderItem {}
