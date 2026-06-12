"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogle } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const scope = searchParams.get("scope");
        const authuser = searchParams.get("authuser");
        const prompt = searchParams.get("prompt");

        if (error) {
          console.error("Google OAuth error:", error);
          toast.error("Google authentication failed", {
            description:
              error === "access_denied"
                ? "You cancelled the Google authentication."
                : "Authentication was cancelled or failed.",
          });
          router.push("/auth/login");
          return;
        }

        if (!code) {
          console.error("No authorization code received");
          toast.error("Google authentication failed", {
            description: "No authorization code received from Google.",
          });
          router.push("/auth/login");
          return;
        }

        const callbackUrl = new URL(
          "https://app.fastlearnersapp.com/api/v1/google/callback",
        );
        callbackUrl.searchParams.set("code", code);
        if (scope) callbackUrl.searchParams.set("scope", scope);
        if (authuser) callbackUrl.searchParams.set("authuser", authuser);
        if (prompt) callbackUrl.searchParams.set("prompt", prompt);

        const response = await fetch(callbackUrl.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.content) {
          await loginWithGoogle(data.content);
          const isNewUser =
            data.content.user.role.includes("guest") || !data.content.user.name;
          if (isNewUser) {
            toast.success("Welcome to Fast Learners!", {
              description:
                "Your Google account has been connected. Please complete your profile.",
            });
            router.push("/dashboard");
          } else {
            toast.success("Welcome back!", {
              description: "You have successfully signed in with Google.",
            });
            router.push("/dashboard");
          }
        } else {
          throw new Error(data.message || "Google authentication failed");
        }
      } catch (error: any) {
        console.error("Google callback error:", error);
        toast.error("Google authentication failed", {
          description:
            error.message || "An unexpected error occurred. Please try again.",
        });
        router.push("/auth/login");
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, router, loginWithGoogle]);

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-primary" />
        <h2 className="mt-4 text-lg font-semibold">
          Completing Google Authentication...
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please wait while we authenticate your account and complete the
          process.
        </p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-primary" />
            <h2 className="mt-4 text-lg font-semibold">Loading...</h2>
          </div>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
