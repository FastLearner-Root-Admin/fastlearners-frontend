"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ArrowRight, BookOpen, Trophy, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, getProfileCompletionPercentage, isProfileComplete } =
    useAuthStore();
  const percentage = user ? getProfileCompletionPercentage() : 0;
  const isComplete = user ? isProfileComplete() : false;

  useEffect(() => {
    if (isComplete) {
      router.push("/dashboard");
    }
  }, [isComplete, router]);

  if (!user) return null;

  const benefits = [
    { icon: User, text: "Personalized learning experience" },
    { icon: BookOpen, text: "Access to all courses and activities" },
    { icon: Trophy, text: "Track your progress and achievements" },
  ];

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user.name || user.email?.split("@")[0] || "there"}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Complete your profile to unlock the full Fast Learner experience.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>
                You&apos;re {percentage}% done! Fill in the remaining details to
                get started.
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {percentage}%
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={percentage} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-medium">What you&apos;ll get:</h3>
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <benefit.icon className="size-4 shrink-0 text-primary" />
                  <span>{benefit.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
            <Button
              onClick={() => router.push("/onboarding/complete-profile")}
              className="flex-1"
            >
              Complete Profile
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="flex-1"
            >
              Skip for Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
