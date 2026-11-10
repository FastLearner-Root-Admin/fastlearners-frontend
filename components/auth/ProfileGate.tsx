"use client";

import React, { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { AlertCircle, ArrowRight, CheckCircle2, UserCheck } from "lucide-react";

import {
  calculateProfileCompletion,
  getMissingFields,
  isProfileComplete,
} from "@/lib/utils/profile-completion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ProfileGateProps {
  children?: React.ReactNode;
}

// Routes that must remain accessible for profile editing and onboarding
const ALLOWED_PATHS = [
  "/dashboard/settings/profile",
  "/dashboard/settings",
  "/onboarding",
  "/onboarding/complete-profile",
  "/auth",
];

export function ProfileGate({ children }: ProfileGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isComplete = useMemo(() => {
    if (!user) return true;
    // Admins and superadmins bypass profile completeness checks
    const role = user.role?.[0];
    if (role === "admin" || role === "superadmin") return true;
    return isProfileComplete(user);
  }, [user]);

  const missingFields = useMemo(() => {
    if (!user) return [];
    return getMissingFields(user);
  }, [user]);

  const percentage = useMemo(() => {
    if (!user) return 100;
    return calculateProfileCompletion(user);
  }, [user]);

  // If user is not authenticated or profile is complete, don't gate
  if (!isAuthenticated || !user || isComplete) {
    return <>{children}</>;
  }

  // Allow navigation to the profile edit/onboarding paths
  const isAllowedPath = ALLOWED_PATHS.some((path) => pathname.startsWith(path));

  const handleNavigateToProfile = () => {
    // If onboarding exists, or direct to settings profile edit
    router.push("/dashboard/settings/profile");
  };

  return (
    <>
      {children}

      <Dialog open={!isAllowedPath}>
        <DialogContent
          className="sm:max-w-md [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
              <AlertCircle className="size-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-center text-xl">
              Complete Your Profile
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              To ensure the best learning experience and security, you need to
              finish setting up your profile before accessing FastLearners
              features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>Profile Completion</span>
                <span className="text-primary">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>

            {missingFields.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Missing Required Information ({missingFields.length}):
                </p>
                <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-lg border p-2">
                  {missingFields.map((field, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                    >
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleNavigateToProfile}
              className="w-full gap-2"
              size="lg"
            >
              <span>Go to Profile Setup</span>
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Need help? Contact support or an administrator.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
