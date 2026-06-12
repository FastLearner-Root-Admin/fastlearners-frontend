import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Lock,
  Sparkles,
} from "lucide-react";

import { useLessonsStore } from "@/lib/store/lessons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HorizontalScroll } from "@/components/shared/horizontal-scroll";

interface SectionBreadcrumbProps {
  lessonId: number;
  concepts: any[];
  currentStepIndex: number;
  onNavigate: (stepIndex: number) => void;
  className?: string;
}

export function SectionBreadcrumb({
  lessonId,
  concepts,
  currentStepIndex,
  onNavigate,
  className,
}: SectionBreadcrumbProps) {
  const sectionProgress = useLessonsStore((state) => state.sectionProgress);

  // Define all sections
  const sections = [
    { id: "overview", title: "Overview", stepIndex: 0, icon: "📚" },
    ...concepts.map((concept, index) => ({
      id: `concept_${concept.id}`,
      title: concept.title || `Concept ${index + 1}`,
      stepIndex: index + 1,
      icon: "💡",
    })),
    {
      id: "summary_application",
      title: "Summary",
      stepIndex: concepts.length + 1,
      icon: "📝",
    },
    {
      id: "general_exercises",
      title: "Practice",
      stepIndex: concepts.length + 2,
      icon: "🎯",
    },
  ];

  return (
    <HorizontalScroll className={cn("block pb-2", className)}>
      <div className="flex min-w-max items-center gap-2">
        {sections.map((section, index) => {
          const progress = sectionProgress[section.id];
          const isCompleted = progress?.isCompleted;
          const isCurrent = section.stepIndex === currentStepIndex;
          const isAccessible = isCompleted || isCurrent || index === 0;

          return (
            <TooltipProvider key={section.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        isAccessible && onNavigate(section.stepIndex)
                      }
                      disabled={!isAccessible}
                      className={cn(
                        "group relative flex items-center gap-1.5 whitespace-nowrap rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
                        isCurrent &&
                          "scale-105 bg-primary text-primary-foreground shadow-lg",
                        isCompleted &&
                          !isCurrent &&
                          "border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40",
                        !isCompleted &&
                          !isCurrent &&
                          isAccessible &&
                          "border-transparent bg-muted text-muted-foreground hover:border-primary/50 hover:bg-muted/80",
                        !isAccessible &&
                          "cursor-not-allowed border-transparent bg-muted/50 text-muted-foreground opacity-50",
                      )}
                    >
                      <span className="text-sm sm:text-base">
                        {section.icon}
                      </span>
                      {isCompleted && (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {isCurrent && !isCompleted && (
                        <Circle className="size-4 fill-primary-foreground" />
                      )}
                      {!isCompleted && !isCurrent && !isAccessible && (
                        <Lock className="size-4" />
                      )}
                      {!isCompleted && !isCurrent && isAccessible && (
                        <Circle className="size-4 opacity-50" />
                      )}
                      <span>{section.title}</span>
                      {isCompleted && progress?.score && (
                        <Badge
                          variant="secondary"
                          className="ml-1 h-5 bg-emerald-200 px-1.5 text-xs font-bold text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100"
                        >
                          {progress.score}%
                        </Badge>
                      )}
                      {isCurrent && (
                        <div className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 animate-pulse rounded-full bg-primary" />
                      )}
                    </button>

                    {index < sections.length - 1 && (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isCompleted
                      ? "Completed - Click to review"
                      : isCurrent
                        ? "Current section"
                        : isAccessible
                          ? "Click to navigate"
                          : "Complete previous sections first"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </HorizontalScroll>
  );
}
