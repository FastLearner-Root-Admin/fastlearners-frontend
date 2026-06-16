"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { authApi } from "@/lib/api/auth";
import { identifyUser, trackEvent } from "@/lib/analytics/posthog";
import { startGoogleAuth } from "@/lib/auth/google";
import { cn } from "@/lib/utils";
import { registerSchema } from "@/lib/validations/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authApi.register(data);

      if (response.success) {
        toast.success("Registration successful!", {
          description: "Please check your email for verification.",
        });
        identifyUser(data.email, {
          email: data.email,
          name: null,
          role: null,
          class: null,
          auth_provider: "email",
        });
        trackEvent("user_signed_up", { method: "email" });

        // Navigate to verify email page with email in URL params
        router.push(
          `/auth/verify-email?email=${encodeURIComponent(data.email)}`,
        );
      } else {
        setError(response.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      let errorMessage = "Registration failed. Please try again.";

      // Handle API response errors
      if (err?.message) {
        errorMessage = err.message;
      }
      // Handle validation errors from API
      else if (err?.errors && typeof err.errors === "object") {
        const emailErrors = err.errors.email;
        if (emailErrors && Array.isArray(emailErrors)) {
          errorMessage = emailErrors[0];
        } else {
          // Get the first error from any field
          const firstError = Object.values(err.errors).flat()[0];
          if (firstError && typeof firstError === "string") {
            errorMessage = firstError;
          }
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Referral code verification ──────────────────────────────────────────────
  const [referralStatus, setReferralStatus] = useState<
    "idle" | "checking" | "verified" | "invalid"
  >("idle");
  const [referralMessage, setReferralMessage] = useState<string>("");

  const referralCodeValue = watch("referral_code");

  // Reset verification state when the code changes
  useEffect(() => {
    if (referralStatus !== "idle") {
      setReferralStatus("idle");
      setReferralMessage("");
    }
  }, [referralCodeValue, referralStatus]);

  const handleVerify = async () => {
    const code = watch("referral_code") ?? "";

    if (!code || code.length < 8) {
      setReferralStatus("invalid");
      setReferralMessage("Please enter a valid 8-character referral code.");
      return;
    }

    try {
      setReferralStatus("checking");
      const response = await authApi.verifyReferralCode(code);
      setReferralStatus("verified");
      setReferralMessage(
        response.message ?? "Referral code verified successfully!",
      );
    } catch (err: any) {
      setReferralStatus("invalid");
      setReferralMessage(
        err?.message ?? "Referral code does not exist, try again!",
      );
    }
  };
  // ───────────────────────────────────────────────────────────────────────────

  const handleGoogleSignUp = () => {
    try {
      setIsLoading(true);

      toast.info("Redirecting to Google...", {
        description:
          "You will be redirected back to complete your registration.",
      });

      setTimeout(() => {
        startGoogleAuth();
      }, 500);
    } catch (err: any) {
      console.error("Google sign-up error:", err);
      toast.error(
        "Unable to redirect to Google sign-up. Please try again later.",
      );
      setIsLoading(false);
    }
  };

  return (
    <form
      className={cn(
        "flex flex-col gap-component-md sm:gap-component-lg",
        className,
      )}
      {...props}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col items-center gap-component-xs text-center sm:gap-component-sm">
        <h1 className="text-heading-xl font-bold sm:text-2xl">
          Create your account
        </h1>
        <p className="text-balance text-sm text-muted-foreground sm:text-base">
          Enter your email to get started with Fast Learners
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-component-md sm:gap-component-lg">
        {/* Email field */}
        <div className="grid gap-component-sm sm:gap-component-md">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
            disabled={isLoading}
            required
            autoComplete="off"
            data-lpignore="true"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* ── Referral code field ─────────────────────────────────────────── */}
        <div className="grid gap-component-sm sm:gap-component-md">
          <Label htmlFor="referral_code">
            Referral Code{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="referral_code"
              type="text"
              placeholder="ABC1DEF2"
              maxLength={8}
              {...register("referral_code")}
              disabled={isLoading}
              autoComplete="off"
              className={
                referralStatus === "invalid"
                  ? "border-destructive"
                  : referralStatus === "verified"
                    ? "border-green-500"
                    : ""
              }
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleVerify}
              disabled={isLoading || referralStatus === "checking"}
            >
              {referralStatus === "checking" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>
          {referralMessage && (
            <p
              className={
                referralStatus === "verified"
                  ? "text-sm text-green-600 dark:text-green-400"
                  : "text-sm text-destructive"
              }
            >
              {referralMessage}
            </p>
          )}
          {errors.referral_code && (
            <p className="text-sm text-destructive">
              {errors.referral_code.message}
            </p>
          )}
        </div>
        {/* ──────────────────────────────────────────────────────────────────── */}

        <Button
          type="submit"
          size="responsive"
          className="w-full"
          disabled={isLoading || isSubmitting}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <div className="relative text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border sm:text-sm">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="responsive"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
        >
          <svg className="mr-2 size-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </Button>
      </div>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="px-1 py-2 underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
