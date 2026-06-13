"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, X } from "lucide-react";

import { getMissingFields } from "@/lib/utils/profile-completion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const ProfileCompletionBanner: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [isVisible, setIsVisible] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setIsVisible(false);
      return;
    }

    const completion = useAuthStore.getState().getProfileCompletionPercentage();
    const missing = getMissingFields(user);

    setPercentage(completion);
    setMissingFields(missing);

    // Check dismissal state
    const dismissalKey = `profile-completion-banner-dismissed-${user.id}`;
    const dismissedAt = localStorage.getItem(dismissalKey);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in ms
      if (now - dismissedTime < twentyFourHours) {
        setIsVisible(false);
        return;
      }
    }

    // Don't show if profile is complete
    if (completion === 100) {
      setIsVisible(false);
      return;
    }

    // Set visible after all checks
    setIsVisible(true);
  }, [user]);

  const handleDismiss = () => {
    if (!user) return;
    const dismissalKey = `profile-completion-banner-dismissed-${user.id}`;
    localStorage.setItem(dismissalKey, Date.now().toString());
    setIsVisible(false);
  };

  if (!user || !isVisible || percentage === 100) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="w-full border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-6"
        >
          <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 rounded-lg border border-cyan-500/20 bg-card/80 px-4 py-3 shadow-sm shadow-cyan-950/5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-500">
                <AlertCircle className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Complete your profile
                </p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                  {percentage}% complete. Add the remaining{" "}
                  {missingFields.length}{" "}
                  {missingFields.length === 1 ? "field" : "fields"} to unlock
                  the full experience.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[320px] sm:flex-row sm:items-center sm:justify-end">
              <div className="flex min-w-0 items-center gap-2 sm:w-28">
                <Progress
                  value={percentage}
                  className={cn(
                    "h-2 flex-1 overflow-hidden rounded-full bg-muted",
                  )}
                />
                <span className="w-9 text-right text-xs font-medium text-muted-foreground">
                  {percentage}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild className="flex-1 sm:flex-none" size="sm">
                  <Link href="/onboarding">
                    Complete
                    <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
                  size="sm"
                >
                  Remind later
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="size-9 shrink-0 p-0 text-muted-foreground hover:text-foreground sm:hidden"
                  size="icon"
                  aria-label="Remind me later"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
