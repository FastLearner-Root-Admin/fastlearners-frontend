import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, CheckCircle2, Clock, RotateCcw, X } from "lucide-react";

import { useLessonsStore } from "@/lib/store/lessons";
import { Exercise, GeneralExercise } from "@/lib/types/lessons";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/utils/media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { useInView } from "framer-motion"; // Removed to fix infinite loop
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { AudioPlayer } from "./AudioPlayer";

interface ExerciseCardProps {
  exercise: Exercise | GeneralExercise;
  index: number;
  onAnswer?: (exerciseId: number, answer: string) => Promise<any>;
}

export function ExerciseCard({ exercise, index, onAnswer }: ExerciseCardProps) {
  const exerciseProgress = useLessonsStore((state) => state.exerciseProgress);
  const selectedLesson = useLessonsStore((state) => state.selectedLesson);
  const currentStepIndex = useLessonsStore((state) => state.currentStepIndex);
  const startSectionTimer = useLessonsStore((state) => state.startSectionTimer);
  const endSectionTimer = useLessonsStore((state) => state.endSectionTimer);
  const updateAnalytics = useLessonsStore((state) => state.updateAnalytics);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const attemptCount = exerciseProgress[exercise.id]?.attempts || 0;
  const canShowSolution = attemptCount >= 4;
  const attemptsRemaining = Math.max(0, 4 - attemptCount);

  const [showSolutionDetails, setShowSolutionDetails] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  const [retryCount, setRetryCount] = useState(0);
  const [startTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastResult, setLastResult] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sectionTimerStartedRef = useRef(false);

  // Check if exercise is already completed
  const exerciseData = exerciseProgress[exercise.id];
  const isAlreadyCompleted = !!(
    exerciseData?.isCompleted && exerciseData?.isCorrect
  );
  const attempts = exerciseData?.attempts || 0;
  const isFirstTry = attempts === 1 && isCorrect;

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(
        Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
      );
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime]);

  // Online status
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Start section timer when exercise is first viewed
  useEffect(() => {
    if (selectedLesson && !sectionTimerStartedRef.current) {
      const conceptsCount = selectedLesson.concepts?.length || 0;
      let sectionId = "";

      if (currentStepIndex <= conceptsCount && currentStepIndex > 0) {
        const conceptIndex = currentStepIndex - 1;
        const concept = selectedLesson.concepts?.[conceptIndex];
        if (concept) sectionId = `concept_${concept.id}`;
      } else if (currentStepIndex === conceptsCount + 2) {
        sectionId = "general_exercises";
      }

      if (sectionId) {
        startSectionTimer(sectionId);
        sectionTimerStartedRef.current = true;
      }
    }

    return () => {
      if (selectedLesson && sectionTimerStartedRef.current) {
        const conceptsCount = selectedLesson.concepts?.length || 0;
        let sectionId = "";

        if (currentStepIndex <= conceptsCount && currentStepIndex > 0) {
          const conceptIndex = currentStepIndex - 1;
          const concept = selectedLesson.concepts?.[conceptIndex];
          if (concept) sectionId = `concept_${concept.id}`;
        } else if (currentStepIndex === conceptsCount + 2) {
          sectionId = "general_exercises";
        }

        if (sectionId) {
          endSectionTimer(sectionId);
        }
      }
    };
  }, [selectedLesson, currentStepIndex, startSectionTimer, endSectionTimer]);

  // Helper function to convert index to letter code
  const getOptionKey = (index: number): string => {
    return String.fromCharCode(65 + index); // 'A', 'B', 'C', 'D', etc.
  };

  // Helper function to convert letter code to index
  const getOptionIndex = (key: string): number => {
    return key.charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1, etc.
  };

  // Helper function to get answer text from option key
  const getAnswerText = (key: string): string => {
    const index = getOptionIndex(key);
    return exercise.answers[index] || "";
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return; // Only when not focused on inputs
      const num = parseInt(e.key);
      if (num >= 1 && num <= exercise.answers.length) {
        setSelectedOptionKey(getOptionKey(num - 1));
      } else if (
        e.key === "Enter" &&
        selectedOptionKey &&
        !isRevealed &&
        !isSubmitting
      ) {
        handleSubmit();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptionKey, isRevealed, isSubmitting, exercise.answers]);

  // Auto-populate if already answered correctly
  useEffect(() => {
    if (isAlreadyCompleted && exerciseData?.userAnswer) {
      // userAnswer should be a letter code ('A', 'B', 'C', 'D')
      // If it's already a letter code, use it directly
      // If it's the full text (legacy), convert it to a letter code
      let answerKey = exerciseData.userAnswer;
      if (answerKey.length > 1) {
        // It's full text, find the index and convert to letter code
        const index = exercise.answers.findIndex((a) => a === answerKey);
        if (index >= 0) {
          answerKey = getOptionKey(index);
        }
      }
      setSelectedOptionKey(answerKey);
      setIsRevealed(true);
      setIsCorrect(true);
      setFeedbackMessage("Already answered correctly!");

      // Initialize lastResult with score data if available in exerciseData
      // Derive a result object from cached/stored data to display scores
      if (exerciseData.cachedResponse) {
        // If there's a cached response, use it
        setLastResult(exerciseData.cachedResponse);
      } else {
        // Otherwise, create a minimal result object from available data
        const derivedResult = {
          success: true,
          message: "Already answered correctly!",
          isCorrect: true,
          content: exerciseData.scoreData || null, // Use scoreData if available
          code: 200,
        };
        setLastResult(derivedResult);
      }
    }
  }, [isAlreadyCompleted, exerciseData, exercise.answers]);

  // Shake animation
  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  // Success animation
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async () => {
    if (!onAnswer) return;
    if (!isOnline) {
      setFeedbackMessage(
        "You are offline. Answer will be submitted when online.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Send the option letter (A, B, C, D) as the backend expects
      // The backend expects A, B, C, or D
      if (!selectedOptionKey) {
        setFeedbackMessage("Please select an answer before submitting.");
        setIsSubmitting(false);
        return;
      }

      // Validate exercise ID
      if (!exercise.id || typeof exercise.id !== "number") {
        console.error("[ExerciseCard] Invalid exercise ID:", exercise.id);
        setFeedbackMessage(
          "Error: Invalid exercise ID. Please refresh the page.",
        );
        setIsSubmitting(false);
        return;
      }

      // Debug logging
      if (process.env.NODE_ENV === "development") {
        console.log("[ExerciseCard] Submitting answer:", {
          exerciseId: exercise.id,
          answer: selectedOptionKey,
          answerType: typeof selectedOptionKey,
        });
      }

      let result;
      if (isAlreadyCompleted) {
        // Local evaluation without recording score
        const selectedAnswerText = getAnswerText(selectedOptionKey);
        const correct = selectedAnswerText === exercise.correct_answer;
        result = {
          success: true,
          message: correct
            ? "Correct! (Practice Attempt)"
            : "Incorrect. Try again (Practice Attempt).",
          isCorrect: correct,
          code: correct ? 200 : 400,
          content: null,
        };
        await new Promise((resolve) => setTimeout(resolve, 300)); // simulate delay
      } else {
        result = await onAnswer(exercise.id, selectedOptionKey);
      }
      setLastResult(result); // Store result
      setIsRevealed(true);

      if (result && typeof result === "object") {
        // Determine if answer is correct
        const isAnswerCorrect =
          result.isCorrect === true ||
          result.success === true ||
          (result.code === 200 &&
            result.message?.toLowerCase().includes("already answered"));

        setIsCorrect(isAnswerCorrect);

        let message = result.message;
        const code = result.code;

        // Handle different response codes
        if (code === 200 || (code === 400 && isAnswerCorrect)) {
          // Success or "already answered" case
          if (isAnswerCorrect) {
            message = message || "Correct!";
            setSuccess(true);
          } else {
            message = message || "Incorrect. Try again.";
            setShake(true);
          }
        } else if (code === 400) {
          // Wrong answer case
          if (result.isCorrect) {
            message = message || "Correct!";
            setSuccess(true);
          } else {
            message = message || "Incorrect. Try again.";
            setShake(true);
          }
        } else if (code === 422) {
          // Show detailed validation errors if available
          if (result.errors) {
            const errorMessages = Object.entries(result.errors)
              .flatMap(([field, errors]) =>
                Array.isArray(errors)
                  ? errors.map((err) => `${field}: ${err}`)
                  : [`${field}: ${errors}`],
              )
              .join(", ");
            message = errorMessages || message;
          }
          message = `Validation Error: ${message}`;
        } else if (code >= 500) {
          message = "We could not check your answer. Please try again.";
          setRetryCount((prev) => prev + 1);
        }

        setFeedbackMessage(message);

        // Update analytics after answer submission
        if (selectedLesson) {
          updateAnalytics(selectedLesson.id);
        }
      } else {
        // Fallback: compare selected answer text with correct answer
        const selectedAnswerText = getAnswerText(selectedOptionKey);
        const correct = selectedAnswerText === exercise.correct_answer;
        setIsCorrect(correct);
        setFeedbackMessage(correct ? "Correct!" : "Incorrect. Try again.");
        if (correct) setSuccess(true);
        else setShake(true);

        // Update analytics after answer submission
        if (selectedLesson) {
          updateAnalytics(selectedLesson.id);
        }
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setFeedbackMessage("An error occurred. Please try again.");
      setRetryCount((prev) => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    handleSubmit();
  };

  const handleTryAgain = () => {
    setShowConfirmDialog(true);
  };

  const confirmTryAgain = () => {
    setIsRevealed(false);
    setShowSolutionDetails(false);
    setSelectedOptionKey("");
    setFeedbackMessage("");
    setShowConfirmDialog(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card
      className={cn(
        "border-blue-200 bg-blue-50 dark:border-blue-800/30 dark:bg-blue-900/10",
        success && "animate-pulse",
      )}
    >
      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-100 sm:text-base">
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] sm:text-xs"
            >
              Q{index + 1}
            </Badge>
            Exercise Content
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {isFirstTry && (
              <Badge variant="secondary" className="text-xs">
                First Try!
              </Badge>
            )}
            {attempts > 0 && (
              <Badge variant="outline" className="text-xs">
                Attempts: {attempts}
              </Badge>
            )}
            <div className="flex items-center text-xs text-slate-500">
              <Clock className="mr-1 size-3" />
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-white p-3 shadow-sm dark:bg-slate-950 sm:p-4">
          <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200 sm:text-base">
            {exercise.problem}
          </p>
        </div>

        {resolveMediaUrl(exercise.image_path) && (
          <div className="my-2">
            <Image
              src={resolveMediaUrl(exercise.image_path) ?? ""}
              alt={
                ("title" in exercise ? exercise.title : null) ||
                "Exercise illustration"
              }
              width={800}
              height={450}
              className="h-auto w-full max-w-full rounded-lg object-contain"
              style={{ width: "100%", height: "auto" }}
              unoptimized
            />
          </div>
        )}
        {exercise.audio_path && (
          <AudioPlayer
            src={exercise.audio_path}
            title="Pronunciation / Audio"
            className="my-3 border-2"
          />
        )}

        <RadioGroup
          value={selectedOptionKey}
          onValueChange={setSelectedOptionKey}
          disabled={isRevealed || isSubmitting}
          className="space-y-2"
          aria-label={`Options for exercise ${index + 1}`}
        >
          {exercise.answers.map((answer, i) => {
            const optionKey = getOptionKey(i);
            const isSelected = selectedOptionKey === optionKey;
            const isCorrectAnswer = answer === exercise.correct_answer;
            return (
              <div
                key={i}
                className={cn(
                  "flex min-h-12 items-center space-x-3 rounded-md border p-3.5 transition-all duration-300 sm:p-3",
                  !isRevealed && isSelected
                    ? "scale-[1.02] border-blue-500 bg-blue-50 shadow-sm dark:border-blue-400 dark:bg-blue-900/20"
                    : !isRevealed
                      ? "border-transparent bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
                      : "",
                  // For selected answer: use API response (isCorrect state)
                  isRevealed && isSelected && isCorrect
                    ? "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20"
                    : isRevealed && isSelected && !isCorrect
                      ? "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20"
                      : isRevealed && !isSelected && isCorrectAnswer
                        ? "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20"
                        : isRevealed && !isSelected
                          ? "border-transparent bg-white dark:bg-slate-950"
                          : "",
                  shake && isSelected && "animate-shake",
                )}
                title={
                  isRevealed
                    ? isCorrectAnswer
                      ? "Correct answer"
                      : "Incorrect answer"
                    : ""
                }
              >
                <RadioGroupItem
                  value={optionKey}
                  id={`ex-${exercise.id}-opt-${i}`}
                />
                <Label
                  htmlFor={`ex-${exercise.id}-opt-${i}`}
                  className="min-w-0 flex-1 cursor-pointer break-words py-1 text-sm sm:text-base"
                >
                  {answer}
                </Label>
                {isRevealed && isSelected && isCorrect && (
                  <CheckCircle2 className="size-4 text-green-600" />
                )}
                {isRevealed && isSelected && !isCorrect && (
                  <X className="size-4 text-red-600" />
                )}
                {isRevealed && !isSelected && isCorrectAnswer && (
                  <CheckCircle2 className="size-4 text-green-600" />
                )}
              </div>
            );
          })}
        </RadioGroup>

        <div className="pt-2">
          {!isRevealed ? (
            <Button
              onClick={handleSubmit}
              disabled={!selectedOptionKey || isSubmitting || !isOnline}
              className="mt-3 h-11 w-full bg-blue-600 font-semibold hover:bg-blue-700 sm:h-10 sm:w-auto"
              size="default"
              aria-label="Submit your answer"
            >
              {isSubmitting ? "Checking..." : "Submit Answer"}
            </Button>
          ) : (
            <div
              className={cn(
                "rounded-md p-4",
                isCorrect
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
              )}
              aria-live="polite"
              aria-describedby={`feedback-${exercise.id}`}
            >
              <p className="font-bold" id={`feedback-${exercise.id}`}>
                {isCorrect ? "✅ Correct!" : "❌ Incorrect"}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {feedbackMessage || (isCorrect ? "Great job!" : "Try again!")}
              </p>
              {/* Display score information if available */}
              {isCorrect && lastResult?.content && (
                <div className="mt-3 space-y-1 text-sm">
                  {lastResult.content.score && (
                    <p className="font-medium">
                      Score: {lastResult.content.score}% on{" "}
                      {lastResult.content.attempt} attempt
                    </p>
                  )}
                  {lastResult.content.concept_total_score &&
                    lastResult.content.concept_weight && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Concept Total: {lastResult.content.concept_total_score}/
                        {lastResult.content.concept_weight}
                      </p>
                    )}
                  {lastResult.content.general_exercise_total_score &&
                    lastResult.content.general_exercise_weight && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Exercise Total:{" "}
                        {lastResult.content.general_exercise_total_score}/
                        {lastResult.content.general_exercise_weight}
                      </p>
                    )}
                </div>
              )}
              {!isOnline && (
                <p className="text-sm text-orange-600">
                  <AlertTriangle className="mr-1 inline size-4" />
                  Offline mode
                </p>
              )}
              {retryCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="mt-2"
                >
                  <RotateCcw className="mr-1 size-4" /> Retry ({retryCount})
                </Button>
              )}
              {isCorrect && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTryAgain}
                    className="h-9 border-green-300 text-xs font-medium text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/50 sm:h-8"
                  >
                    <RotateCcw className="mr-2 size-3" />
                    Reattempt Question
                  </Button>
                </div>
              )}
              {!isCorrect && (
                <div className="mt-3 space-y-2">
                  {!canShowSolution ? (
                    <div className="flex flex-col gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          attemptsRemaining === 1
                            ? "flex items-center text-amber-600 dark:text-amber-500"
                            : "text-slate-600 dark:text-slate-400",
                        )}
                      >
                        {attemptsRemaining === 1 && (
                          <AlertTriangle className="mr-1.5 size-4" />
                        )}
                        {attemptsRemaining === 1
                          ? "Complete 4 attempts before viewing solution"
                          : `${attemptsRemaining} more attempt${attemptsRemaining !== 1 ? "s" : ""} before the solution is revealed`}
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleTryAgain}
                          className="h-10 bg-blue-600 text-xs font-medium hover:bg-blue-700 sm:h-8"
                          aria-label="Try again"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        The correct answer is:{" "}
                        <strong>{exercise.correct_answer}</strong>
                      </p>
                      {exercise.solution_steps &&
                        exercise.solution_steps.length > 0 && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowSolutionDetails(!showSolutionDetails)
                              }
                              className="h-8 text-xs"
                            >
                              {showSolutionDetails ? "Hide" : "Show"} Solution
                              Steps
                            </Button>
                            {showSolutionDetails && (
                              <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                {exercise.solution_steps.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ol>
                            )}
                          </div>
                        )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleTryAgain}
                        className="mt-2 h-8 bg-blue-600 text-xs hover:bg-blue-700"
                        aria-label="Try again"
                      >
                        Try Again
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 max-w-sm rounded-md bg-white p-4 dark:bg-slate-800">
              <p className="mb-4 text-sm">
                {isAlreadyCompleted
                  ? "Are you sure you want to try again? This will just be for practice and won't affect your previously recorded score."
                  : "Are you sure you want to try again? This will clear your current selection."}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={confirmTryAgain}>
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
