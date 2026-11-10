"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { showApiToast } from "@/lib/utils/api-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Sponsor, Voucher } from "@/lib/types/subscription";
import {
  adminCreateVoucher,
  adminUpdateVoucher,
  adminGetPackages,
  adminGetSponsors,
} from "@/lib/api/superadmin-subscription";

const createSchema = z.object({
  package_id: z.coerce.number().positive("Package is required"),
  sponsor_id: z.coerce.number().positive("Sponsor is required"),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
});

const editSchema = z.object({
  is_valid: z.boolean(),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

interface VoucherFormProps {
  mode: "create" | "edit";
  initialData?: Voucher;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VoucherForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: VoucherFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    if (mode !== "create") return;
    adminGetPackages().then((res) => {
      if (res.success && res.content) setPackages(res.content.packages);
    });
    adminGetSponsors().then((res) => {
      if (res.success && res.content) setSponsors(res.content.sponsors);
    });
  }, [mode]);

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { package_id: 0, sponsor_id: 0, quantity: 1 },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { is_valid: initialData?.is_valid ?? true },
  });

  async function onCreateSubmit(data: CreateFormValues) {
    setIsSubmitting(true);
    try {
      const response = await adminCreateVoucher(data);
      if (response.success) {
        showApiToast(
          response.type ?? "success",
          response.message || "Voucher(s) created successfully"
        );
        onSuccess();
      } else if (response.errors) {
        Object.entries(response.errors).forEach(([key, messages]) => {
          createForm.setError(key as any, {
            type: "server",
            message: (messages as string[])[0],
          });
        });
      } else {
        showApiToast(response.type ?? "error", response.message || "Failed to create voucher");
      }
    } catch (error: any) {
      showApiToast("error", "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onEditSubmit(data: EditFormValues) {
    if (!initialData?.id) return;
    setIsSubmitting(true);
    try {
      const response = await adminUpdateVoucher(initialData.id, {
        is_valid: data.is_valid ? 1 : 0,
      });
      if (response.success) {
        showApiToast(
          response.type ?? "success",
          response.message || "Voucher updated successfully"
        );
        onSuccess();
      } else {
        showApiToast(response.type ?? "error", response.message || "Failed to update voucher");
      }
    } catch (error: any) {
      showApiToast("error", "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === "edit") {
    return (
      <Form {...editForm}>
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
          <div className="space-y-1 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Code</p>
            <p className="font-mono text-sm">{initialData?.code}</p>
          </div>
          <div className="space-y-1 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Sponsor</p>
            <p className="text-sm">{initialData?.sponsor.name} ({initialData?.sponsor.organization_name})</p>
          </div>
          <div className="space-y-1 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Package</p>
            <p className="text-sm">{initialData?.package.name}</p>
          </div>
          <FormField
            control={editForm.control}
            name="is_valid"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel className="mb-0">Valid</FormLabel>
                  <FormDescription>
                    Turn off to revoke this voucher code before it&apos;s redeemed.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Update Voucher
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...createForm}>
      <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 pt-4">
        <FormField
          control={createForm.control}
          name="sponsor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sponsor</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                defaultValue={field.value ? field.value.toString() : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sponsor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sponsors.map((sponsor) => (
                    <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                      {sponsor.name} ({sponsor.organization_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={createForm.control}
          name="package_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Package</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                defaultValue={field.value ? field.value.toString() : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id.toString()}>
                      {pkg.name} ({pkg.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={createForm.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormDescription>
                Generates this many unique, single-use voucher codes for the selected sponsor and package.
              </FormDescription>
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
            Create Voucher(s)
          </Button>
        </div>
      </form>
    </Form>
  );
}
