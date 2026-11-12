import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import { selectConceptScore, useLessonsStore } from "@/lib/store/lessons";
import { Concept, ConceptDescription } from "@/lib/types/lessons";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/utils/media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DismissibleCard } from "@/components/ui/dismissible-card";

import { AudioPlayer } from "../AudioPlayer";
import { ExerciseCard } from "../ExerciseCard";
import { LessonImageViewer } from "../LessonImageViewer";
import { StyledDescriptionText, StyledText } from "../StyledText";

interface LessonConceptProps {
  concept: Concept;
  onAnswerExercise?: (exerciseId: number, answer: string) => Promise<any>;
}

interface ExampleCardProps {
  example: any;
  index: number;
}

// Memoized ExampleCard
const ExampleCard = React.memo(
  function ExampleCard({ example, index }: ExampleCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
      <motion.div layout>
        <Card
          className="cursor-pointer border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-emerald-50/30 to-background shadow-md transition-shadow hover:shadow-lg dark:border-emerald-800/30 dark:from-emerald-900/20 dark:via-emerald-900/10 dark:to-background"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <Sparkles className="size-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-lg text-emerald-900 dark:text-emerald-100">
                  Example {index + 1}
                </CardTitle>
              </div>
              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {isFlipped ? "Tap for Problem" : "Tap for Solution"}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {!isFlipped ? (
                <motion.div
                  key="front"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="rounded-lg border-2 bg-background p-4 shadow-sm">
                    <p className="font-semibold text-foreground">
                      <StyledText text={example.problem} />
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 py-3 pl-4 pr-2 dark:bg-emerald-900/10"
                >
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                    Solution:
                  </p>
                  {example.solution_steps &&
                  example.solution_steps.length > 0 ? (
                    <ol className="ml-2 space-y-2">
                      {example.solution_steps.map((step: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-foreground"
                        >
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                            {i + 1}
                          </span>
                          <span>
                            <StyledText text={step} />
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      No solution steps provided
                    </p>
                  )}
                  <div className="mt-3 rounded-lg bg-emerald-200 px-4 py-3 dark:bg-emerald-800/50">
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                      <span className="mr-2">✓</span>Answer:{" "}
                      <StyledText text={example.answer} />
                    </p>
                  </div>
                  {resolveMediaUrl(example.image_path) && (
                    <LessonImageViewer
                      src={resolveMediaUrl(example.image_path) ?? ""}
                      alt={example.title || "Example illustration"}
                    />
                  )}
                  {example.audio_path && (
                    <AudioPlayer
                      src={example.audio_path}
                      title="Pronunciation / Audio"
                      className="my-3 border-2"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  },
  (prev, next) =>
    prev.example.id === next.example.id && prev.index === next.index,
);
ExampleCard.displayName = "ExampleCard";

const ScoreSummary = React.memo(function ScoreSummary({
  conceptScore,
}: {
  conceptScore: { total_score: string; weight: string };
}) {
  const score = parseFloat(conceptScore.total_score);
  const maxScore = parseFloat(conceptScore.weight);
  const percentage = (score / maxScore) * 100;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Section Progress</p>
            <p className="text-sm text-muted-foreground">
              You scored {score.toFixed(1)} / {maxScore} points
            </p>
          </div>
        </div>
        <Badge
          variant={percentage >= 70 ? "default" : "secondary"}
          className="text-lg font-bold"
        >
          {Math.round(percentage)}%
        </Badge>
      </CardContent>
    </Card>
  );
});
ScoreSummary.displayName = "ScoreSummary";

export const LessonConcept = React.memo(function LessonConcept({
  concept,
  onAnswerExercise,
}: LessonConceptProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleExamplesCount, setVisibleExamplesCount] = useState(2);

  // Optimization: specific selector to avoid object identity issues and infinite loops
  const fetchConceptScore = useLessonsStore((state) => state.fetchConceptScore);
  const conceptScore = useLessonsStore(
    (state) => state.conceptScores[concept.id],
  );
  const isLoadingScore = useLessonsStore(
    (state) => state.isLoadingConceptScore[concept.id],
  );

  const memoizedExamples = useMemo(
    () => concept?.examples || [],
    [concept?.examples],
  );

  // Windowed rendering (legacy lazy load) for lists
  const visibleExamples = useMemo(
    () => memoizedExamples.slice(0, visibleExamplesCount),
    [memoizedExamples, visibleExamplesCount],
  );

  const handleShowMore = useCallback(() => {
    setVisibleExamplesCount((prev) =>
      Math.min(prev + 5, memoizedExamples.length),
    );
  }, [memoizedExamples.length]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Fetch score on mount
  useEffect(() => {
    fetchConceptScore(concept.id);
  }, [concept.id, fetchConceptScore]);

  // Passage and Figure Caption grouping logic
  const renderItems = useMemo(() => {
    const descItems = concept.description || [];
    const items: Array<
      | {
          type: "passage";
          header: ConceptDescription;
          passageTitle?: string;
          body: ConceptDescription;
          extraMedia?: ConceptDescription;
        }
      | { type: "caption"; item: ConceptDescription }
      | { type: "normal"; item: ConceptDescription }
    > = [];

    let idx = 0;
    while (idx < descItems.length) {
      const item = descItems[idx];
      const isPassage = /^Passage\s+\d+/i.test(item.heading ?? "");
      const isFigureCaption =
        /^Figure\s+\d+:/i.test(item.heading ?? "") &&
        (!item.description || item.description.trim() === "");

      if (isPassage) {
        const obj1 = item;
        const obj2 = idx + 1 < descItems.length ? descItems[idx + 1] : null;
        const obj3 = idx + 2 < descItems.length ? descItems[idx + 2] : null;

        // Rule 2: If the 2nd object has a heading, but does not have description,
        // then include the 3rd object (the 3rd object will not have a heading and holds the body).
        const obj2HasHeadingNoDesc =
          Boolean(obj2?.heading?.trim()) &&
          (!obj2?.description || obj2.description.trim() === "");

        if (obj2 && obj2HasHeadingNoDesc && obj3) {
          items.push({
            type: "passage",
            header: obj1,
            passageTitle: obj2.heading ?? undefined,
            body: obj3,
            extraMedia: obj2,
          });
          idx += 3;
        } else if (obj2) {
          // Rule 3: If 2nd object has both heading and description (or description),
          // there is no need for the 3rd object in the card.
          items.push({
            type: "passage",
            header: obj1,
            passageTitle: obj2.heading ?? undefined,
            body: obj2,
          });
          idx += 2;
        } else {
          items.push({
            type: "passage",
            header: obj1,
            body: obj1,
          });
          idx += 1;
        }
      } else if (isFigureCaption) {
        items.push({ type: "caption", item });
        idx += 1;
      } else {
        items.push({ type: "normal", item });
        idx += 1;
      }
    }
    return items;
  }, [concept.description]);

  return (
    <div className="flex h-full min-w-0 flex-col gap-6 overflow-y-auto overflow-x-hidden p-1">
      <DismissibleCard
        id="lesson_concept_intro"
        title="How to complete this concept"
        icon={
          <Lightbulb className="size-5 text-yellow-600 dark:text-yellow-400" />
        }
        content={
          <ul className="list-disc space-y-1 pl-5">
            <li>Read through the explanation and study the examples.</li>
            <li>Complete all concept exercises below.</li>
            <li>Your score will be recorded to test your understanding.</li>
          </ul>
        }
        className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/50 dark:bg-yellow-900/20"
      />
      <Card className="border-2 shadow-lg">
        <CardHeader
          className={cn(
            "cursor-pointer transition-colors",
            isExpanded
              ? "bg-gradient-to-r from-primary/10 via-primary/5 to-background"
              : "bg-muted/50 hover:bg-muted/80",
          )}
          onClick={toggleExpanded}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <Lightbulb className="size-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <CardTitle className="break-words text-xl text-foreground sm:text-2xl">
                  {concept.title}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {concept.examples.length > 0 &&
                    `${concept.examples.length} example${concept.examples.length > 1 ? "s" : ""}`}
                  {concept.examples.length > 0 &&
                    concept.exercises.length > 0 &&
                    " • "}
                  {concept.exercises.length > 0 &&
                    `${concept.exercises.length} exercise${concept.exercises.length > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="size-10 p-0">
              {isExpanded ? (
                <ChevronUp className="size-5" />
              ) : (
                <ChevronDown className="size-5" />
              )}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-8 p-4 sm:p-6">
            {/* Description / Content Section */}
            <div className="space-y-6">
              {renderItems.map((entry, i) => {
                if (entry.type === "passage") {
                  const { header, passageTitle, body, extraMedia } = entry;
                  const imagePath = body.image_path || extraMedia?.image_path;
                  const audioPath = body.audio_path || extraMedia?.audio_path;

                  const displayTitle =
                    passageTitle &&
                    header.heading &&
                    !header.heading
                      .toLowerCase()
                      .includes(passageTitle.toLowerCase())
                      ? `${header.heading}: ${passageTitle}`
                      : header.heading || passageTitle || "Passage";

                  return (
                    <div
                      key={i}
                      className="space-y-4 rounded-xl border-2 border-amber-300 bg-amber-50/60 p-5 dark:border-amber-700/40 dark:bg-amber-900/15"
                    >
                      {/* Passage N — main header */}
                      <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200">
                        <StyledText text={displayTitle} />
                      </h3>

                      {/* Short intro text — italics (from 1st object description) */}
                      {header.description && (
                        <p className="text-sm italic text-amber-800 dark:text-amber-300">
                          <StyledText text={header.description} />
                        </p>
                      )}

                      {/* Passage body — italic */}
                      {body.description && (
                        <div className="whitespace-pre-line text-base italic leading-relaxed text-foreground sm:text-lg">
                          <StyledText text={body.description} />
                        </div>
                      )}

                      {/* Images for the passage */}
                      {resolveMediaUrl(imagePath) && (
                        <LessonImageViewer
                          src={resolveMediaUrl(imagePath) ?? ""}
                          alt={displayTitle || "Passage illustration"}
                        />
                      )}

                      {/* Audio for the passage */}
                      {audioPath && (
                        <AudioPlayer
                          src={audioPath}
                          title="Pronunciation / Audio"
                          className="my-3 border-2"
                        />
                      )}
                    </div>
                  );
                }

                if (entry.type === "caption") {
                  const prevEntry = renderItems[i - 1];
                  const prevHadImage =
                    prevEntry?.type === "normal" &&
                    Boolean(resolveMediaUrl(prevEntry.item.image_path));
                  // If preceded by a normal item with an image, it was rendered inline under the image
                  if (prevHadImage) return null;

                  return (
                    <p
                      key={i}
                      className="my-2.5 text-center text-sm font-semibold italic text-foreground/85 dark:text-slate-200 sm:text-base"
                    >
                      <StyledText text={entry.item.heading ?? ""} />
                    </p>
                  );
                }

                // Normal item
                const desc = entry.item;
                const nextEntry = renderItems[i + 1];
                const hasInlineCaption =
                  Boolean(resolveMediaUrl(desc.image_path)) &&
                  nextEntry?.type === "caption";

                return (
                  <div key={i} className="space-y-3">
                    {desc.heading && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-5 text-primary" />
                        <h4 className="text-xl font-bold text-foreground">
                          <StyledText text={desc.heading} />
                        </h4>
                      </div>
                    )}
                    {desc.description && (
                      <StyledDescriptionText text={desc.description} />
                    )}
                    {resolveMediaUrl(desc.image_path) && (
                      <LessonImageViewer
                        src={resolveMediaUrl(desc.image_path) ?? ""}
                        alt={desc.heading || "Concept illustration"}
                        caption={
                          hasInlineCaption ? nextEntry.item.heading : undefined
                        }
                      />
                    )}
                    {desc.audio_path && (
                      <AudioPlayer
                        src={desc.audio_path}
                        title="Pronunciation / Audio"
                        className="my-3 border-2"
                      />
                    )}
                    {desc.points && desc.points.length > 0 && (
                      <ul className="ml-6 space-y-2">
                        {desc.points.map((point, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-2 text-sm text-foreground"
                          >
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span>
                              {typeof point === "string" ? (
                                <StyledText text={point} />
                              ) : (
                                JSON.stringify(point)
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Examples (Windowed) */}
            {concept.examples.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-emerald-600" />
                  <h4 className="text-xl font-bold text-foreground">
                    Examples
                  </h4>
                  <Badge variant="secondary" className="ml-2">
                    {concept.examples.length}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {visibleExamples.map((example, index) => (
                    <ExampleCard
                      key={example.id || index}
                      example={example}
                      index={index}
                    />
                  ))}
                </div>

                {visibleExamplesCount < memoizedExamples.length && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={handleShowMore}
                      className="w-full sm:w-auto"
                    >
                      Show More Examples (
                      {memoizedExamples.length - visibleExamplesCount}{" "}
                      remaining)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Exercises */}
            {concept.exercises.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <CheckCircle2 className="size-4 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold text-foreground">
                    Concept Exercises
                  </h4>
                </div>
                <div className="space-y-4">
                  {concept.exercises.map((exercise, index) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      index={index}
                      onAnswer={onAnswerExercise}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {conceptScore && concept.exercises.length > 0 && (
              <ScoreSummary conceptScore={conceptScore} />
            )}

            {isLoadingScore && concept.exercises.length > 0 && (
              <Card className="border-2 border-muted bg-muted/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="size-12 animate-pulse rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
});
