"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { showApiToast } from "@/lib/utils/api-toast";

import { adminGetTransaction } from "@/lib/api/superadmin-subscription";
import { AdminTransaction } from "@/lib/types/subscription";
import { normalizeAmount, parseDateString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const [transaction, setTransaction] = useState<AdminTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransaction() {
      setLoading(true);
      setError(null);
      const res = await adminGetTransaction(Number(params.id));
      if (res.success && res.content && res.content.transaction) {
        setTransaction(res.content.transaction);
      } else {
        setError(res.message || "Failed to fetch transaction");
        showApiToast(res.type ?? "error", res.message || "Failed to fetch transaction");
      }
      setLoading(false);
    }
    
    if (params.id) {
      fetchTransaction();
    }
  }, [params.id]);

  function getStatusBadge(status: string) {
    switch (status) {
      case "success":
        return <Badge className="bg-emerald-100 capitalize text-emerald-800 hover:bg-emerald-100/80">{status}</Badge>;
      case "failed":
        return <Badge className="bg-red-100 capitalize text-red-800 hover:bg-red-100/80">{status}</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 capitalize text-amber-800 hover:bg-amber-100/80">{status}</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/superadmin/transactions">
            <Button variant="ghost" className="-ml-4 gap-2">
              <ChevronLeft className="size-4" />
              Back to Transactions
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || !transaction) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/superadmin/transactions">
            <Button variant="ghost" className="-ml-4 gap-2">
              <ChevronLeft className="size-4" />
              Back to Transactions
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[350px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/superadmin/transactions">
          <Button variant="ghost" className="-ml-4 gap-2">
            <ChevronLeft className="size-4" />
            Back to Transactions
          </Button>
        </Link>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transaction Details</h2>
          <p className="text-muted-foreground">
            View details for transaction #{transaction.id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payer Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">User Name</p>
              <p className="font-medium">{transaction.user_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User Email</p>
              <p className="font-medium">{transaction.user_email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Package</p>
                <p className="font-medium">{transaction.package}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {transaction.package_type}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gateway</p>
                <p className="font-medium capitalize">{transaction.gateway}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reference</p>
                <p className="font-medium">{transaction.reference}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coupon Code</p>
                <p className="font-medium">{transaction.coupon_code || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Voucher Code</p>
                <p className="font-medium">{transaction.voucher_code || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-y py-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className="font-medium">₦{Number(normalizeAmount(transaction.amount)).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Discount</p>
                <p className="font-medium">₦{Number(normalizeAmount(transaction.discount_amount)).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Amount</p>
                <p className="font-medium">₦{Number(normalizeAmount(transaction.payment_amount)).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(transaction.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="font-medium">
                  {transaction.created_at ? parseDateString(transaction.created_at)?.toLocaleString() : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                <p className="font-medium">
                  {transaction.updated_at ? parseDateString(transaction.updated_at)?.toLocaleString() : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
