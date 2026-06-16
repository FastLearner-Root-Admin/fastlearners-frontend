"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRoleBasedRoute, useAuthStore } from "@/store/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { identifyUser, trackEvent } from "@/lib/analytics/posthog";
import { startGoogleAuth } from "@/lib/auth/google";
import { loginSchema } from "@/lib/validations/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError, hydrate, isHydrated } =
    useAuthStore();

  // Ensure auth store is properly hydrated on mount
  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [hydrate, isHydrated]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFieldError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Call login - this sets the cookie and stores user in auth store
      await login(data);

      // Get user from auth store (returned from login response)
      const user = useAuthStore.getState().user;

      if (!user) {
        toast.error("Login failed - no user data received");
        return;
      }

      // Check user role and determine redirect path
      const userRole = user.role?.[0]; // Primary role
      let redirectPath = "/dashboard"; // Default

      if (!userRole || userRole === "guest") {
        // No role or guest role → redirect to role selection
        redirectPath = "/auth/set-role";
      }
      // Note: Both student and guardian go to /dashboard
      // The dashboard page will render the appropriate component based on role

      // Show success message
      toast.success("Welcome back!", {
        description: "Redirecting to your dashboard...",
        duration: 2000,
      });
      identifyUser(user.email, {
        email: user.email,
        name: user.name,
        role: userRole || null,
        class: user.class || null,
        auth_provider: "password",
      });
      trackEvent("user_logged_in", { method: "password", role: userRole });

      // Use window.location for hard navigation to ensure cookies are read
      // This prevents hydration issues
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 500);
    } catch (err: any) {
      // Check if we need to redirect to verify-email (inactive user)
      if (err?.redirect) {
        toast.info("Please verify your email first");
        setTimeout(() => {
          window.location.href = err.redirect;
        }, 1000);
        return;
      }

      // Show error message (already set in auth store)
      const errorMessage = useAuthStore.getState().error || "Login failed";
      toast.error(errorMessage);
    }
  };

  const handleGoogleLogin = () => {
    try {
      // Show loading state briefly using the auth store
      useAuthStore.getState().setLoading(true);

      toast.info("Redirecting to Google...", {
        description: "You will be redirected back after authentication.",
      });

      // Small delay to show the loading state, then redirect
      setTimeout(() => {
        startGoogleAuth();
      }, 500);
    } catch (err: any) {
      console.error("Google login error:", err);
      toast.error(
        "Unable to redirect to Google login. Please try again later.",
      );
      useAuthStore.getState().setLoading(false);
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
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Login with your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-2">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-component-md sm:gap-component-lg">
            <div className="grid gap-component-sm sm:gap-component-md">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email_phone")}
                className={errors.email_phone ? "border-destructive" : ""}
                disabled={isLoading && isHydrated}
                required
                autoComplete="off"
                data-lpignore="true"
              />
              {errors.email_phone && (
                <p className="text-sm text-destructive">
                  {errors.email_phone.message}
                </p>
              )}
            </div>

            <div className="grid gap-component-sm sm:gap-component-md">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="ml-auto px-1 py-2 text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={
                    errors.password ? "border-destructive pr-10" : "pr-10"
                  }
                  disabled={isLoading && isHydrated}
                  required
                  autoComplete="new-password"
                  data-lpignore="true"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full w-control-sm px-3 py-2 hover:bg-transparent sm:w-control-md"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading && isHydrated}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4 text-muted-foreground" />
                  ) : (
                    <Eye className="size-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="responsive"
              className="w-full"
              disabled={(isLoading && isHydrated) || isSubmitting}
            >
              {(isLoading && isHydrated) || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Login"
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
              onClick={handleGoogleLogin}
              disabled={isLoading && isHydrated}
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
              Login with Google
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <Link href="#">Terms of Service</Link> and <Link href="#">Privacy Policy</Link>.
      </div> */}

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="px-1 py-2 underline underline-offset-4"
        >
          Sign up
        </Link>
      </div>
    </form>
  );
}
