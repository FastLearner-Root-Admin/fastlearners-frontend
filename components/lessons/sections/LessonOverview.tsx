import { useCallback, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Lightbulb,
  Play,
  Printer,
  SkipForward,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { useLessonsStore } from "@/lib/store/lessons";
import { LessonContent } from "@/lib/types/lessons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { YouTubeEmbed } from "@/components/lessons/YouTubeEmbed";

interface LessonOverviewProps {
  lesson: LessonContent;
  onStartLesson?: () => void;
  onResumeLesson?: () => void;
}

export function LessonOverview({
  lesson,
  onStartLesson,
  onResumeLesson,
}: LessonOverviewProps) {
  const [expandedObjectives, setExpandedObjectives] = useState<Set<number>>(
    new Set(),
  );
  const [checkedObjectives, setCheckedObjectives] = useState<Set<number>>(
    new Set(),
  );

  const lessonMetadata = useLessonsStore((state) => state.lessonMetadata);
  const currentStepIndex = useLessonsStore((state) => state.currentStepIndex);
  const progress = useLessonsStore((state) => state.progress);
  const nextStep = useLessonsStore((state) => state.nextStep);
  const lessonMeta = lessonMetadata[lesson.id];

  const objectives = useMemo(
    () => lesson.objectives || [],
    [lesson.objectives],
  );
  const key_concepts = useMemo(
    () => lesson.key_concepts || {},
    [lesson.key_concepts],
  );

  // Memoize computed values to prevent recalculation on every render
  const estimatedDuration = useMemo(
    () => Math.max(15, (lesson.concepts?.length || 0) * 10 + 20), // 10 min per concept + 20 min for overview/summary
    [lesson.concepts?.length],
  );

  // Memoize lesson start status
  const hasStarted = useMemo(
    () => !!(lessonMeta && lessonMeta.lastAccessedAt),
    [lessonMeta],
  );

  const completionPercentage = useMemo(
    () => lessonMeta?.overallProgress || 0,
    [lessonMeta?.overallProgress],
  );

  const toggleObjectiveExpansion = (index: number) => {
    const newExpanded = new Set(expandedObjectives);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedObjectives(newExpanded);
  };

  const toggleObjectiveCheck = (index: number) => {
    const newChecked = new Set(checkedObjectives);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedObjectives(newChecked);
  };

  const handleStartLesson = () => {
    if (onStartLesson) {
      onStartLesson();
    } else {
      nextStep();
    }
  };

  const handleResumeLesson = () => {
    if (onResumeLesson) {
      onResumeLesson();
    }
  };

  // Memoized print handler with proper dependencies
  const handlePrintObjectives = useCallback(() => {
    if (typeof window === "undefined") return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const title = lesson.topic || lesson.title;
      printWindow.document.write(`
        <html>
          <head>
            <title>${title} - Learning Objectives</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              .objective { margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; }
              .points { margin-left: 20px; }
            </style>
          </head>
          <body>
            <h1>${title} - Learning Objectives</h1>
            ${objectives
              .map(
                (obj, index) => `
              <div class="objective">
                <h3>Objective ${index + 1}: ${obj.description}</h3>
                ${
                  obj.points.length > 0
                    ? `
                  <ul class="points">
                    ${obj.points.map((point) => `<li>${point}</li>`).join("")}
                  </ul>
                `
                    : ""
                }
              </div>
            `,
              )
              .join("")}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [lesson.topic, lesson.title, objectives]);

  return (
    <div className="flex h-full min-w-0 flex-col gap-6 overflow-y-auto overflow-x-hidden p-1">
      {/* Skip Links for Accessibility */}
      <div className="sr-only">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <a href="#objectives" className="skip-link">
          Skip to learning objectives
        </a>
        <a href="#key-concepts" className="skip-link">
          Skip to key concepts
        </a>
      </div>

      {/* Hero Section */}
      <Card className="border-2 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20">
                <BookOpen className="size-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl" id="main-content">
                  Lesson Overview
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started with this lesson
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                <span>~{estimatedDuration} min</span>
              </div>
              {hasStarted && (
                <Badge variant="secondary" className="text-xs">
                  {completionPercentage}% Complete
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg leading-relaxed text-foreground">
            {lesson.overview}
          </p>

          {/* Progress Context */}
          {hasStarted && (
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-yellow-600" />
                  <span className="text-sm font-medium">
                    Progress: {completionPercentage}%
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResumeLesson}
                >
                  <SkipForward className="mr-2 size-4" />
                  Resume Lesson
                </Button>
              </div>
              {lessonMeta.lastAccessedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Last accessed:{" "}
                  {new Date(lessonMeta.lastAccessedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Video Introduction */}
          {lesson.video_path && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Play className="size-4 text-primary" />
                <span className="text-sm font-medium">Video Introduction</span>
              </div>
              <YouTubeEmbed
                src={lesson.video_path}
                title={lesson.topic ?? lesson.title}
              />
            </div>
          )}

          {/* Start Lesson Button */}
          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={handleStartLesson} className="px-8">
              {hasStarted ? "Continue Lesson" : "Start Lesson"}
              <Sparkles className="ml-2 size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Preview */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Quick Preview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Topics covered in this lesson
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span className="text-sm">Overview</span>
            </div>
            {lesson.concepts?.map((concept, index) => (
              <div
                key={concept.id}
                className="flex items-center gap-2 rounded-lg bg-muted/50 p-3"
              >
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="text-sm">
                  {concept.title || `Concept ${index + 1}`}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span className="text-sm">Summary & Application</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span className="text-sm">General Exercises</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      {objectives.length > 0 && (
        <Card className="border-2 shadow-lg" id="objectives">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Target className="size-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl">
                    Learning Objectives
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    What you&apos;ll learn in this lesson
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintObjectives}
              >
                <Printer className="mr-2 size-4" />
                Print
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {objectives.map((objective, index) => {
              const isExpanded = expandedObjectives.has(index);
              const isChecked = checkedObjectives.has(index);
              return (
                <div
                  key={index}
                  className="rounded-lg border-2 bg-muted/30 p-5 transition-all hover:border-primary/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-1 items-start gap-3">
                      <Checkbox
                        id={`objective-${index}`}
                        checked={isChecked}
                        onCheckedChange={() => toggleObjectiveCheck(index)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-2">
                          <Badge variant="outline" className="font-medium">
                            Objective {index + 1}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            <span>
                              ~
                              {Math.ceil(estimatedDuration / objectives.length)}{" "}
                              min
                            </span>
                          </div>
                        </div>
                        <p className="mb-3 text-base leading-relaxed text-foreground">
                          {objective.description}
                        </p>
                        {objective.points.length > 0 && (
                          <div className="space-y-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleObjectiveExpansion(index)}
                              className="h-auto p-0 font-normal text-muted-foreground hover:text-foreground"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="mr-1 size-4" />
                                  Hide Key Points
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="mr-1 size-4" />
                                  Show Key Points ({objective.points.length})
                                </>
                              )}
                            </Button>
                            {isExpanded && (
                              <ul className="ml-4 space-y-2">
                                {objective.points.map((point, pointIndex) => (
                                  <li
                                    key={pointIndex}
                                    className="flex items-start gap-2 text-sm text-foreground"
                                  >
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Key Concepts */}
      {Object.keys(key_concepts).length > 0 && (
        <Card className="border-2 shadow-lg" id="key-concepts">
          <CardHeader className="pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <Lightbulb className="size-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  Key Concepts
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Important concepts to understand
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(key_concepts).map(
                ([concept, description], index) => (
                  <TooltipProvider key={concept}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "group relative cursor-pointer rounded-xl border-2 bg-gradient-to-br p-5 transition-all hover:scale-105 hover:border-primary hover:shadow-md",
                            index % 2 === 0
                              ? "from-blue-50/50 to-background dark:from-blue-950/20"
                              : "from-purple-50/50 to-background dark:from-purple-950/20",
                          )}
                        >
                          <div className="mb-3 flex items-center gap-2">
                            <Sparkles className="size-4 text-primary" />
                            <h4 className="font-bold text-foreground">
                              {concept}
                            </h4>
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {description as string}
                          </p>
                          {/* Link to concept section - placeholder for now */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 w-full opacity-100 sm:absolute sm:bottom-2 sm:right-2 sm:mt-0 sm:w-auto sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                            onClick={() => {
                              // TODO: Implement navigation to specific concept section
                              console.log(`Navigate to concept: ${concept}`);
                            }}
                          >
                            View Section
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to learn more about {concept}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
