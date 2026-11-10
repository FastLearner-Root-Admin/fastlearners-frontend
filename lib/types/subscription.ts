import { ApiResponse } from "@/lib/types/auth";

export type PackageType = "subscription" | "quiz";

export interface Package {
  id: number;
  name: string;
  slug: string;
  type: PackageType;
  amount: string;
  original_amount: string | null;
  billing_cycle: "monthly" | "yearly";
  duration_days: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  package: string;
  package_type: PackageType;
  reference: string;
  subscription_reference: string;
  starts_at: string;
  expires_at: string;
  status: "active" | "expired" | "pending" | "cancelled";
  created_at: string;
}

export type TransactionStatus = "success" | "failed" | "pending";
export type PaymentMethod = "paystack" | "coupon" | "voucher";

export interface BaseTransaction {
  id: number;
  package: string;
  package_type: PackageType;
  reference: string;
  amount: string;
  discount_amount: string;
  gateway: string;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

export interface Transaction extends BaseTransaction {
  coupon: string | null;
  voucher: string | null;
  payment_amount: string;
  payment_method: PaymentMethod;
}

export interface PaymentStatusContent {
  transaction_details: {
    id: number;
    package?: string;
    coupon?: string | null;
    reference: string;
    amount?: string;
    discount_amount?: string;
    payment_amount?: string;
    status: TransactionStatus;
    created_at?: string;
  };
}

export interface Coupon {
  id: number;
  code: string;
  package_id: number;
  package_name: string;
  description: string | null;
  type: "percentage" | "fixed";
  value: string;
  minimum_amount: string;
  usage_limit: number;
  used_count: number;
  is_active: "active" | "inactive";
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSubscription extends Subscription {
  user_name: string;
  user_email: string;
  is_first_subscription: boolean;
  updated_at: string;
}

export interface AdminTransaction extends BaseTransaction {
  coupon_code: string | null;
  voucher_code: string | null;
  payment_amount: string;
  user_name: string;
  user_email: string;
}

export interface SponsorRef {
  id: number;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  organization_name: string;
}

export interface Sponsor extends SponsorRef {
  address: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoucherPackageRef {
  id: number;
  name: string;
}

export interface Voucher {
  id: number;
  code: string;
  reference: string;
  sponsor: SponsorRef;
  package: VoucherPackageRef;
  is_valid: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export type PaginatedContent<K extends string, T> = {
  [key in K]: T[];
} & {
  links: PaginationLinks;
  meta: PaginationMeta;
};
