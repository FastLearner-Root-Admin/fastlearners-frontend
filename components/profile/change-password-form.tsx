"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Lock,
  RefreshCw,
  Shield,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  changePassword,
  ChangePasswordData,
  validatePasswordData,
} from "@/lib/api/profile";
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

// Password validation schema
const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    new_password_confirmation: z
      .string()
      .min(1, "Password confirmation is required"),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: "Passwords do not match",
    path: ["new_password_confirmation"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watch("new_password");

  const onSubmit = async (data: PasswordFormData) => {
    try {
      setIsChanging(true);
      setErrorMessage(null); // Clear any previous error

      // Additional validation
      const validationErrors = validatePasswordData(data as ChangePasswordData);
      if (validationErrors.length > 0) {
        setErrorMessage(validationErrors[0]);
        return;
      }

      // Change password
      await changePassword(data as ChangePasswordData);

      // Reset form
      reset();
      toast.success("Password changed successfully");
      onSuccess?.();
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to change password");
    } finally {
      setIsChanging(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 0, label: "Very Weak", color: "bg-red-500" },
      { strength: 1, label: "Weak", color: "bg-red-400" },
      { strength: 2, label: "Fair", color: "bg-yellow-500" },
      { strength: 3, label: "Good", color: "bg-yellow-400" },
      { strength: 4, label: "Strong", color: "bg-green-500" },
      { strength: 5, label: "Very Strong", color: "bg-green-600" },
    ];

    return levels[strength];
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-5" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your account password. Make sure to use a strong, unique
          password.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Display error message if present */}
        {errorMessage && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="size-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrentPassword ? "text" : "password"}
                {...register("current_password")}
                placeholder="Enter your current password"
                className="pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="size-4 text-muted-foreground" />
                ) : (
                  <Eye className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.current_password && (
              <p className="text-sm text-red-600">
                {errors.current_password.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                {...register("new_password")}
                placeholder="Enter your new password"
                className="pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="size-4 text-muted-foreground" />
                ) : (
                  <Eye className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {passwordStrength.label}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium">Password requirements:</p>
                  <ul className="grid grid-cols-2 gap-1 text-xs">
                    <li
                      className={`flex items-center gap-1 ${newPassword.length >= 8 ? "text-green-600" : "text-gray-500"}`}
                    >
                      <CheckCircle className="size-3" />
                      8+ characters
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? "text-green-600" : "text-gray-500"}`}
                    >
                      <CheckCircle className="size-3" />
                      Lowercase letter
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? "text-green-600" : "text-gray-500"}`}
                    >
                      <CheckCircle className="size-3" />
                      Uppercase letter
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/\d/.test(newPassword) ? "text-green-600" : "text-gray-500"}`}
                    >
                      <CheckCircle className="size-3" />
                      Number
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {errors.new_password && (
              <p className="text-sm text-red-600">
                {errors.new_password.message}
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="new_password_confirmation">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="new_password_confirmation"
                type={showConfirmPassword ? "text" : "password"}
                {...register("new_password_confirmation")}
                placeholder="Confirm your new password"
                className="pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4 text-muted-foreground" />
                ) : (
                  <Eye className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.new_password_confirmation && (
              <p className="text-sm text-red-600">
                {errors.new_password_confirmation.message}
              </p>
            )}
          </div>

          {/* Security Notice */}
          <Alert>
            <Shield className="size-4" />
            <AlertDescription>
              After changing your password, you may be signed out of other
              devices for security.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isChanging}>
              {isChanging ? (
                <>
                  <RefreshCw className="mr-2 size-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Key className="mr-2 size-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
