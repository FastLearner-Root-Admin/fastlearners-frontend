"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { showApiToast } from "@/lib/utils/api-toast";
import {
  adminCreateCompetition,
  adminGetCompetitionStatuses,
  adminUpdateCompetition,
} from "@/lib/api/superadmin-quiz";
import {
  AdminQuizCompetition,
  CreateQuizCompetitionData,
  QuizCompetitionStatusOption,
} from "@/lib/types/quiz-competition";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const competitionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  registration_start_date: z.string().min(1, "Registration start date is required"),
  registration_end_date: z.string().min(1, "Registration end date is required"),
  competition_date: z.string().min(1, "Competition date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  maximum_contestants: z.coerce.number().positive("Must be a positive number"),
  competition_status_id: z.coerce.number().positive("Status is required"),
  allow_self_registration: z.coerce.number().min(0).max(1),
  is_active: z.coerce.number().min(0).max(1),
});

type CompetitionFormValues = z.infer<typeof competitionSchema>;

interface QuizCompetitionFormProps {
  mode: "create" | "edit";
  initialData?: AdminQuizCompetition;
  onSuccess: () => void;
  onCancel: () => void;
}

export function QuizCompetitionForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: QuizCompetitionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statuses, setStatuses] = useState<QuizCompetitionStatusOption[]>([]);

  const form = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      registration_start_date: initialData?.registration_start_date || "",
      registration_end_date: initialData?.registration_end_date || "",
      competition_date: initialData?.competition_date || "",
      start_time: initialData?.start_time || "",
      end_time: initialData?.end_time || "",
      maximum_contestants: initialData?.maximum_contestants || 100,
      competition_status_id: 0,
      allow_self_registration: initialData?.allow_self_registration ? 1 : 0,
      is_active: initialData?.is_active ? 1 : 0,
    },
  });

  useEffect(() => {
    adminGetCompetitionStatuses().then((res) => {
      if (res.success && res.content?.competition_statuses) {
        setStatuses(res.content.competition_statuses);
        // The competition list/view endpoints only return the status *name*, not its id,
        // so match it up here once the status options are loaded.
        if (initialData) {
          const match = res.content.competition_statuses.find(
            (s) => s.name === initialData.status,
          );
          if (match) form.setValue("competition_status_id", match.id);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(data: CompetitionFormValues) {
    setIsSubmitting(true);
    try {
      const payload: CreateQuizCompetitionData = {
        title: data.title,
        description: data.description,
        registration_start_date: data.registration_start_date,
        registration_end_date: data.registration_end_date,
        competition_date: data.competition_date,
        start_time: data.start_time,
        end_time: data.end_time,
        maximum_contestants: String(data.maximum_contestants),
        competition_status_id: data.competition_status_id,
        allow_self_registration: data.allow_self_registration as 0 | 1,
        is_active: data.is_active as 0 | 1,
      };

      const response =
        mode === "create"
          ? await adminCreateCompetition(payload)
          : await adminUpdateCompetition(initialData!.id, payload);

      if (response.success) {
        showApiToast(
          response.type ?? "success",
          response.message ||
            `Quiz competition ${mode === "create" ? "created" : "updated"} successfully`,
        );
        onSuccess();
      } else if (response.errors) {
        Object.entries(response.errors).forEach(([key, messages]) => {
          form.setError(key as any, {
            type: "server",
            message: (messages as string[])[0],
          });
        });
      } else {
        showApiToast(
          response.type ?? "error",
          response.message || `Failed to ${mode} quiz competition`,
        );
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="FLNQC 2026" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Competition details"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="registration_start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Starts</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="registration_end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Ends</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="competition_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Competition Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="maximum_contestants"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Contestants</FormLabel>
              <FormControl>
                <Input type="number" placeholder="50000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="competition_status_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                value={field.value ? String(field.value) : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="allow_self_registration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Self Registration</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Allowed</SelectItem>
                    <SelectItem value="0">Not Allowed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mode === "create" ? "Create Competition" : "Update Competition"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
