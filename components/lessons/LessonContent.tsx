"use client";

import Image from "next/image";
import { BookOpen, CheckCircle, PlayCircle, Target } from "lucide-react";

import type { LessonContent as LessonContentType } from "@/lib/types/lessons";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/utils/media";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AudioPlayer } from "@/components/lessons/AudioPlayer";
import { ExerciseModal } from "@/components/lessons/ExerciseModal";
import { YouTubeEmbed } from "@/components/lessons/YouTubeEmbed";

interface LessonContentProps {
  content: LessonContentType;
  onMarkComplete?: () => void;
  isCompleted?: boolean;
}

export const getKeyConceptAnchorId = (label: string) => {
  const normalized = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `key-concept-${normalized || "item"}`;
};

export function LessonContent({
  content,
  onMarkComplete,
  isCompleted = false,
}: LessonContentProps) {
  const completionPercentage = content.check_markers
    ? Math.round(
        (content.check_markers.filter((m: any) => m.completed).length /
          content.check_markers.length) *
          100,
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="responsive-padding">
          <div className="flex items-center justify-between">
            <div className="max-w-[150px] flex-1 space-y-1.5 sm:max-w-none">
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                Lesson Progress
              </p>
              <Progress
                value={completionPercentage}
                className="h-1.5 w-full sm:h-2 sm:w-48"
              />
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold leading-none text-primary sm:text-xl">
                {completionPercentage}%
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                Complete
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Player */}
      {content.video_path && (
        <Card className="overflow-hidden border-2">
          <CardContent className="p-0">
            <YouTubeEmbed
              src={content.video_path}
              title={content.topic ?? content.title}
            />
          </CardContent>
        </Card>
      )}

      {/* Audio Player */}
      {content.audio_path && (
        <AudioPlayer
          src={content.audio_path}
          title="Pronunciation / Audio"
          className="border-2"
        />
      )}

      {/* Overview */}
      {content.overview && (
        <Card className="border-2">
          <CardHeader className="responsive-padding pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BookOpen className="size-4 text-primary sm:size-5" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="responsive-padding pt-0 sm:pt-0">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {content.overview}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Objectives */}
      {content.objectives && content.objectives.length > 0 && (
        <Card className="border-2">
          <CardHeader className="responsive-padding pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Target className="size-4 text-primary sm:size-5" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="responsive-padding pt-0 sm:pt-0">
            <div className="space-y-4">
              {content.objectives.map((objective, index) => (
                <div key={index} className="space-y-2">
                  {objective.description && (
                    <p className="text-muted-foreground">
                      {objective.description}
                    </p>
                  )}
                  {objective.points &&
                    Array.isArray(objective.points) &&
                    objective.points.length > 0 && (
                      <ul className="ml-component-sm space-y-2.5 sm:ml-component-md">
                        {objective.points.map((point, pointIndex) => (
                          <li
                            key={pointIndex}
                            className="flex items-start gap-2.5"
                          >
                            <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-emerald-600 sm:size-4" />
                            <span className="text-xs leading-snug text-muted-foreground sm:text-sm">
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Concepts */}
      {content.key_concepts && Object.keys(content.key_concepts).length > 0 && (
        <Card className="border-2">
          <CardHeader className="responsive-padding pb-2 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl">Key Concepts</CardTitle>
          </CardHeader>
          <CardContent className="responsive-padding pt-0 sm:pt-0">
            <div className="space-y-3">
              {Object.entries(content.key_concepts).map(([key, value]) => (
                <div
                  key={key}
                  id={getKeyConceptAnchorId(key)}
                  className="scroll-mt-32 space-y-1 rounded-lg border border-transparent p-2 transition-all"
                >
                  <h4 className="font-medium">{key}</h4>
                  <p className="text-sm text-muted-foreground">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Concepts */}
      {content.concepts && content.concepts.length > 0 && (
        <div className="space-y-6">
          {content.concepts.map((concept) => (
            <Card className="border-2">
              <CardHeader className="responsive-padding pb-2 sm:pb-3">
                <CardTitle className="text-lg font-bold transition-colors group-hover:text-primary sm:text-xl">
                  {concept.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="responsive-padding space-y-4 pt-0 sm:space-y-6 sm:pt-0">
                {/* Description - array of ConceptDescription objects */}
                {concept.description &&
                  Array.isArray(concept.description) &&
                  concept.description.length > 0 && (
                    <div className="space-y-4">
                      {concept.description.map((desc, index) => (
                        <div key={index} className="space-y-2">
                          {desc.heading && (
                            <h4 className="text-lg font-semibold">
                              {desc.heading}
                            </h4>
                          )}
                          {desc.description && (
                            <p className="leading-relaxed text-muted-foreground">
                              {desc.description}
                            </p>
                          )}
                          {resolveMediaUrl(desc.image_path) && (
                            <div className="my-2">
                              <Image
                                src={resolveMediaUrl(desc.image_path) ?? ""}
                                alt={desc.heading || "Concept illustration"}
                                width={800}
                                height={450}
                                className="h-auto w-full max-w-full rounded-lg object-contain"
                                style={{ width: "100%", height: "auto" }}
                                unoptimized
                              />
                            </div>
                          )}
                          {desc.audio_path && (
                            <AudioPlayer
                              src={desc.audio_path}
                              title="Pronunciation / Audio"
                              className="my-3 border-2"
                            />
                          )}
                          {desc.points &&
                            Array.isArray(desc.points) &&
                            desc.points.length > 0 && (
                              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                                {desc.points.map((point, pointIndex) => (
                                  <li key={pointIndex}>{point}</li>
                                ))}
                              </ul>
                            )}
                        </div>
                      ))}
                    </div>
                  )}

                {/* Examples */}
                {concept.examples && concept.examples.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Examples</h4>
                    {concept.examples.map((example, index) => (
                      <div
                        key={example.id || index}
                        className="responsive-padding space-y-2 rounded-lg border bg-muted/50"
                      >
                        {example.title && (
                          <h5 className="font-medium">{example.title}</h5>
                        )}
                        {example.problem && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Problem:</strong> {example.problem}
                          </p>
                        )}
                        {example.solution_steps &&
                          example.solution_steps.length > 0 && (
                            <div className="space-y-1">
                              <strong className="text-sm">
                                Solution Steps:
                              </strong>
                              <ol className="ml-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                                {example.solution_steps.map(
                                  (step, stepIndex) => (
                                    <li key={stepIndex}>{step}</li>
                                  ),
                                )}
                              </ol>
                            </div>
                          )}
                        {example.answer && (
                          <p className="text-sm">
                            <strong>Answer:</strong>{" "}
                            <span className="text-primary">
                              {example.answer}
                            </span>
                          </p>
                        )}
                        {resolveMediaUrl(example.image_path) && (
                          <div className="my-2">
                            <Image
                              src={resolveMediaUrl(example.image_path) ?? ""}
                              alt={example.title || "Example illustration"}
                              width={800}
                              height={450}
                              className="h-auto w-full max-w-full rounded-lg object-contain"
                              style={{ width: "100%", height: "auto" }}
                              unoptimized
                            />
                          </div>
                        )}
                        {example.audio_path && (
                          <AudioPlayer
                            src={example.audio_path}
                            title="Pronunciation / Audio"
                            className="my-3 border-2"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Exercises */}
                {concept.exercises && concept.exercises.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Exercises</h4>
                    <div className="space-y-2">
                      {concept.exercises.map((exercise, index) => (
                        <ExerciseModal
                          key={exercise.id || index}
                          exercise={exercise}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mark Complete Button */}
      {onMarkComplete && (
        <Card className="border-2 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="text-center sm:text-left">
                <h3 className="mb-1 text-lg font-bold">
                  {isCompleted ? "Lesson Completed!" : "Ready for next step?"}
                </h3>
                <p className="max-w-sm text-xs text-muted-foreground sm:text-sm">
                  {isCompleted
                    ? "Great job! You've successfully finished this section."
                    : "Mark this as complete to move on to the next part of the lesson."}
                </p>
              </div>
              <Button
                size="lg"
                onClick={onMarkComplete}
                disabled={isCompleted}
                variant={isCompleted ? "outline" : "default"}
                className={cn(
                  "w-full min-w-[160px] font-semibold transition-all sm:w-auto",
                  !isCompleted && "shadow-lg hover:shadow-primary/20",
                )}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle className="mr-2 size-4 text-emerald-600" />
                    Completed
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 size-4" />
                    Mark as Complete
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
