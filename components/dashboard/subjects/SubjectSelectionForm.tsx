"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSelectiveRequirement,
  getSubjectIcon,
} from "@/data/subjects-metadata";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  getSubjects,
  updateCompulsorySelective,
  updateSelectiveSubjects,
} from "@/lib/api/subjects";
import type { SubjectItem } from "@/lib/types/subjects";
import { cn } from "@/lib/utils";
import { formatApiErrorMessage } from "@/lib/utils/api-errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface SubjectSelectionFormProps {
  token?: string; // Optional token for direct API calls (server-side)
  classLevel: string;
}

export function SubjectSelectionForm({
  token,
  classLevel,
}: SubjectSelectionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjectsData, setSubjectsData] = useState<{
    subjects: SubjectItem[];
    compulsory_selective_status: "not_selected" | "selected";
    compulsory_selective: SubjectItem[];
    selective_status: "not_selected" | "selected";
    selective: SubjectItem[];
  } | null>(null);

  const [selectedCompulsory, setSelectedCompulsory] = useState<number | null>(
    null,
  );
  const [selectedElectives, setSelectedElectives] = useState<number[]>([]);

  const isJSS = classLevel.startsWith("JSS");
  const requiredElectives = getSelectiveRequirement(classLevel);
  const { user } = useAuthStore();

  const fetchSubjects = useCallback(async () => {
    try {
      let data;

      if (token) {
        // Use direct API call with token
        data = await getSubjects(token);
      } else {
        // Use internal API route
        const response = await fetch("/api/subjects", {
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            formatApiErrorMessage(result, "Failed to fetch subjects"),
          );
        }
        data = result.content;
      }

      setSubjectsData(data);

      // Pre-select compulsory selective if already selected
      // Only preselect if backend supplies a dedicated field for chosen IDs
      // The compulsory_selective array contains available options, not selected items
      // We should only preselect if there's a dedicated selected field
      // For now, initialize as empty - actual selections should come from a dedicated endpoint
      setSelectedCompulsory(null);
      setSelectedElectives([]);

      // TODO: If backend provides a dedicated field for selected IDs, use it here
      // Example: if (data.selected_compulsory_id) setSelectedCompulsory(data.selected_compulsory_id);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch subjects");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    // Refetch subjects when user's class changes
    if (user?.class !== classLevel) {
      fetchSubjects();
    }
  }, [user?.class, classLevel, fetchSubjects]);

  const handleSubmitCompulsory = async () => {
    if (!selectedCompulsory) {
      toast.error("Please select a religious study subject");
      return;
    }

    setIsSubmitting(true);
    try {
      if (token) {
        await updateCompulsorySelective(token, selectedCompulsory);
      } else {
        const response = await fetch(
          "/api/subjects/update-compulsory-selective",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ subject: selectedCompulsory }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            formatApiErrorMessage(error, "Failed to update compulsory subject"),
          );
        }
      }

      toast.success("Core subject saved!");
      // Refresh auth store and subjects
      useAuthStore.getState().hydrate();
      await fetchSubjects(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || "Failed to update compulsory subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitElectives = async () => {
    if (selectedElectives.length !== requiredElectives) {
      toast.error(
        `Please select exactly ${requiredElectives} elective subjects`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (token) {
        await updateSelectiveSubjects(token, selectedElectives);
      } else {
        // Use JSON format for internal route (consistent with API route)
        const response = await fetch("/api/subjects/update-selective", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ subjects: selectedElectives }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            formatApiErrorMessage(error, "Failed to update elective subjects"),
          );
        }
      }

      toast.success("All subjects registered successfully!");
      // Refresh auth store to get latest subject selections
      await useAuthStore.getState().hydrate();
      // Refresh subjects data
      await fetchSubjects();
      router.push("/dashboard/subjects");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update elective subjects");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleElective = (id: number) => {
    setSelectedElectives((prev) => {
      if (prev.includes(id)) {
        return prev.filter((sid) => sid !== id);
      } else if (prev.length < requiredElectives) {
        return [...prev, id];
      }
      return prev;
    });
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="size-8 animate-spin" />
          <span className="ml-2">Loading subjects...</span>
        </div>
      </Card>
    );
  }

  if (!subjectsData) return null;

  const compulsoryComplete =
    subjectsData.compulsory_selective_status === "selected";
  const showElectives = compulsoryComplete;

  return (
    <div className="space-y-6">
      {/* Compulsory Selective Section */}
      <Card>
        <CardHeader className="responsive-padding pb-2 sm:pb-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-lg font-bold sm:text-xl">
                Core Subject (Religious Studies)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Select ONE religious study subject
              </CardDescription>
            </div>
            {compulsoryComplete && (
              <Badge
                variant="default"
                className="self-start bg-green-600 sm:self-center"
              >
                <CheckCircle2 className="mr-1.5 size-3.5 sm:size-4" />
                Complete
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="responsive-padding space-y-4">
          <div className="grid gap-3">
            {subjectsData.compulsory_selective.map((subject) => (
              <button
                key={subject.id}
                onClick={() =>
                  !compulsoryComplete && setSelectedCompulsory(subject.id)
                }
                disabled={compulsoryComplete}
                className={cn(
                  "group rounded-lg border-2 p-3.5 text-left transition-all active:scale-[0.98] sm:p-4",
                  selectedCompulsory === subject.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50",
                  compulsoryComplete && "cursor-not-allowed opacity-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl transition-transform group-hover:scale-110 sm:text-3xl">
                      {getSubjectIcon(subject.name)}
                    </span>
                    <span className="text-sm font-bold sm:text-base">
                      {subject.name}
                    </span>
                  </div>
                  {selectedCompulsory === subject.id && (
                    <CheckCircle2 className="size-5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {!compulsoryComplete && (
            <Button
              onClick={handleSubmitCompulsory}
              disabled={!selectedCompulsory || isSubmitting}
              className="mobile-touch-target w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Core Subject"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Elective Subjects Section */}
      {showElectives && (
        <Card>
          <CardHeader className="responsive-padding pb-2 sm:pb-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="text-lg font-bold sm:text-xl">
                  Elective Subjects
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Select {requiredElectives} subjects from the list
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="self-start px-3 py-1 text-base font-bold sm:self-center sm:px-4 sm:text-lg"
              >
                {selectedElectives.length}/{requiredElectives}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="responsive-padding space-y-4">
            <Progress
              value={(selectedElectives.length / requiredElectives) * 100}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {subjectsData.selective.map((subject) => {
                const isSelected = selectedElectives.includes(subject.id);
                const isDisabled =
                  !isSelected && selectedElectives.length >= requiredElectives;

                return (
                  <button
                    key={subject.id}
                    onClick={() => !isDisabled && toggleElective(subject.id)}
                    disabled={isDisabled}
                    className={cn(
                      "group rounded-lg border-2 p-3.5 text-left transition-all active:scale-[0.98] sm:p-4",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : isDisabled
                          ? "cursor-not-allowed border-border opacity-50"
                          : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl transition-transform group-hover:scale-110 sm:text-3xl">
                          {getSubjectIcon(subject.name)}
                        </span>
                        <span className="text-sm font-bold sm:text-base">
                          {subject.name}
                        </span>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="size-5 text-primary" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={handleSubmitElectives}
              disabled={
                selectedElectives.length !== requiredElectives || isSubmitting
              }
              size="default"
              className="mobile-touch-target w-full font-bold shadow-lg sm:h-12"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-5" />
                  Complete Registration ({selectedElectives.length}/
                  {requiredElectives})
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
