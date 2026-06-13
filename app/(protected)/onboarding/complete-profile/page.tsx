"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { calculateProfileCompletion } from "@/lib/utils/profile-completion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function CompleteProfilePage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (user) {
      const percentage = calculateProfileCompletion(user);
      setCompletionPercentage(percentage);
    }
  }, [user]);

  const handleComplete = () => {
    toast.success("Profile completed successfully!");
    // Clear banner dismissal from localStorage
    if (typeof window !== "undefined" && user?.id) {
      localStorage.removeItem(`profile-completion-banner-dismissed-${user.id}`);
    }
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto flex min-h-[400px] items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Complete Your Profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill in your information to get the most out of Fast Learner
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Profile Completion</span>
          <span className="font-medium">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      <OnboardingWizard onComplete={handleComplete} />
    </div>
  );
}
