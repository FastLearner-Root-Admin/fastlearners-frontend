"use client";

import { useEffect, useRef, useState } from "react";
import { getPackage, subscribeToPackage, verifyCoupon } from "@/lib/api/subscription";
import { trackEvent } from "@/lib/analytics/posthog";
import { Package } from "@/lib/types/subscription";
import { PackageCard } from "@/components/subscription/package-card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showApiToast } from "@/lib/utils/api-toast";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Tag, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const checkoutSchema = z.object({
  coupon_code: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [isLoadingPackage, setIsLoadingPackage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedCheckout = useRef(false);

  const [couponVerified, setCouponVerified] = useState(false);
  const [couponBreakdown, setCouponBreakdown] = useState<{ amount: string; discount_amount: string; payment_amount: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCoupon, setVerifiedCoupon] = useState<string | null>(null);

  const { register, handleSubmit, watch } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

  const couponCode = watch("coupon_code");

  useEffect(() => {
    if (couponVerified && couponCode !== verifiedCoupon) {
      setCouponBreakdown(null);
      setCouponVerified(false);
    }
  }, [couponCode, verifiedCoupon, couponVerified]);

  useEffect(() => {
    async function fetchPackage() {
      if (!params.id) return;
      try {
        const response = await getPackage(Number(params.id));
        if (response.success && response.content?.package) {
          setPkg(response.content.package);
        } else {
          showApiToast(response.type ?? "error", response.message || "Failed to load package.");
          router.replace("/dashboard/subscriptions");
        }
      } catch (err) {
        showApiToast("error", "An unexpected error occurred.");
        router.replace("/dashboard/subscriptions");
      } finally {
        setIsLoadingPackage(false);
      }
    }

    fetchPackage();
  }, [params.id, router]);

  useEffect(() => {
    if (!pkg || hasTrackedCheckout.current) return;
    hasTrackedCheckout.current = true;
    trackEvent("checkout_started", {
      plan: pkg.name,
      amount: pkg.amount,
    });
  }, [pkg]);

  const handleVerifyCoupon = async () => {
    if (!pkg) return;
    if (!couponCode) {
      showApiToast("error", "Please enter a coupon code");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyCoupon(pkg.id, couponCode);
      if (response.success && response.content) {
        setCouponBreakdown(response.content);
        setCouponVerified(true);
        setVerifiedCoupon(couponCode);
        showApiToast("success", "Coupon applied successfully");
      } else {
        setCouponBreakdown(null);
        setCouponVerified(false);
        setVerifiedCoupon(null);
        showApiToast(response.type ?? "error", response.message || "Failed to verify coupon");
      }
    } catch (err) {
      setCouponBreakdown(null);
      setCouponVerified(false);
      setVerifiedCoupon(null);
      showApiToast("error", "An error occurred while verifying coupon");
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!pkg) return;
    setIsSubmitting(true);
    try {
      const response = await subscribeToPackage(pkg.id, data.coupon_code || undefined);
      if (response.success && response.content?.authorization_url) {
        window.location.href = response.content.authorization_url;
      } else {
        if (response.code === 422 && response.errors) {
          Object.values(response.errors).forEach((messages: any) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => showApiToast("error", msg));
            } else if (typeof messages === "string") {
              showApiToast("error", messages);
            }
          });
        } else {
          showApiToast(response.type ?? "error", response.message || "Failed to initiate subscription.");
        }
      }
    } catch (err) {
      showApiToast("error", "An error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="mt-2 text-muted-foreground">
          Complete your subscription securely.
        </p>
      </div>

      {isLoadingPackage ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : !pkg ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Package not found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="size-5" />
                  Discount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="coupon_code">Coupon Code (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="coupon_code"
                        placeholder="e.g. NEWCOMER20"
                        {...register("coupon_code")}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleVerifyCoupon}
                        disabled={isVerifying}
                      >
                        {isVerifying ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
                      </Button>
                    </div>
                  </div>

                  {couponBreakdown && (
                    <div className="space-y-2 rounded-md border bg-muted/50 p-4">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>₦{couponBreakdown.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount Amount:</span>
                        <span>₦{couponBreakdown.discount_amount}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Payable Amount:</span>
                        <span>₦{couponBreakdown.payment_amount}</span>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Make Payment"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:sticky lg:top-6">
            <PackageCard package={pkg} showSubscribeButton={false} />
          </div>
        </div>
      )}
    </div>
  );
}
