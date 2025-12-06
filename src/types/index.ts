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
  productId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
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

export interface CreateOrderRequest {
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

