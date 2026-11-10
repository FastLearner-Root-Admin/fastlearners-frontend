import { ApiResponse } from "@/lib/types/auth";
import {
  Package,
  Subscription,
  Transaction,
  PaymentStatusContent,
} from "@/lib/types/subscription";

export async function getPackages(): Promise<ApiResponse<{ packages: Package[] }>> {
  try {
    const res = await fetch("/api/proxy/packages", {
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

export async function getPackage(id: number): Promise<ApiResponse<{ package: Package }>> {
  try {
    const res = await fetch(`/api/proxy/packages/${id}/view`, {
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

export async function verifyCoupon(
  packageId: number,
  couponCode: string
): Promise<
  ApiResponse<{
    amount: string;
    discount_amount: string;
    payment_amount: string;
  }>
> {
  try {
    const res = await fetch("/api/proxy/subscriptions/verify-coupon", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ package_id: packageId, coupon_code: couponCode }),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to verify coupon",
      content: null,
      code: 500,
    };
  }
}

export async function verifyVoucher(
  packageId: number,
  voucherCode: string
): Promise<
  ApiResponse<{
    amount: string;
    discount_amount: string;
    payment_amount: string;
  }>
> {
  try {
    const res = await fetch("/api/proxy/subscriptions/verify-voucher", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ package_id: packageId, voucher_code: voucherCode }),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to verify voucher",
      content: null,
      code: 500,
    };
  }
}

export async function subscribeWithVoucher(
  packageId: number,
  voucherCode: string
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch("/api/proxy/subscriptions/subscribe-with-voucher", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ package_id: packageId, voucher_code: voucherCode }),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to subscribe with voucher",
      content: null,
      code: 500,
    };
  }
}

export async function subscribeToPackage(
  packageId: number,
  couponCode?: string
): Promise<
  ApiResponse<{
    authorization_url: string;
    access_code?: string;
    reference?: string;
  }>
> {
  try {
    const body: Record<string, any> = { package_id: packageId };
    if (couponCode) {
      body.coupon_code = couponCode;
    }

    const res = await fetch("/api/proxy/subscriptions/subscribe", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to subscribe to package",
      content: null,
      code: 500,
    };
  }
}

export async function getPaymentStatus(
  reference: string
): Promise<ApiResponse<PaymentStatusContent>> {
  try {
    const res = await fetch(`/api/proxy/subscriptions/payment-status/${reference}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch payment status",
      content: null,
      code: 500,
    };
  }
}

export async function getTransactionHistory(): Promise<
  ApiResponse<{ transactions: Transaction[] }[]>
> {
  try {
    const res = await fetch("/api/proxy/transactions", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch transaction history",
      content: null,
      code: 500,
    };
  }
}

export async function getSubscriptionHistory(): Promise<
  ApiResponse<{ subscriptions: Subscription[] }[]>
> {
  try {
    const res = await fetch("/api/proxy/subscriptions", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch subscription history",
      content: null,
      code: 500,
    };
  }
}
