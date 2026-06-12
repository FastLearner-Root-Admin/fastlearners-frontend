"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

import {
  selectNavigationState,
  selectProgressData,
  useLessonsStore,
} from "@/lib/store/lessons";
import { cn } from "@/lib/utils";
import { useLessonAccessibility } from "@/hooks/use-lesson-accessibility";
import { useLessonAutoAdvance } from "@/hooks/use-lesson-auto-advance";
import { useLessonData } from "@/hooks/use-lesson-data";
import { useLessonGestures } from "@/hooks/use-lesson-gestures";
import { useLessonKeyboard } from "@/hooks/use-lesson-keyboard";
import { useLessonNavigation } from "@/hooks/use-lesson-navigation";
import { AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { LessonNavigationControls } from "./LessonNavigationControls";
import { LessonProgressCard } from "./LessonProgressCard";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { SectionBreadcrumb } from "./SectionBreadcrumb";
import { SectionRenderer } from "./SectionRenderer";

interface LessonViewerProps {
  lessonId?: number;
  subjectSlug?: string;
  topicSlug?: string;
  onBack?: () => void;
  autoLoad?: boolean;
}

export function LessonViewer({
  lessonId,
  subjectSlug,
  topicSlug,
  onBack,
  autoLoad = true,
}: LessonViewerProps) {
  const router = useRouter();

  // Granular State Selectors to prevent unnecessary re-renders
  const currentStepIndex = useLessonsStore((state) => state.currentStepIndex);
  const sectionProgress = useLessonsStore((state) => state.sectionProgress);
  const isLoadingLessonContent = useLessonsStore(
    (state) => state.isLoadingLessonContent,
  );
  const progress = useLessonsStore((state) => state.progress);
  // actions are stable
  const selectedLesson = useLessonsStore((state) => state.selectedLesson);
  const isOffline = useLessonsStore((state) => state.isOffline);

  // Actions (stable references)
  const nextStep = useLessonsStore((state) => state.nextStep);
  const prevStep = useLessonsStore((state) => state.prevStep);
  const checkCurrentStepCompletion = useLessonsStore(
    (state) => state.checkCurrentStepCompletion,
  );
  const submitExerciseAnswer = useLessonsStore(
    (state) => state.submitExerciseAnswer,
  );
  const clearSelectedLesson = useLessonsStore(
    (state) => state.clearSelectedLesson,
  );
  const clearError = useLessonsStore((state) => state.clearError);
  const getNextIncompleteSection = useLessonsStore(
    (state) => state.getNextIncompleteSection,
  );
  const autoAdvanceToNextSection = useLessonsStore(
    (state) => state.autoAdvanceToNextSection,
  );
  const fetchCompletionData = useLessonsStore(
    (state) => state.fetchCompletionData,
  );

  // Performance Monitoring
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      performance.mark("lesson-viewer-mount-start");
    }
    return () => {
      // Cleanup if needed
    };
  }, []);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      performance.mark("lesson-viewer-render-end");
      try {
        performance.measure(
          "lesson-viewer-initial-render",
          "lesson-viewer-mount-start",
          "lesson-viewer-render-end",
        );
      } catch (e) {
        // Ignore errors if marks are missing
      }
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [progressCardCollapsed, setProgressCardCollapsed] = useState(false);

  // Hook 1: Data Management (Loading, Score, Errors)
  const { lessonScore, enhancedError, estimatedTimeRemaining, handleRetry } =
    useLessonData({
      lessonId,
      subjectSlug,
      topicSlug,
      autoLoad,
      selectedLesson,
      progress,
    });

  // Derived state
  const concepts = useMemo(
    () => selectedLesson?.concepts || [],
    [selectedLesson?.concepts],
  );

  // Hook 2: Navigation Logic
  const {
    handleNext,
    handlePrev,
    handleNavigateToSection,
    isRedirecting,
    setCelebrationShown,
  } = useLessonNavigation({
    selectedLesson,
    currentStepIndex,
    sectionProgress,
    concepts,
    checkCurrentStepCompletion,
    nextStep,
    prevStep,
    fetchCompletionData,
  });

  // Hook 3: Auto-Advance Logic
  const { hasAutoAdvanced, setHasAutoAdvanced } = useLessonAutoAdvance({
    selectedLesson,
    isLoadingLessonContent,
    currentStepIndex,
    sectionProgress,
    getNextIncompleteSection,
    autoAdvanceToNextSection,
    setCelebrationShown,
  });

  // Hook 4: Gestures
  const { handleTouchStart, handleTouchMove, handleTouchEnd } =
    useLessonGestures({
      onSwipeLeft: handleNext,
      onSwipeRight: handlePrev,
    });

  // Hook 5: Keyboard Shortcuts
  useLessonKeyboard({
    selectedLesson,
    currentStepIndex,
    maxStepIndex: concepts.length + 2,
    onPrevious: handlePrev,
    onNext: handleNext,
    onNavigateToSection: handleNavigateToSection,
  });

  // Hook 6: Accessibility
  useLessonAccessibility({ progress });

  // UI Handlers
  const handleBack = () => {
    clearSelectedLesson();
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/lessons");
    }
  };

  // Render: Loading State
  if (isLoadingLessonContent) {
    return <LoadingSkeleton />;
  }

  // Render: Error State
  if (enhancedError) {
    const getErrorIcon = () => {
      switch (enhancedError.type) {
        case "network":
          return isOffline ? (
            <WifiOff className="size-6" />
          ) : (
            <Wifi className="size-6" />
          );
        case "not_found":
          return <BookOpen className="size-6" />;
        case "unauthorized":
          return <AlertCircle className="size-6" />;
        default:
          return <AlertCircle className="size-6" />;
      }
    };

    return (
      <Card className="border-2 border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-destructive/10">
            {getErrorIcon()}
          </div>
          <AlertTitle className="mb-2 text-2xl font-bold text-destructive">
            {enhancedError.message}
          </AlertTitle>
          <p className="mb-6 max-w-md text-center text-muted-foreground">
            {enhancedError.details}
          </p>
          <div className="flex gap-3">
            {enhancedError.canRetry && (
              <Button
                variant="outline"
                onClick={handleRetry}
                className="gap-2"
                disabled={isLoadingLessonContent}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    isLoadingLessonContent && "animate-spin",
                  )}
                />
                Try Again
              </Button>
            )}
            <Button variant="outline" onClick={clearError}>
              Dismiss
            </Button>
            {onBack && (
              <Button variant="outline" onClick={handleBack}>
                Go Back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render: No Selection State
  if (!selectedLesson) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-muted">
            <BookOpen className="size-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-foreground">
            No lesson selected
          </h3>
          <p className="mb-6 max-w-md text-center text-muted-foreground">
            Select a lesson from the list to view its content.
          </p>
          {onBack && (
            <Button
              size="lg"
              variant="outline"
              onClick={handleBack}
              aria-label="Go back to lessons list"
            >
              <ArrowLeft className="mr-2 size-4" />
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const lesson = selectedLesson;

  return (
    <div
      className="flex min-w-0 flex-col gap-6 overflow-hidden"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with Breadcrumb and Progress */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionBreadcrumb
          className="w-full min-w-0 sm:flex-1"
          lessonId={lesson.id}
          concepts={concepts}
          currentStepIndex={currentStepIndex}
          onNavigate={(index) => handleNavigateToSection(index)}
        />

        {/* Progress Card Component */}
        <LessonProgressCard
          progress={progress}
          lessonScore={lessonScore}
          estimatedTimeRemaining={estimatedTimeRemaining}
          currentStepIndex={currentStepIndex}
          totalSteps={concepts.length + 3}
          progressCardCollapsed={progressCardCollapsed}
          onToggleCollapse={() =>
            setProgressCardCollapsed(!progressCardCollapsed)
          }
        />
      </div>

      {/* Navigation Tips */}
      <Card className="border-none bg-muted/30 shadow-sm">
        <CardContent className="flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex size-5 items-center justify-center rounded border bg-background font-mono text-[10px]">
              {currentStepIndex + 1}
            </span>
            <span>of {concepts.length + 3} sections</span>
          </div>
          <div className="mt-2 hidden text-center text-[10px] text-muted-foreground sm:block sm:text-xs">
            Use ← → arrow keys or 1-9 number keys to navigate
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="min-h-[400px] min-w-0 flex-1 overflow-hidden rounded-xl sm:min-h-[500px] md:min-h-[600px]">
        <SectionRenderer
          lesson={lesson}
          currentStepIndex={currentStepIndex}
          onAnswerExercise={submitExerciseAnswer}
        />
      </div>

      {/* Enhanced Navigation Controls */}
      <LessonNavigationControls
        currentStepIndex={currentStepIndex}
        totalSteps={concepts.length + 3}
        progress={progress}
        isRedirecting={isRedirecting}
        onPrevious={handlePrev}
        onNext={handleNext}
      />

      {/* Lesson Completion Summary Dialog */}
    </div>
  );
}
