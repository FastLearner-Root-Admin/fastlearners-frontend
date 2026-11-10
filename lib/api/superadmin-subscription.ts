import { ApiResponse } from "@/lib/types/auth";
import {
  Package,
  PackageType,
  Coupon,
  Sponsor,
  Voucher,
  AdminSubscription,
  AdminTransaction,
  PaginatedContent,
} from "@/lib/types/subscription";

export interface CreatePackageData {
  name: string;
  type: PackageType;
  amount: string | number;
  billing_cycle: "monthly" | "yearly";
  duration_days: number;
  description?: string | null;
  original_amount?: string | number | null;
}

export interface UpdatePackageData extends Partial<CreatePackageData> {}

export interface CreateSponsorData {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  organization_name: string;
  description?: string | null;
}

export interface UpdateSponsorData extends Partial<CreateSponsorData> {
  is_active?: "1" | "0";
}

export interface CreateVoucherData {
  package_id: number;
  sponsor_id: number;
  quantity?: number;
}

export interface UpdateVoucherData {
  code?: string;
  is_valid?: 1 | 0;
  reference?: string;
}

export interface CreateCouponData {
  code: string;
  package_id: number;
  type: "percentage" | "fixed";
  value: number;
  minimum_amount: number;
  usage_limit: number;
  expires_at: string;
  description?: string | null;
}

export interface UpdateCouponData extends Partial<CreateCouponData> {}

// Package functions
export async function adminGetPackages(): Promise<ApiResponse<{ packages: Package[] }>> {
  try {
    const res = await fetch("/api/proxy/superadmin/packages", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch packages",
      content: null,
      code: 500,
    };
  }
}

export async function adminGetPackage(id: number): Promise<ApiResponse<{ package: Package }>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/packages/${id}/view`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch package",
      content: null,
      code: 500,
    };
  }
}

export async function adminCreatePackage(
  data: CreatePackageData
): Promise<ApiResponse<{ package: Package }>> {
  try {
    const res = await fetch("/api/proxy/superadmin/packages/create", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to create package",
      content: null,
      code: 500,
    };
  }
}

export async function adminUpdatePackage(
  id: number,
  data: UpdatePackageData
): Promise<ApiResponse<{ package: Package }>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/packages/${id}/update`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to update package",
      content: null,
      code: 500,
    };
  }
}

export async function adminDeletePackage(id: number): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/packages/${id}/delete`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to delete package",
      content: null,
      code: 500,
    };
  }
}

export async function adminUpdatePackageStatus(id: number): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/packages/${id}/update-status`, {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to update package status",
      content: null,
      code: 500,
    };
  }
}

// Coupon functions
export async function adminGetCoupons(
  page?: number
): Promise<ApiResponse<PaginatedContent<"coupons", Coupon>>> {
  try {
    const url = page && page > 1 
      ? `/api/proxy/superadmin/coupons?page=${page}`
      : "/api/proxy/superadmin/coupons";
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.content)) {
      data.content = data.content[0];
    }
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch coupons",
      content: null,
      code: 500,
    };
  }
}

export async function adminGetCoupon(id: number): Promise<ApiResponse<{ coupon: Coupon }>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/coupons/${id}/view`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch coupon",
      content: null,
      code: 500,
    };
  }
}

export async function adminCreateCoupon(
  data: CreateCouponData
): Promise<ApiResponse<{ coupon: Coupon }>> {
  try {
    const res = await fetch("/api/proxy/superadmin/coupons/create", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to create coupon",
      content: null,
      code: 500,
    };
  }
}

export async function adminUpdateCoupon(
  id: number,
  data: UpdateCouponData
): Promise<ApiResponse<{ coupon: Coupon }>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/coupons/${id}/update`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to update coupon",
      content: null,
      code: 500,
    };
  }
}

export async function adminDeleteCoupon(id: number): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/coupons/${id}/delete`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to delete coupon",
      content: null,
      code: 500,
    };
  }
}

export async function adminUpdateCouponStatus(id: number): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/coupons/${id}/update-status`, {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to update coupon status",
      content: null,
      code: 500,
    };
  }
}

export async function adminSearchCoupons(
  searchTerm: string,
  page?: number
): Promise<ApiResponse<PaginatedContent<"coupons", Coupon>>> {
  try {
    const url = page && page > 1
      ? `/api/proxy/superadmin/coupons/search?page=${page}`
      : "/api/proxy/superadmin/coupons/search";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ search_term: searchTerm }),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.content)) {
      data.content = data.content[0];
    }
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to search coupons",
      content: null,
      code: 500,
    };
  }
}

// Subscription functions
export async function adminGetSubscriptions(
  page?: number
): Promise<ApiResponse<PaginatedContent<"subscriptions", AdminSubscription>>> {
  try {
    const url = page && page > 1
      ? `/api/proxy/superadmin/subscriptions?page=${page}`
      : "/api/proxy/superadmin/subscriptions";
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.content)) {
      data.content = data.content[0];
    }
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch subscriptions",
      content: null,
      code: 500,
    };
  }
}

