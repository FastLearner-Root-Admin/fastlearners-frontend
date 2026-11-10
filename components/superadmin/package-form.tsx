"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { showApiToast } from "@/lib/utils/api-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package } from "@/lib/types/subscription";
import { normalizeAmount } from "@/lib/utils";
import {
  adminCreatePackage,
  adminUpdatePackage,
  CreatePackageData,
} from "@/lib/api/superadmin-subscription";

const packageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["subscription", "quiz"]),
  amount: z.string().min(1, "Amount is required"),
  original_amount: z.string().optional().nullable(),
  billing_cycle: z.enum(["monthly", "yearly"]),
  duration_days: z.coerce.number().int().positive("Duration must be a positive integer"),
  description: z.string().optional().nullable(),
});

type PackageFormValues = z.infer<typeof packageSchema>;

interface PackageFormProps {
  mode: "create" | "edit";
  initialData?: Package;
  onSuccess: (pkg: Package) => void;
  onCancel: () => void;
}

export function PackageForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: PackageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "subscription",
      amount: normalizeAmount(initialData?.amount),
      original_amount: normalizeAmount(initialData?.original_amount),
      billing_cycle: initialData?.billing_cycle || "monthly",
      duration_days: initialData?.duration_days || 30,
      description: initialData?.description || "",
    },
  });

  async function onSubmit(data: PackageFormValues) {
    setIsSubmitting(true);
    try {
      const payload: CreatePackageData = {
        name: data.name,
        type: data.type,
        amount: data.amount,
        billing_cycle: data.billing_cycle,
        duration_days: data.duration_days,
        description: data.description || null,
        original_amount: data.original_amount || null,
      };

      const response =
        mode === "create"
          ? await adminCreatePackage(payload)
          : await adminUpdatePackage(initialData!.id, payload);

      if (response.success && response.content?.package) {
        showApiToast(
          response.type ?? "success",
          response.message || "Package saved successfully"
        );
        onSuccess(response.content.package);
      } else if (response.errors) {
        Object.entries(response.errors).forEach(([key, messages]) => {
          form.setError(key as any, {
            type: "server",
            message: (messages as string[])[0],
          });
        });
      } else {
        showApiToast(response.type ?? "error", response.message || "Failed to save package");
      }
    } catch (error: any) {
      showApiToast("error", "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Pro Monthly" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input placeholder="10.00" type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="original_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Original Amount (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="15.00"
                  type="number"
                  step="0.01"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="billing_cycle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Cycle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a billing cycle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (Days)</FormLabel>
              <FormControl>
                <Input placeholder="30" type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Best for individuals"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mode === "create" ? "Create Package" : "Update Package"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
