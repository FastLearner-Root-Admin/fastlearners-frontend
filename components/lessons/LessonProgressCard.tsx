import React from "react";
import { Clock, Eye, EyeOff, Target, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface LessonProgressCardProps {
  progress: number;
  lessonScore: string | null;
  currentStepIndex: number;
  totalSteps: number;
  estimatedTimeRemaining: number | null;
  progressCardCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const LessonProgressCard = React.memo(
  function LessonProgressCard({
    progress,
    lessonScore,
    currentStepIndex,
    totalSteps,
    estimatedTimeRemaining,
    progressCardCollapsed,
    onToggleCollapse,
  }: LessonProgressCardProps) {
    if (progress <= 0) return null;

    return (
      <Card
        className={cn(
          "w-full border-2 bg-gradient-to-r from-primary/5 via-primary/10 to-background transition-all duration-300 sm:max-w-sm",
          progress >= 100 &&
            "border-green-200 bg-gradient-to-r from-green-50 via-green-100 to-background",
          progressCardCollapsed && "hidden",
        )}
      >
        <CardContent className="responsive-padding">
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="responsive-gap flex flex-col items-start justify-between sm:flex-row sm:items-center">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/20 transition-colors sm:size-10">
                  {progress >= 100 ? (
                    <Trophy className="size-4 text-green-600 sm:size-5" />
                  ) : (
                    <Target className="size-4 text-primary sm:size-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Lesson Progress
                  </p>
                  <p className="text-xl font-bold text-foreground sm:text-2xl">
                    {progress}%
                  </p>
                  {lessonScore && (
                    <p className="text-xs text-muted-foreground">
                      Total Score: {lessonScore}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {estimatedTimeRemaining && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    <Clock className="mr-1 size-3" />~{estimatedTimeRemaining}
                    min left
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className="text-[10px] font-medium sm:text-xs"
                >
                  {currentStepIndex + 1} of {totalSteps} sections
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className="size-8 p-0 lg:hidden"
                  aria-label={
                    progressCardCollapsed ? "Show progress" : "Hide progress"
                  }
                >
                  {progressCardCollapsed ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <div className="relative">
              <Progress
                value={progress}
                className={cn(
                  "h-3 transition-all duration-500 will-change-transform",
                  progress >= 100 && "bg-green-100",
                )}
              />
              {progress >= 100 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-sm font-bold text-green-600 duration-300 animate-in zoom-in">
                    🎉 Complete!
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
  (prev, next) => {
    return (
      prev.progress === next.progress &&
      prev.lessonScore === next.lessonScore &&
      prev.currentStepIndex === next.currentStepIndex &&
      prev.totalSteps === next.totalSteps &&
      prev.estimatedTimeRemaining === next.estimatedTimeRemaining &&
      prev.progressCardCollapsed === next.progressCardCollapsed
    );
  },
);
