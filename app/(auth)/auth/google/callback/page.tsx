"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { identifyUser, trackEvent } from "@/lib/analytics/posthog";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogle } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hashParams = new URLSearchParams(
          typeof window !== "undefined"
            ? window.location.hash.replace(/^#/, "")
            : "",
        );
        const idToken =
          searchParams.get("id_token") || hashParams.get("id_token");
        const error = searchParams.get("error");
        const hashError = hashParams.get("error");

        if (error || hashError) {
          console.error("Google OAuth error:", error || hashError);
          toast.error("Google authentication failed", {
            description:
              (error || hashError) === "access_denied"
                ? "You cancelled the Google authentication."
                : "Authentication was cancelled or failed.",
          });
          router.push("/auth/login");
          return;
        }

        if (!idToken) {
          console.error("No Google ID token received");
          toast.error("Google authentication failed", {
            description: "No Google ID token received.",
          });
          router.push("/auth/login");
          return;
        }

        const response = await fetch("/api/auth/google/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id_token: idToken }),
        });

        const data = await response.json();

        if (data.success && data.content) {
          await loginWithGoogle(data.content);
          identifyUser(data.content.user?.email, {
            email: data.content.user?.email,
            name: data.content.user?.name,
            role: data.content.user?.role?.[0] || null,
            class: data.content.user?.class || null,
            auth_provider: "google",
          });
          const isNewUser =
            data.content.user?.role?.includes("guest") ||
            !data.content.user?.name ||
            data.content.user?.role?.length === 0;
          trackEvent("user_logged_in", {
            method: "google",
            is_new_user: isNewUser,
          });
          if (isNewUser) {
            trackEvent("user_signed_up", { method: "google" });
          }
          if (isNewUser) {
            toast.success("Welcome to Fast Learners!", {
              description:
                "Your Google account has been connected. Please create your password.",
            });
            router.push("/auth/create-password");
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
