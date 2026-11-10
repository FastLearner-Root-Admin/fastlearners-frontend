"use client";

import { Package } from "@/lib/types/subscription";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock } from "lucide-react";

interface PackageCardProps {
  package: Package;
  showSubscribeButton?: boolean;
}

export function PackageCard({ 
  package: pkg, 
  showSubscribeButton = true, 
}: PackageCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xl">{pkg.name}</CardTitle>
          <div className="flex shrink-0 gap-2">
            {pkg.type === "quiz" && (
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100/80">
                Quiz Entry
              </Badge>
            )}
            <Badge variant="outline" className="capitalize">
              {pkg.billing_cycle}
            </Badge>
          </div>
        </div>
        {pkg.description && (
          <CardDescription className="mt-2 line-clamp-2">
            {pkg.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="grow">
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">₦{pkg.amount.toLocaleString()}</span>
            {pkg.original_amount !== null && (
              <span className="text-lg text-muted-foreground line-through">
                ₦{pkg.original_amount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          <span>{pkg.duration_days} days</span>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex gap-3">
        {showSubscribeButton && (
          <Button className="w-full" asChild>
            <Link href={`/dashboard/subscriptions/${pkg.id}/checkout`}>Subscribe</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