export async function adminGetSubscription(
  id: number
): Promise<ApiResponse<{ subscription: AdminSubscription }>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/subscriptions/${id}/view`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await res.json();
    // API returns content as an array — unwrap the first element
    if (data.success && Array.isArray(data.content)) {
      data.content = { subscription: data.content[0] };
    }
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch subscription",
      content: null,
      code: 500,
    };
  }
}

// Transaction functions
export async function adminGetTransactions(
  page?: number
): Promise<ApiResponse<PaginatedContent<"transactions", AdminTransaction>>> {
  try {
    const url = page && page > 1
      ? `/api/proxy/superadmin/transactions?page=${page}`
      : "/api/proxy/superadmin/transactions";
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.content)) {
      data.content = data.content[0];
      if (data.content && Array.isArray(data.content.transactions)) {
        data.content.transactions = data.content.transactions.map((t: any) => {
          if (t.final_amount !== undefined && t.payment_amount === undefined) {
            t.payment_amount = t.final_amount;
          }
          return t;
        });
      }
    }
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch transactions",
      content: null,
      code: 500,
    };
  }
}

export async function adminGetTransaction(
  id: number
): Promise<ApiResponse<{ transaction: AdminTransaction }>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/transactions/${id}/view`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await res.json();
    // API returns content as an array — unwrap the first element
    if (data.success && Array.isArray(data.content)) {
      const transaction = data.content[0];
      if (transaction && transaction.final_amount !== undefined && transaction.payment_amount === undefined) {
        transaction.payment_amount = transaction.final_amount;
      }
      data.content = { transaction };
    }
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch transaction",
      content: null,
      code: 500,
    };
  }
}

// Sponsor functions
export async function adminGetSponsors(
  page?: number
): Promise<ApiResponse<PaginatedContent<"sponsors", Sponsor>>> {
  try {
    const url = page && page > 1
      ? `/api/proxy/superadmin/sponsors?page=${page}`
      : "/api/proxy/superadmin/sponsors";
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch sponsors",
      content: null,
      code: 500,
    };
  }
}

export async function adminGetSponsor(id: number): Promise<ApiResponse<{ sponsor: Sponsor }>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/sponsors/${id}/view`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch sponsor",
      content: null,
      code: 500,
    };
  }
}

export async function adminCreateSponsor(
  data: CreateSponsorData
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch("/api/proxy/superadmin/sponsors/create", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to create sponsor",
      content: null,
      code: 500,
    };
  }
}

export async function adminUpdateSponsor(
  id: number,
  data: UpdateSponsorData
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/sponsors/${id}/update`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to update sponsor",
      content: null,
      code: 500,
    };
  }
}

export async function adminDeleteSponsor(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/sponsors/${id}/delete`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to delete sponsor",
      content: null,
      code: 500,
    };
  }
}

export async function adminSearchSponsors(
  searchTerm: string,
  page?: number
): Promise<ApiResponse<PaginatedContent<"sponsors", Sponsor>>> {
  try {
    const url = page && page > 1
      ? `/api/proxy/superadmin/sponsors/search?page=${page}`
      : "/api/proxy/superadmin/sponsors/search";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ search_term: searchTerm }),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to search sponsors",
      content: null,
      code: 500,
    };
  }
}

// Voucher functions
export async function adminGetVouchers(
  page?: number
): Promise<ApiResponse<PaginatedContent<"vouchers", Voucher>>> {
  try {
    const url = page && page > 1
      ? `/api/proxy/superadmin/vouchers?page=${page}`
      : "/api/proxy/superadmin/vouchers";
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch vouchers",
      content: null,
      code: 500,
    };
  }
}

export async function adminGetVoucher(id: number): Promise<ApiResponse<Voucher>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/vouchers/${id}/view`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch voucher",
      content: null,
      code: 500,
    };
  }
}

export async function adminCreateVoucher(
  data: CreateVoucherData
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch("/api/proxy/superadmin/vouchers/create", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to create voucher",
      content: null,
      code: 500,
    };
  }
}

export async function adminUpdateVoucher(
  id: number,
  data: UpdateVoucherData
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/vouchers/${id}/update`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to update voucher",
      content: null,
      code: 500,
    };
  }
}

export async function adminDeleteVoucher(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/vouchers/${id}/delete`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to delete voucher",
      content: null,
      code: 500,
    };
  }
}

export async function adminSearchVouchers(
  searchTerm: string,
  page?: number
): Promise<ApiResponse<PaginatedContent<"vouchers", Voucher>>> {
  try {
    const url = page && page > 1
      ? `/api/proxy/superadmin/vouchers/search?page=${page}`
      : "/api/proxy/superadmin/vouchers/search";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ search_term: searchTerm }),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to search vouchers",
      content: null,
      code: 500,
    };
  }
}

export async function adminSearchVouchersBySponsor(
  sponsorCode: string,
  page?: number
): Promise<ApiResponse<PaginatedContent<"vouchers", Voucher>>> {
  try {
    const url = page && page > 1
      ? `/api/proxy/superadmin/vouchers/sponsor/search?page=${page}`
      : "/api/proxy/superadmin/vouchers/sponsor/search";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ sponsor_code: sponsorCode }),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to search vouchers by sponsor",
      content: null,
      code: 500,
    };
  }
}
