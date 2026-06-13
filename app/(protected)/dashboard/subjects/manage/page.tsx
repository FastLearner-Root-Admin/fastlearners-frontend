"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { getStudentSubjects } from "@/lib/api/subjects";
import type { SubjectsContent } from "@/lib/types/subjects";
import { formatApiErrorMessage } from "@/lib/utils/api-errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ManageSubjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Data state
  const [isLoading, setIsLoading] = useState(true);
  const [subjectsData, setSubjectsData] = useState<SubjectsContent | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedCompulsory, setSelectedCompulsory] = useState<number | null>(
    null,
  );
  const [selectedSelective, setSelectedSelective] = useState<number[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompulsoryConfirm, setShowCompulsoryConfirm] = useState(false);
  const [showSelectiveConfirm, setShowSelectiveConfirm] = useState(false);

  const profileClass = (user?.class ?? "").toUpperCase();
  const requiredSelectiveCount = profileClass.startsWith("JSS") ? 2 : 4;

  // Determine if compulsory selective exists (JSS classes only have this)
  const hasCompulsorySelective =
    subjectsData?.compulsory_selective &&
    subjectsData.compulsory_selective.length > 0;

  // Fetch subjects data
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Initialize selections from fetched data
  useEffect(() => {
    if (subjectsData) {
      // For compulsory selective: find which one is currently selected
      if (
        hasCompulsorySelective &&
        subjectsData.compulsory_selective_status === "selected"
      ) {
        // The selected compulsory subject is the one that appears in both subjects and compulsory_selective
        const selectedId = subjectsData.subjects.find((s) =>
          subjectsData.compulsory_selective.some((cs) => cs.id === s.id),
        )?.id;
        if (selectedId) setSelectedCompulsory(selectedId);
      }

      // For selective: find which ones are currently selected
      if (subjectsData.selective_status === "selected") {
        // Selected selective subjects are those that appear in both subjects and selective
        const selectedIds = subjectsData.subjects
          .filter((s) => subjectsData.selective.some((sel) => sel.id === s.id))
          .map((s) => s.id);
        setSelectedSelective(selectedIds);
      }
    }
  }, [subjectsData, hasCompulsorySelective]);

  const fetchSubjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getStudentSubjects();
      if (response.success && response.content) {
        setSubjectsData(response.content);
      } else {
        setError(response.message || "Failed to fetch subjects");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle compulsory selective selection (radio - single select)
  const handleCompulsorySelect = (id: number) => {
    setSelectedCompulsory(id);
  };

  // Handle selective selection (checkbox - multi select, max 4)
  const handleSelectiveToggle = (id: number) => {
    setSelectedSelective((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selId) => selId !== id);
      }
      if (prev.length >= requiredSelectiveCount) {
        toast.warning(`You can only select ${requiredSelectiveCount} subjects`);
        return prev;
      }
      return [...prev, id];
    });
  };

  // Save compulsory selective
  const handleSaveCompulsory = async () => {
    if (!selectedCompulsory) {
      toast.error("Please select a religious study subject");
      return;
    }

    // Show confirmation if already selected
    if (subjectsData?.compulsory_selective_status === "selected") {
      setShowCompulsoryConfirm(true);
      return;
    }

    await saveCompulsory();
  };

  const saveCompulsory = async () => {
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
          body: JSON.stringify({ subject: selectedCompulsory }),
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

      toast.success("Compulsory selective subject updated successfully!");
      await fetchSubjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to save selection");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save selective subjects
  const handleSaveSelective = async () => {
    if (selectedSelective.length !== requiredSelectiveCount) {
      toast.error(`Please select exactly ${requiredSelectiveCount} subjects`);
      return;
    }

    // Show confirmation if already selected
    if (subjectsData?.selective_status === "selected") {
      setShowSelectiveConfirm(true);
      return;
    }

    await saveSelective();
  };

  const saveSelective = async () => {
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
        body: JSON.stringify({ subjects: selectedSelective }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          formatApiErrorMessage(data, "Failed to update selective subjects"),
        );
      }

      toast.success("Selective subjects updated successfully!");
      await fetchSubjects();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save selection");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !subjectsData) {
    return (
      <div className="container max-w-4xl space-y-6 py-8">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Failed to load subjects. Please try again."}
          </AlertDescription>
        </Alert>
        <Button onClick={fetchSubjects}>
          <RefreshCw className="mr-2 size-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const compulsoryComplete =
    subjectsData.compulsory_selective_status === "selected";
  const selectiveComplete = subjectsData.selective_status === "selected";

  return (
    <div className="container max-w-4xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/subjects")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-semibold">Subject Selection</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchSubjects}
          disabled={isLoading}
          className="ml-auto"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Current Class Display */}
      <div className="text-sm text-muted-foreground">
        Current Class:{" "}
        <span className="font-semibold text-foreground">
          {user?.class || "N/A"}
        </span>
      </div>

      {/* Current Subjects Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Subjects</h2>
        {subjectsData.subjects.length > 0 ? (
          <div className="space-y-2">
            {subjectsData.subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-4"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <span className="font-medium">{subject.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No subjects assigned yet. Complete the selections below.
          </p>
        )}
      </div>

      <Separator />

      {/* Compulsory Selective Section - Only shows if data exists (JSS only) */}
      {hasCompulsorySelective && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Compulsory Selective (Choose 1)
              </h2>
              {compulsoryComplete && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="size-4" />
                  Selected
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Select one religious study subject
            </p>

            <div className="space-y-2">
              {subjectsData.compulsory_selective.map((subject) => {
                const isSelected = selectedCompulsory === subject.id;
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => handleCompulsorySelect(subject.id)}
                    className="flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-sm text-muted-foreground">
                        No description available.
                      </p>
                    </div>
                    <div
                      className={`flex size-6 items-center justify-center rounded border-2 ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="size-4" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={handleSaveCompulsory}
              disabled={!selectedCompulsory || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Submit
                </>
              )}
            </Button>
          </div>

          <Separator />
        </>
      )}

      {/* Selective Subjects Section */}
      {subjectsData.selective && subjectsData.selective.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Selective Subjects (Choose {requiredSelectiveCount})
            </h2>
            {selectiveComplete && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="size-4" />
                Selected
              </span>
            )}
          </div>

          {selectedSelective.length < requiredSelectiveCount && (
            <p className="text-sm text-muted-foreground">
              Select {requiredSelectiveCount - selectedSelective.length} more
              subject
              {requiredSelectiveCount - selectedSelective.length !== 1
                ? "s"
                : ""}
            </p>
          )}

          <div className="space-y-2">
            {subjectsData.selective.map((subject) => {
              const isSelected = selectedSelective.includes(subject.id);
              const isDisabled =
                !isSelected &&
                selectedSelective.length >= requiredSelectiveCount;

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() =>
                    !isDisabled && handleSelectiveToggle(subject.id)
                  }
                  disabled={isDisabled}
                  className={`flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors ${
                    isDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <p className="font-medium">{subject.name}</p>
                    <p className="text-sm text-muted-foreground">
                      No description available.
                    </p>
                  </div>
                  <div
                    className={`flex size-6 items-center justify-center rounded border-2 ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && <Check className="size-4" />}
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleSaveSelective}
            disabled={
              selectedSelective.length !== requiredSelectiveCount ||
              isSubmitting
            }
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 size-4" />
                Submit
              </>
            )}
          </Button>
        </div>
      )}

      {/* Success Summary */}
      {((hasCompulsorySelective && compulsoryComplete && selectiveComplete) ||
        (!hasCompulsorySelective && selectiveComplete)) && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
          <CheckCircle2 className="size-4 text-green-600" />
          <AlertTitle className="text-green-900 dark:text-green-100">
            All Set!
          </AlertTitle>
          <AlertDescription className="text-green-800 dark:text-green-200">
            Your subject selections are complete. You can update them anytime.
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
              Confirm Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change your compulsory selective subject. This
              will update your current selection. Are you sure you want to
              proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveCompulsory}>
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
              Confirm Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to update your selective subjects. This will
                replace your current selections.
              </p>
              {selectedSelective.length > 0 && subjectsData && (
                <div className="mt-3 rounded-lg bg-muted p-3">
                  <p className="mb-2 text-sm font-medium text-foreground">
                    New selections:
                  </p>
                  <ul className="space-y-1">
                    {selectedSelective.map((id) => {
                      const subject = subjectsData.selective.find(
                        (s) => s.id === id,
                      );
                      return subject ? (
                        <li
                          key={id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <Check className="size-3 text-green-600" />
                          {subject.name}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveSelective}>
              Confirm Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
