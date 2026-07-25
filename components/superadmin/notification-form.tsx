"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  adminCreateNotification,
  adminUpdateNotification,
} from "@/lib/api/notifications";
import {
  AdminNotification,
  CreateNotificationData,
  NotificationAudience,
  NotificationType,
} from "@/lib/types/notification";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type_id: z.string().min(1, "Notification type is required"),
  audience: z.string().min(1, "Audience is required"),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface NotificationFormProps {
  audiences: NotificationAudience[];
  types: NotificationType[];
  mode: "create" | "edit";
  initialData?: AdminNotification;
  onCancel: () => void;
  onSuccess: () => void;
}

export function NotificationForm({
  audiences,
  types,
  mode,
  initialData,
  onCancel,
  onSuccess,
}: NotificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: initialData?.title || "",
      message: initialData?.message || "",
      type_id: "",
      audience: initialData?.audience || "all",
    },
  });

  async function onSubmit(data: NotificationFormValues) {
    if (mode === "create" && data.audience === "selected") {
      form.setError("audience", {
        type: "manual",
        message:
          "Selected users will be enabled when the backend adds the user_ids endpoint.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response =
        mode === "create"
          ? await adminCreateNotification({
              title: data.title,
              message: data.message,
              type_id: Number(data.type_id),
              audience: data.audience,
            } satisfies CreateNotificationData)
          : initialData?.id
            ? await adminUpdateNotification(initialData.id, {
                title: data.title,
                message: data.message,
              })
            : null;

      if (!response) return;

      if (response.success) {
        showApiToast(
          response.type ?? "success",
          response.message ||
            `Notification ${mode === "create" ? "created" : "updated"}`,
        );
        onSuccess();
      } else if (response.errors) {
        Object.entries(response.errors).forEach(([key, messages]) => {
          form.setError(key as keyof NotificationFormValues, {
            type: "server",
            message: Array.isArray(messages) ? messages[0] : String(messages),
          });
        });
      } else {
        showApiToast(
          response.type ?? "error",
          response.message || `Failed to ${mode} notification`,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Notification title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write the notification message"
                  className="min-h-32 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === "create" && (
          <>
            <FormField
              control={form.control}
              name="type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name} ({type.duration} days)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Duration is controlled by the selected type.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="audience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audience</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {audiences.map((audience) => (
                        <SelectItem key={audience.id} value={audience.slug}>
                          {audience.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The backend expects the audience slug.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mode === "create" ? "Create Notification" : "Update Notification"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
