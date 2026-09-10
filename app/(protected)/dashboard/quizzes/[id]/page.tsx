"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowLeft,
  Award,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  XCircle,
} from "lucide-react";

import {
  cancelRegistration,
  getLgas,
  getQuizCompetition,
  getRegistrationHistory,
  getStates,
  registerForCompetition,
} from "@/lib/api/quiz-competition";
import {
  QuizCompetition,
  QuizLga,
  QuizRegistration,
  QuizState,
} from "@/lib/types/quiz-competition";
import { getCompetitionStatusBadge } from "@/lib/utils/quiz-status";
import { showApiToast } from "@/lib/utils/api-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";

const registrationSchema = z.object({
  state_id: z.string().min(1, "Please select a state"),
  lga_id: z.string().min(1, "Please select an LGA"),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function QuizCompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = Number(params.id);

  const [competition, setCompetition] = useState<QuizCompetition | null>(null);
  const [existingRegistration, setExistingRegistration] =
    useState<QuizRegistration | null>(null);
  const [states, setStates] = useState<QuizState[]>([]);
  const [lgas, setLgas] = useState<QuizLga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLgas, setIsLoadingLgas] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { handleSubmit, watch, setValue, formState: { errors } } =
    useForm<RegistrationFormValues>({
      resolver: zodResolver(registrationSchema),
      defaultValues: { state_id: "", lga_id: "" },
    });
  const selectedStateId = watch("state_id");

  useEffect(() => {
    async function fetchData() {
      if (!competitionId) return;
      setIsLoading(true);
      try {
        const [competitionRes, statesRes, historyRes] = await Promise.all([
          getQuizCompetition(competitionId),
          getStates(),
          getRegistrationHistory(),
        ]);

        if (competitionRes.success && competitionRes.content?.quiz) {
          setCompetition(competitionRes.content.quiz);
        } else {
          showApiToast(
            competitionRes.type ?? "error",
            competitionRes.message || "Quiz competition not found.",
          );
          router.replace("/dashboard/quizzes");
          return;
        }

        if (statesRes.success && statesRes.content?.states) {
          setStates(statesRes.content.states);
        }

        if (historyRes.success && historyRes.content?.quizzes?.quizzes) {
          const match = historyRes.content.quizzes.quizzes.find(
            (r) => r.competition_code === competitionRes.content?.quiz.competition_code,
          );
          setExistingRegistration(match || null);
        }
      } catch (err) {
        showApiToast("error", "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [competitionId, router]);

  useEffect(() => {
    async function fetchLgas() {
      if (!selectedStateId) {
        setLgas([]);
        return;
      }
      setIsLoadingLgas(true);
      setValue("lga_id", "");
      try {
        const response = await getLgas(Number(selectedStateId));
        if (response.success && response.content?.lgas) {
          setLgas(response.content.lgas);
        } else {
          setLgas([]);
        }
      } finally {
        setIsLoadingLgas(false);
      }
    }

    fetchLgas();
  }, [selectedStateId, setValue]);

  const onSubmit = async (data: RegistrationFormValues) => {
    if (!competition) return;
    setIsSubmitting(true);
    try {
      const response = await registerForCompetition(
        competition.id,
        Number(data.state_id),
        Number(data.lga_id),
      );
      if (response.success) {
        showApiToast("success", response.message || "Registered successfully!");
        router.push("/dashboard/quizzes/history");
      } else {
        showApiToast(
          response.type ?? "error",
          response.message || "Failed to register for this competition.",
        );
      }
    } catch (err) {
      showApiToast("error", "An error occurred while registering.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!existingRegistration) return;
    setIsCancelling(true);
    try {
      const response = await cancelRegistration(existingRegistration.id);
      if (response.success) {
        showApiToast("success", response.message || "Registration cancelled.");
        setExistingRegistration(null);
      } else {
        showApiToast(
          response.type ?? "error",
          response.message || "Failed to cancel registration.",
        );
      }
    } catch (err) {
      showApiToast("error", "An error occurred while cancelling.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Button variant="ghost" onClick={() => router.back()} className="-ml-2">
        <ArrowLeft className="mr-2 size-4" />
        Back
      </Button>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !competition ? (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="trophy" />
          <EmptyPlaceholder.Title>Quiz competition not found</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            It may have been removed or the link is incorrect.
          </EmptyPlaceholder.Description>
          <Button asChild>
            <Link href="/dashboard/quizzes">Back to Competitions</Link>
          </Button>
        </EmptyPlaceholder>
      ) : (
        <>
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-2xl">{competition.title}</CardTitle>
                {getCompetitionStatusBadge(competition.status)}
              </div>
              <p className="text-muted-foreground">{competition.description}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4" />
                <span>Competition date: {competition.competition_date}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                <span>
                  {competition.start_time} &ndash; {competition.end_time}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" />
                <span>
                  Registration: {competition.registration_start_date} to{" "}
                  {competition.registration_end_date}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="size-4" />
                <span className="font-mono text-xs">
                  {competition.competition_code}
                </span>
              </div>
            </CardContent>
          </Card>

          {existingRegistration ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  You&apos;re registered for this competition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Quiz User Code</p>
                    <p className="font-mono font-medium">
                      {existingRegistration.user_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium">
                      {existingRegistration.lga}, {existingRegistration.state}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 size-4" />
                  )}
                  Cancel Registration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Register</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="state_id">State</Label>
                    <Select
                      value={selectedStateId}
                      onValueChange={(value) => setValue("state_id", value)}
                    >
                      <SelectTrigger id="state_id">
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={String(state.id)}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state_id && (
                      <p className="text-sm text-destructive">
                        {errors.state_id.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lga_id">Local Government Area</Label>
                    <Select
                      value={watch("lga_id")}
                      onValueChange={(value) => setValue("lga_id", value)}
                      disabled={!selectedStateId || isLoadingLgas}
                    >
                      <SelectTrigger id="lga_id">
                        <SelectValue
                          placeholder={
                            !selectedStateId
                              ? "Select a state first"
                              : isLoadingLgas
                                ? "Loading LGAs..."
                                : "Select your LGA"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {lgas.map((lga) => (
                          <SelectItem key={lga.id} value={String(lga.id)}>
                            {lga.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.lga_id && (
                      <p className="text-sm text-destructive">
                        {errors.lga_id.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Register for Competition"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/dashboard/quizzes/history" className="underline">
              View all your registrations
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
