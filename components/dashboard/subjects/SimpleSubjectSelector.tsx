"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { getStudentSubjects } from "@/lib/api/subjects";
import type { SubjectsContent } from "@/lib/types/subjects";
import { formatApiErrorMessage } from "@/lib/utils/api-errors";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SimpleSubjectSelectorProps {
  initialData?: SubjectsContent | null;
  profileClass?: string | null;
  profileDiscipline?: string | null;
}

export function SimpleSubjectSelector({
  initialData = null,
  profileClass,
  profileDiscipline,
}: SimpleSubjectSelectorProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const derivedClass = (profileClass ?? user?.class ?? "").toUpperCase();
  const isJSS = derivedClass.startsWith("JSS");
  const requiredSelectiveCount = isJSS ? 2 : 4;

  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjectsData, setSubjectsData] = useState<SubjectsContent | null>(
    initialData,
  );
  const [isEditingCompulsory, setIsEditingCompulsory] = useState(
    initialData?.compulsory_selective_status !== "selected",
  );
  const [isEditingSelective, setIsEditingSelective] = useState(
    initialData?.selective_status !== "selected",
  );

  // Selection state
  const [selectedCompulsory, setSelectedCompulsory] = useState<number | null>(
    initialData?.compulsory_selective_status === "selected"
      ? (initialData?.compulsory_selective[0]?.id ?? null)
      : null,
  );
  const [selectedSelective, setSelectedSelective] = useState<number[]>(
    initialData?.selective_status === "selected"
      ? initialData.selective.map((subject) => subject.id)
      : [],
  );

  // Confirmation dialog state
  const [showCompulsoryConfirm, setShowCompulsoryConfirm] = useState(false);
  const [showSelectiveConfirm, setShowSelectiveConfirm] = useState(false);
  const [pendingCompulsoryId, setPendingCompulsoryId] = useState<number | null>(
    null,
  );
  const [pendingSelectiveIds, setPendingSelectiveIds] = useState<number[]>([]);

  useEffect(() => {
    if (initialData) {
      setSubjectsData(initialData);
      setIsLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    fetchSubjects({ silent: !!initialData });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!subjectsData) return;

    if (subjectsData.compulsory_selective_status === "selected") {
      setSelectedCompulsory(subjectsData.compulsory_selective[0]?.id ?? null);
      setIsEditingCompulsory(false);
    } else if (!isEditingCompulsory) {
      // Only reset when we are not in manual edit mode
      setSelectedCompulsory(null);
      setIsEditingCompulsory(true);
    }

    if (subjectsData.selective_status === "selected") {
      setSelectedSelective(subjectsData.selective.map((subject) => subject.id));
      setIsEditingSelective(false);
    } else if (!isEditingSelective) {
      setSelectedSelective([]);
      setIsEditingSelective(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectsData]);

  const fetchSubjects = async ({
    silent = false,
  }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      // Fetch subjects from API endpoint: GET /api/v1/subjects
      // Returns: subjects, compulsory_selective, selective, and their statuses
      const response = await getStudentSubjects();
      if (response.success && response.content) {
        setSubjectsData(response.content);
      } else {
        toast.error(response.message || "Failed to fetch subjects");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load subjects");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const handleCompulsorySelect = (subjectId: number) => {
    if (!isEditingCompulsory) {
      toast.info("Compulsory selective subject has already been selected");
      return;
    }
    setSelectedCompulsory(subjectId);
  };

  const handleSelectiveToggle = (subjectId: number) => {
    if (!isEditingSelective) {
      toast.info("Selective subjects have already been selected");
      return;
    }

    setSelectedSelective((prev) => {
      if (prev.includes(subjectId)) {
        // Deselect
        return prev.filter((id) => id !== subjectId);
      } else {
        // Select (max 4)
        if (prev.length >= requiredSelectiveCount) {
          toast.warning(
            `You can only select ${requiredSelectiveCount} subjects`,
          );
          return prev;
        }
        return [...prev, subjectId];
      }
    });
  };

  const handleSubmitCompulsory = async () => {
    if (!selectedCompulsory) {
      toast.error("Please select a religious study subject");
      return;
    }

    // If already selected, show confirmation dialog
    if (subjectsData?.compulsory_selective_status === "selected") {
      setPendingCompulsoryId(selectedCompulsory);
      setShowCompulsoryConfirm(true);
      return;
    }

    // Otherwise proceed directly
    await confirmCompulsorySubmit(selectedCompulsory);
  };

  const confirmCompulsorySubmit = async (subjectId: number) => {
    setIsSubmitting(true);
    setShowCompulsoryConfirm(false);
    try {
      const response = await fetch(
        "/api/subjects/update-compulsory-selective",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ subject: subjectId }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          formatApiErrorMessage(
            data,
            "Failed to update compulsory selective subject",
          ),
        );
      }

      toast.success("Compulsory selective subject saved successfully!");
      await fetchSubjects(); // Refresh to get updated status
    } catch (error: any) {
      toast.error(error.message || "Failed to save selection");
    } finally {
      setIsSubmitting(false);
      setPendingCompulsoryId(null);
    }
  };

  const handleSubmitSelective = async () => {
    if (selectedSelective.length !== requiredSelectiveCount) {
      toast.error(`Please select exactly ${requiredSelectiveCount} subjects`);
      return;
    }

    // If already selected, show confirmation dialog
    if (subjectsData?.selective_status === "selected") {
      setPendingSelectiveIds(selectedSelective);
      setShowSelectiveConfirm(true);
      return;
    }

    // Otherwise proceed directly
    await confirmSelectiveSubmit(selectedSelective);
  };

  const confirmSelectiveSubmit = async (subjectIds: number[]) => {
    setIsSubmitting(true);
    setShowSelectiveConfirm(false);
    try {
      const response = await fetch("/api/subjects/update-selective", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ subjects: subjectIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          formatApiErrorMessage(data, "Failed to update selective subjects"),
        );
      }

      toast.success("Selective subjects saved successfully!");
      await fetchSubjects(); // Refresh to get updated status
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save selection");
    } finally {
      setIsSubmitting(false);
      setPendingSelectiveIds([]);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="mr-2 size-6 animate-spin text-primary" />
          <span>Loading subjects...</span>
        </CardContent>
      </Card>
    );
  }

  if (!subjectsData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>
          Failed to load subjects. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const compulsoryComplete =
    subjectsData.compulsory_selective_status === "selected";
  const selectiveComplete = subjectsData.selective_status === "selected";
  const assignedSubjects = subjectsData.subjects || [];
  const profileSummary = [derivedClass, profileDiscipline]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="flex flex-col gap-4 bg-muted/30 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              Your Assigned Subjects
            </CardTitle>
            <CardDescription>
              Retrieved directly from your profile
              {profileSummary && ` • ${profileSummary}`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSubjects()}
            disabled={isLoading || isSubmitting}
            className="w-full justify-center md:w-auto"
          >
            <RefreshCw
              className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh data
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {assignedSubjects.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {assignedSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 text-primary/10 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight">
                      {subject.name}
                    </p>
                    <Badge
                      variant="secondary"
                      className="shrink-0 px-1.5 py-0.5 text-[10px]"
                    >
                      ID: {subject.id}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription>
                No subjects were returned for your profile yet. Complete the
                selections below to populate this list.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Compulsory Selective Section - Only for JSS */}
      {isJSS && subjectsData.compulsory_selective.length > 0 && (
        <Card className="border-2 border-amber-200 dark:border-amber-900">
          <CardHeader className="bg-amber-50/50 dark:bg-amber-950/30">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  <Circle
                    className={`size-5 ${compulsoryComplete ? "fill-green-600 text-green-600" : "text-amber-600"}`}
                  />
                  Compulsory Selective Subject
                </CardTitle>
                <CardDescription className="text-amber-800/80 dark:text-amber-200/80">
                  Select one religious study subject for your class
                </CardDescription>
              </div>
              <Badge
                variant={compulsoryComplete ? "default" : "secondary"}
                className={
                  compulsoryComplete
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100"
                }
              >
                {compulsoryComplete ? (
                  <>
                    <CheckCircle2 className="mr-1 size-3" /> Selected
                  </>
                ) : (
                  "Pending"
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingCompulsory ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  {subjectsData.compulsory_selective.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => handleCompulsorySelect(subject.id)}
                      className={`group rounded-lg border-2 p-4 text-left transition-all hover:scale-[1.02] ${
                        selectedCompulsory === subject.id
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border hover:border-primary/50 hover:bg-primary/5"
                      } `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium transition-colors group-hover:text-primary">
                          {subject.name}
                        </span>
                        {selectedCompulsory === subject.id ? (
                          <CheckCircle2 className="size-5 text-primary" />
                        ) : (
                          <Circle className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                  {compulsoryComplete && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditingCompulsory(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmitCompulsory}
                    disabled={!selectedCompulsory || isSubmitting}
                    className="w-full md:w-auto"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Compulsory Selective Subject"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  {subjectsData.compulsory_selective.length > 0 ? (
                    subjectsData.compulsory_selective.map((subject) => (
                      <div
                        key={subject.id}
                        className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/30"
                      >
                        <div className="flex items-center justify-between font-medium">
                          {subject.name}
                          <CheckCircle2 className="size-4 text-green-600" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No compulsory selection has been recorded yet.
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingCompulsory(true)}
                  className="w-full md:w-auto"
                >
                  Change compulsory selective subject
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selective Subjects Section */}
      {subjectsData.selective.length > 0 && (
        <Card className="border-2 border-blue-200 dark:border-blue-900">
          <CardHeader className="bg-blue-50/50 dark:bg-blue-950/30">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Circle
                    className={`size-5 ${selectiveComplete ? "fill-green-600 text-green-600" : "text-blue-600"}`}
                  />
                  Selective Subjects
                </CardTitle>
                <CardDescription className="text-blue-800/80 dark:text-blue-200/80">
                  Select exactly {requiredSelectiveCount} subjects from the list
                  below
                </CardDescription>
              </div>
              <Badge
                variant={selectiveComplete ? "default" : "secondary"}
                className={
                  selectiveComplete
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                }
              >
                {selectiveComplete ? (
                  <>
                    <CheckCircle2 className="mr-1 size-3" /> Selected
                  </>
                ) : (
                  `${selectedSelective.length}/${requiredSelectiveCount} selected`
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingSelective ? (
              <>
                {selectedSelective.length < requiredSelectiveCount && (
                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                      Please select{" "}
                      {requiredSelectiveCount - selectedSelective.length} more
                      subject(s)
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {subjectsData.selective.map((subject) => {
                    const isSelected = selectedSelective.includes(subject.id);
                    const isDisabled =
                      !isSelected &&
                      selectedSelective.length >= requiredSelectiveCount;

                    return (
                      <button
                        key={subject.id}
                        onClick={() => handleSelectiveToggle(subject.id)}
                        disabled={isDisabled}
                        className={`group rounded-lg border-2 p-4 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-md hover:scale-[1.02]"
                            : isDisabled
                              ? "cursor-not-allowed border-border opacity-50"
                              : "border-border hover:scale-[1.02] hover:border-primary/50 hover:bg-primary/5"
                        } `}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-medium transition-colors ${
                              !isDisabled && "group-hover:text-primary"
                            }`}
                          >
                            {subject.name}
                          </span>
                          {isSelected ? (
                            <CheckCircle2 className="size-5 text-primary" />
                          ) : (
                            <Circle
                              className={`size-5 text-muted-foreground transition-colors ${
                                !isDisabled && "group-hover:text-primary"
                              }`}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                  {selectiveComplete && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditingSelective(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmitSelective}
                    disabled={
                      selectedSelective.length !== requiredSelectiveCount ||
                      isSubmitting
                    }
                    className="w-full md:w-auto"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 size-4" />
                        Save Selective Subjects ({selectedSelective.length}/
                        {requiredSelectiveCount})
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {subjectsData.selective.length > 0 ? (
                    subjectsData.selective.map((subject) => (
                      <div
                        key={subject.id}
                        className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/30"
                      >
                        <div className="flex items-center justify-between font-medium">
                          {subject.name}
                          <CheckCircle2 className="size-4 text-green-600" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No selective selections have been recorded yet.
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingSelective(true)}
                  className="w-full md:w-auto"
                >
                  Update selective subjects
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {(compulsoryComplete || selectiveComplete) && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertDescription>
            {compulsoryComplete && selectiveComplete
              ? "All subject selections are complete! You can still update them by using the change buttons above."
              : compulsoryComplete
                ? "Compulsory selective subject is complete. Please select your selective subjects."
                : "Selective subjects are complete. Please select your compulsory selective subject if applicable."}
          </AlertDescription>
        </Alert>
      )}

      {/* Confirmation Dialogs */}
      <AlertDialog
        open={showCompulsoryConfirm}
        onOpenChange={setShowCompulsoryConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              Confirm Subject Change
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <p>
                You are about to{" "}
                <strong>change your compulsory selective subject</strong>. This
                will overwrite your current selection.
              </p>
              <p className="text-sm">
                Are you sure you want to proceed with this change?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowCompulsoryConfirm(false);
                setPendingCompulsoryId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                pendingCompulsoryId &&
                confirmCompulsorySubmit(pendingCompulsoryId)
              }
              className="bg-primary"
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showSelectiveConfirm}
        onOpenChange={setShowSelectiveConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              Confirm Subjects Change
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                You are about to <strong>update your selective subjects</strong>
                . This will replace your current {requiredSelectiveCount}{" "}
                subject selections.
              </p>
              {pendingSelectiveIds.length > 0 && subjectsData && (
                <div className="space-y-2 rounded-lg bg-muted p-3">
                  <p className="text-sm font-semibold text-foreground">
                    New selections:
                  </p>
                  <ul className="space-y-1">
                    {pendingSelectiveIds.map((id) => {
                      const subject = subjectsData.selective.find(
                        (s) => s.id === id,
                      );
                      return subject ? (
                        <li
                          key={id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <CheckCircle2 className="size-3 text-green-600" />
                          {subject.name}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
              <p className="text-sm">
                Are you sure you want to proceed with this change?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowSelectiveConfirm(false);
                setPendingSelectiveIds([]);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                pendingSelectiveIds.length > 0 &&
                confirmSelectiveSubmit(pendingSelectiveIds)
              }
              className="bg-primary"
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
