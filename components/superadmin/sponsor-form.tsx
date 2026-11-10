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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sponsor } from "@/lib/types/subscription";
import {
  adminCreateSponsor,
  adminUpdateSponsor,
  CreateSponsorData,
} from "@/lib/api/superadmin-subscription";

const sponsorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  organization_name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

type SponsorFormValues = z.infer<typeof sponsorSchema>;

interface SponsorFormProps {
  mode: "create" | "edit";
  initialData?: Sponsor;
  onSuccess: (sponsor: Sponsor | null) => void;
  onCancel: () => void;
}

export function SponsorForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: SponsorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SponsorFormValues>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: {
      name: initialData?.name || "",
      organization_name: initialData?.organization_name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      description: initialData?.description || "",
      is_active: initialData?.is_active ?? true,
    },
  });

  async function onSubmit(data: SponsorFormValues) {
    setIsSubmitting(true);
    try {
      const payload: CreateSponsorData = {
        name: data.name,
        organization_name: data.organization_name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        description: data.description || null,
      };

      let response;
      if (mode === "create") {
        response = await adminCreateSponsor(payload);
      } else {
        if (!initialData?.id) return;
        response = await adminUpdateSponsor(initialData.id, {
          ...payload,
          is_active: data.is_active ? "1" : "0",
        });
      }

      if (response.success) {
        showApiToast(
          response.type ?? "success",
          response.message || "Sponsor saved successfully"
        );
        onSuccess(null);
      } else if (response.errors) {
        Object.entries(response.errors).forEach(([key, messages]) => {
          form.setError(key as any, {
            type: "server",
            message: (messages as string[])[0],
          });
        });
      } else {
        showApiToast(response.type ?? "error", response.message || "Failed to save sponsor");
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
              <FormLabel>Contact Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="organization_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. ABC Groups" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="sponsor@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="0123456789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="123 ABC Road" {...field} />
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
                <Textarea placeholder="What this sponsor is about" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mode === "edit" && (
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <FormLabel className="mb-0">Active</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mode === "create" ? "Create Sponsor" : "Update Sponsor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
