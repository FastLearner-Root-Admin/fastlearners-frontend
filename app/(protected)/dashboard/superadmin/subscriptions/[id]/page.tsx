"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { showApiToast } from "@/lib/utils/api-toast";

import { adminGetSubscription } from "@/lib/api/superadmin-subscription";
import { AdminSubscription } from "@/lib/types/subscription";
import { parseDateString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionDetailPage({ params }: { params: { id: string } }) {
  const [subscription, setSubscription] = useState<AdminSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      setLoading(true);
      setError(null);
      const res = await adminGetSubscription(Number(params.id));
      if (res.success && res.content && res.content.subscription) {
        setSubscription(res.content.subscription);
      } else {
        setError(res.message || "Failed to fetch subscription");
        showApiToast(res.type ?? "error", res.message || "Failed to fetch subscription");
      }
      setLoading(false);
    }
    
    if (params.id) {
      fetchSubscription();
    }
  }, [params.id]);

  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80">Active</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100/80">Expired</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100/80">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100/80">Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/superadmin/subscriptions">
            <Button variant="ghost" className="-ml-4 gap-2">
              <ChevronLeft className="size-4" />
              Back to Subscriptions
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

  if (loading || !subscription) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/superadmin/subscriptions">
            <Button variant="ghost" className="-ml-4 gap-2">
              <ChevronLeft className="size-4" />
              Back to Subscriptions
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/superadmin/subscriptions">
          <Button variant="ghost" className="-ml-4 gap-2">
            <ChevronLeft className="size-4" />
            Back to Subscriptions
          </Button>
        </Link>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscription Details</h2>
          <p className="text-muted-foreground">
            View details for subscription #{subscription.id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">User Name</p>
              <p className="font-medium">{subscription.user_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User Email</p>
              <p className="font-medium">{subscription.user_email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">First Subscription</p>
              <div className="mt-1">
                {subscription.is_first_subscription ? (
                  <Badge variant="default">Yes</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Package</p>
                <p className="font-medium">{subscription.package}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {subscription.package_type}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subscription Reference</p>
                <p className="font-medium">{subscription.subscription_reference}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reference</p>
                <p className="font-medium">{subscription.reference}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(subscription.status)}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {subscription.starts_at ? parseDateString(subscription.starts_at)?.toLocaleString() : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                <p className="font-medium">
                  {subscription.expires_at ? parseDateString(subscription.expires_at)?.toLocaleString() : "-"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="font-medium">
                {subscription.created_at ? parseDateString(subscription.created_at)?.toLocaleString() : "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
