"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getPaymentStatus } from "@/lib/api/subscription";
import { trackEvent } from "@/lib/analytics/posthog";
import { PaymentStatusContent } from "@/lib/types/subscription";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

function getTransactionStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "success") {
    return <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Successful</Badge>;
  }
  if (s === "pending") {
    return <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
  }
  if (s === "failed") {
    return <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
  }
  return <Badge className="border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
}

function PaymentStatusInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<PaymentStatusContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reference = searchParams.get("reference");
    
    if (!reference) {
      router.replace("/dashboard/subscriptions");
      return;
    }

    async function fetchStatus() {
      try {
        const response = await getPaymentStatus(reference as string);
        if (response.success && response.content) {
          setData(response.content);
          const transaction = response.content.transaction_details;
          if (transaction?.status?.toLowerCase() === "success") {
            trackEvent("subscription_purchased", {
              reference,
              plan: transaction.package,
              amount: transaction.amount,
              payment_amount: transaction.payment_amount,
              coupon: transaction.coupon || null,
            });
          }
        } else {
          setError(response.message || "Failed to verify payment status.");
        }
      } catch (err) {
        setError("An unexpected error occurred while verifying payment.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <Card className="mx-auto mt-12 max-w-lg">
        <CardHeader>
          <Skeleton className="mx-auto h-8 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-6 h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || !data.transaction_details) {
    return (
      <Card className="mx-auto mt-12 max-w-lg border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center py-12">
          <XCircle className="mb-6 size-16 text-destructive" />
          <h2 className="mb-2 text-2xl font-bold">Payment Failed</h2>
          <p className="mb-6 text-center text-muted-foreground">
            {error || "Your transaction could not be completed successfully."}
            {searchParams.get("reference") && (
              <span className="mt-2 block text-sm">
                Reference: {searchParams.get("reference")}
              </span>
            )}
          </p>
          <Button asChild>
            <Link href="/dashboard/subscriptions">
              <ArrowLeft className="mr-2 size-4" />
              Try Again
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { transaction_details } = data;
  const status = transaction_details.status?.toLowerCase() || "";
  const isPending = status === "pending";
  const isFailed = status === "failed";
  const isSuccess = status === "success";
  
  if (isFailed) {
    return (
      <Card className="mx-auto mt-12 max-w-lg border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center py-12">
          <XCircle className="mb-6 size-16 text-destructive" />
          <h2 className="mb-2 text-2xl font-bold">Payment Failed</h2>
          <div className="mb-4">
            {getTransactionStatusBadge(transaction_details.status)}
          </div>
          <p className="mb-6 text-center text-muted-foreground">
            Your transaction could not be completed successfully.
            {searchParams.get("reference") && (
              <span className="mt-2 block text-sm">
                Reference: {searchParams.get("reference")}
              </span>
            )}
          </p>
          <Button asChild>
            <Link href="/dashboard/subscriptions">
              <ArrowLeft className="mr-2 size-4" />
              Try Again
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isPending) {
    return (
      <Card className="mx-auto mt-12 max-w-lg border-amber-500/50 bg-amber-500/5">
        <CardContent className="flex flex-col items-center py-12">
          <Clock className="mb-6 size-16 text-amber-500" />
          <h2 className="mb-2 text-2xl font-bold">
            Payment Pending
          </h2>
          <div className="mb-4">
            {getTransactionStatusBadge(transaction_details.status)}
          </div>
          <div className="mb-8 w-full space-y-4 rounded-lg border bg-background p-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-sm font-medium">{transaction_details?.reference ?? searchParams.get("reference")}</span>
            </div>
          </div>
          <p className="mb-6 text-center text-muted-foreground">
            Your payment is currently being processed. Please check back later.
          </p>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="mx-auto mt-12 max-w-lg border-primary/50 bg-primary/5">
        <CardContent className="flex flex-col items-center py-12">
          <CheckCircle2 className="mb-6 size-16 text-primary" />
          <h2 className="mb-2 text-2xl font-bold">Payment Successful!</h2>
          <div className="mb-4">
            {getTransactionStatusBadge(transaction_details.status)}
          </div>
          <p className="mb-8 text-muted-foreground">
            Your subscription has been activated.
          </p>

          <div className="mb-8 w-full space-y-4 rounded-lg border bg-background p-6">
            {transaction_details.package && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Package</span>
                <span className="font-medium">{transaction_details.package}</span>
              </div>
            )}
            {transaction_details.amount && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">₦{transaction_details.amount}</span>
              </div>
            )}
            {transaction_details.coupon && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Coupon Applied</span>
                <span className="font-medium">{transaction_details.coupon}</span>
              </div>
            )}
            {transaction_details.discount_amount && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-green-600">-₦{transaction_details.discount_amount}</span>
              </div>
            )}
            {transaction_details.payment_amount && (
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-semibold">Payment Amount</span>
                <span className="font-bold">₦{transaction_details.payment_amount}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-sm font-medium">{transaction_details?.reference ?? searchParams.get("reference")}</span>
            </div>
            {transaction_details.created_at && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{transaction_details.created_at}</span>
              </div>
            )}
          </div>

          <Button className="w-full" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-12 max-w-lg border-muted bg-muted/5">
      <CardContent className="flex flex-col items-center py-12">
        <Clock className="mb-6 size-16 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">Payment Status Unknown</h2>
        <div className="mb-4">
          {getTransactionStatusBadge(transaction_details.status)}
        </div>
        <p className="mb-6 text-center text-muted-foreground">
          Your payment status is currently unknown or processing. Please check your transaction history for updates.
          {searchParams.get("reference") && (
            <span className="mt-2 block text-sm">
              Reference: {searchParams.get("reference")}
            </span>
          )}
        </p>
        <Button asChild>
          <Link href="/dashboard/subscriptions">
            <ArrowLeft className="mr-2 size-4" />
            Back to Subscriptions
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <Card className="mx-auto mt-12 max-w-lg">
          <CardHeader>
            <Skeleton className="mx-auto h-8 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-6 h-10 w-full" />
          </CardContent>
        </Card>
      }
    >
      <PaymentStatusInner />
    </Suspense>
  );
}
