"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  XCircle,
} from "lucide-react";

import type { Exercise } from "@/lib/types/lessons";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/utils/media";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { AudioPlayer } from "./AudioPlayer";

interface ExerciseModalProps {
  exercise: Exercise;
  index: number;
}

export function ExerciseModal({ exercise, index }: ExerciseModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const options = useMemo(() => exercise.answers || [], [exercise.answers]);
  const correctAnswer = exercise.correct_answer?.trim();
  const isCorrectSelection =
    selectedAnswer !== null &&
    correctAnswer !== undefined &&
    selectedAnswer === correctAnswer;
  const shouldShowSolution =
    isCorrectSelection && Boolean(exercise.solution_steps?.length);

  useEffect(() => {
    if (!open) {
      setSelectedAnswer(null);
    }
  }, [open]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const getAnswerState = (answer: string) => {
    if (!selectedAnswer) return "idle";
    if (correctAnswer && answer === correctAnswer) return "correct";
    if (selectedAnswer === answer) return "incorrect";
    return "idle";
  };

  const answerClassNames = (answer: string) =>
    cn(
      "w-full rounded-lg border px-4 py-3.5 text-left text-sm shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] sm:py-3 sm:text-base",
      {
        "border-green-500/60 bg-green-50 text-green-900 font-semibold":
          getAnswerState(answer) === "correct",
        "border-destructive/60 bg-destructive/5 text-destructive font-medium":
          getAnswerState(answer) === "incorrect",
        "hover:border-primary/60 hover:bg-primary/5 hover:shadow-md":
          getAnswerState(answer) === "idle",
      },
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Card className="border-dashed bg-muted/30 transition-colors hover:bg-muted/50">
        <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Practice {index + 1}
              </p>
              <p className="text-sm font-medium sm:text-base">
                {exercise.title || "Practice Exercise"}
              </p>
            </div>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-9 shrink-0 px-4 font-semibold"
              >
                Go
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            </DialogTrigger>
          </div>

          {exercise.problem && (
            <p className="text-sm text-muted-foreground">{exercise.problem}</p>
          )}

          {resolveMediaUrl(exercise.image_path) && (
            <div className="my-2">
              <Image
                src={resolveMediaUrl(exercise.image_path) ?? ""}
                alt={exercise.title || "Exercise illustration"}
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
        </CardContent>
      </Card>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="size-5 text-primary" />
            {exercise.title || `Exercise ${index + 1}`}
          </DialogTitle>
          {exercise.problem && (
            <DialogDescription className="text-base leading-relaxed text-foreground">
              {exercise.problem}
            </DialogDescription>
          )}
        </DialogHeader>

        {resolveMediaUrl(exercise.image_path) && (
          <div className="my-2">
            <Image
              src={resolveMediaUrl(exercise.image_path) ?? ""}
              alt={exercise.title || "Exercise illustration"}
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

        <div className="space-y-4">
          {options.length > 0 ? (
            options.map((answer, optionIndex) => (
              <button
                type="button"
                key={`${answer}-${optionIndex}`}
                className={answerClassNames(answer)}
                onClick={() => handleAnswerSelect(answer)}
              >
                {answer}
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No answer options provided for this exercise.
            </p>
          )}

          {selectedAnswer && !isCorrectSelection && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <XCircle className="size-4" />
              Not quite. Try another option to reveal the solution.
            </div>
          )}

          {selectedAnswer && correctAnswer && (
            <div className="rounded-md border border-muted px-3 py-2 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle2
                  className={cn("size-4", {
                    "text-green-600": isCorrectSelection,
                    "text-muted-foreground": !isCorrectSelection,
                  })}
                />
                Correct answer:{" "}
                <span
                  className={cn({
                    "text-green-700": isCorrectSelection,
                    "text-muted-foreground": !isCorrectSelection,
                  })}
                >
                  {correctAnswer}
                </span>
              </p>
            </div>
          )}

          {shouldShowSolution && (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Lightbulb className="size-4 text-primary" />
                Solution Steps
              </div>
              <ol className="ml-4 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                {exercise.solution_steps?.map((step, idx) => (
                  <li key={`${step}-${idx}`}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
