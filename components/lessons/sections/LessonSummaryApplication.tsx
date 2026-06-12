import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle,
  ChevronRight,
  Download,
  FileText,
  Lightbulb,
  Share2,
  Sparkles,
  Star,
  Target,
} from "lucide-react";

import { useLessonsStore } from "@/lib/store/lessons";
import { LessonContent } from "@/lib/types/lessons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface LessonSummaryApplicationProps {
  lesson: LessonContent;
}

export function LessonSummaryApplication({
  lesson,
}: LessonSummaryApplicationProps) {
  const progress = useLessonsStore((state) => state.progress);
  const nextStep = useLessonsStore((state) => state.nextStep);
  const currentStepIndex = useLessonsStore((state) => state.currentStepIndex);
  const selectedLesson = useLessonsStore((state) => state.selectedLesson);
  const startSectionTimer = useLessonsStore((state) => state.startSectionTimer);
  const endSectionTimer = useLessonsStore((state) => state.endSectionTimer);
  const addUserNote = useLessonsStore((state) => state.addUserNote);
  const updateAnalytics = useLessonsStore((state) => state.updateAnalytics);
  const [reflectionNotes, setReflectionNotes] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [confidenceLevel, setConfidenceLevel] = useState<number>(3);
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Start section timer when component mounts
  useEffect(() => {
    startSectionTimer("summary_application");
    return () => {
      endSectionTimer("summary_application");
    };
  }, [startSectionTimer, endSectionTimer]);

  // Sample quiz questions based on lesson (in real app, this could come from API)
  const quizQuestions = [
    {
      id: 1,
      question: "What is the main concept covered in this lesson?",
      options: [
        "Basic arithmetic",
        lesson.topic || "Topic",
        "Advanced calculus",
        "Geometry",
      ],
      correct: lesson.topic || "Topic",
    },
    {
      id: 2,
      question: "Which of these is a key takeaway?",
      options: [
        "Practice regularly",
        "Skip exercises",
        "Don't apply concepts",
        "Ignore examples",
      ],
      correct: "Practice regularly",
    },
    {
      id: 3,
      question: "How should you apply what you've learned?",
      options: [
        "Only in theory",
        "In real-world scenarios",
        "Never",
        "Only when forced",
      ],
      correct: "In real-world scenarios",
    },
  ];

  const handleDownloadSummary = () => {
    const summaryText = `Lesson Summary: ${lesson.topic}\n\n${lesson.summary}\n\nApplication:\n${lesson.application}`;
    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lesson.topic}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareApplication = async () => {
    if (typeof window === "undefined" || !navigator.clipboard) {
      return;
    }

    const shareText = `I just learned about ${lesson.topic}! Here's how to apply it: ${lesson.application}`;
    try {
      await navigator.clipboard.writeText(shareText);
      // In real app, could integrate with social sharing APIs
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleReflectionNotesChange = (value: string) => {
    setReflectionNotes(value);
    if (value.trim()) {
      addUserNote("summary_application", value);
    }
  };

  const handleQuizSubmit = () => {
    setShowQuizResults(true);
    // Update analytics after quiz submission
    updateAnalytics(lesson.id);
  };

  const getQuizScore = () => {
    let correct = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correct) correct++;
    });
    return correct;
  };

  const getRecommendations = () => {
    if (confidenceLevel >= 4)
      return "Great confidence! Try advanced exercises.";
    if (confidenceLevel >= 2)
      return "Good! Review key concepts and practice more.";
    return "Consider revisiting the concepts before moving on.";
  };

  const handleReviewConcept = (conceptIndex: number) => {
    // Assuming concepts are at indices 1 to N
    useLessonsStore.setState({ currentStepIndex: conceptIndex + 1 });
  };

  const practicalSteps = [
    "Identify a real-world problem related to this topic",
    "Apply the concepts you've learned to solve it",
    "Reflect on the outcome and what you learned",
    "Share your solution with others",
    "Practice regularly to reinforce understanding",
  ];

  return (
    <div className="flex h-full min-w-0 flex-col gap-6 overflow-y-auto overflow-x-hidden p-1">
      {/* Progress Indicator */}
      <Card className="border-2 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Lesson Progress</h3>
              <p className="text-sm text-muted-foreground">
                You&apos;re almost done!
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{progress}%</div>
              <Progress value={progress} className="w-full sm:w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary and Application */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Summary Card */}
        <Card className="h-full border-2 bg-gradient-to-br from-blue-50/50 via-background to-background shadow-lg dark:from-blue-950/20 dark:via-background dark:to-background">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <FileText className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">Summary</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Key takeaways from this lesson
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-base leading-relaxed text-foreground">
                {lesson.summary}
              </p>
              {/* Key Takeaways as bullets */}
              <ul className="mt-4 list-inside list-disc space-y-1">
                <li>Understand the core concepts presented</li>
                <li>Practice applying them in different scenarios</li>
                <li>Review examples to reinforce learning</li>
                <li>Complete exercises to test comprehension</li>
              </ul>
            </div>
            {/* Download Button */}
            <Button
              onClick={handleDownloadSummary}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 size-4" />
              Download Summary
            </Button>
            {/* Mind Map Placeholder */}
            <div className="mt-4 rounded-lg border-2 border-dashed p-4 text-center">
              <Brain className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Mind Map Visualization
              </p>
              {/* In real app, integrate a mind map library */}
            </div>
          </CardContent>
        </Card>

        {/* Application Card */}
        <Card className="h-full border-2 bg-gradient-to-br from-purple-50/50 via-background to-background shadow-lg dark:from-purple-950/20 dark:via-background dark:to-background">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Lightbulb className="size-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  Application
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  How to apply what you&apos;ve learned
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base leading-relaxed text-foreground">
              {lesson.application}
            </p>
            {/* Real-world Examples */}
            <div>
              <h4 className="flex items-center gap-2 font-semibold">
                <Sparkles className="size-4" />
                Real-World Examples
              </h4>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>Applying concepts in daily problem-solving</li>
                <li>Using learned skills in professional settings</li>
                <li>Teaching others what you&apos;ve mastered</li>
              </ul>
            </div>
            {/* Practical Steps Checklist */}
            <div>
              <h4 className="flex items-center gap-2 font-semibold">
                <CheckCircle className="size-4" />
                Practical Steps
              </h4>
              <ul className="mt-2 space-y-2">
                {practicalSteps.map((step, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Try It Yourself */}
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-semibold">Try It Yourself</h4>
              <p className="mt-1 text-sm">
                Apply the concept to a problem you encounter today.
              </p>
              <Textarea
                placeholder="Describe how you'll apply this concept..."
                className="mt-2"
                value={reflectionNotes}
                onChange={(e) => handleReflectionNotesChange(e.target.value)}
              />
            </div>
            {/* Share Feature */}
            <Button
              onClick={handleShareApplication}
              variant="outline"
              className="w-full"
            >
              <Share2 className="mr-2 size-4" />
              Share Your Application
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Yourself */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5" />
            Quiz Yourself
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test your understanding with these quick questions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {quizQuestions.map((q) => (
            <div key={q.id}>
              <Label className="font-medium">{q.question}</Label>
              <RadioGroup
                value={quizAnswers[q.id] || ""}
                onValueChange={(value) =>
                  setQuizAnswers({ ...quizAnswers, [q.id]: value })
                }
                className="mt-2"
              >
                {q.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                    <Label htmlFor={`${q.id}-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
          <Button onClick={handleQuizSubmit} className="w-full">
            Submit Quiz
          </Button>
          {showQuizResults && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="font-semibold">
                Your Score: {getQuizScore()}/{quizQuestions.length}
              </p>
              <p className="mt-1 text-sm">
                Great effort! Keep practicing to improve.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confidence Meter and Recommendations */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="size-5" />
            Self-Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>
              How confident are you in understanding this topic? (1-5)
            </Label>
            <RadioGroup
              value={confidenceLevel.toString()}
              onValueChange={(value) => setConfidenceLevel(parseInt(value))}
              className="mt-2 flex gap-4"
            >
              {[1, 2, 3, 4, 5].map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={level.toString()}
                    id={`confidence-${level}`}
                  />
                  <Label htmlFor={`confidence-${level}`}>{level}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="font-semibold">Recommendation:</p>
            <p className="mt-1 text-sm">{getRecommendations()}</p>
          </div>
          {/* Review Concepts */}
          <div>
            <Label className="font-semibold">Review Concepts:</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {lesson.concepts?.map((concept, index) => (
                <Button
                  key={concept.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleReviewConcept(index)}
                >
                  {concept.title}
                  <ChevronRight className="ml-1 size-3" />
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-2 bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-950/20 dark:to-red-950/20">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Next Steps</h3>
              <p className="text-sm text-muted-foreground">
                Continue your learning journey
              </p>
            </div>
            <Button
              onClick={() => nextStep()}
              className="bg-primary hover:bg-primary/90"
            >
              Continue to Exercises
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
          <div className="mt-4">
            <p className="text-sm">Suggested next lessons:</p>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary">Advanced Topics</Badge>
              <Badge variant="secondary">Practice Problems</Badge>
              <Badge variant="secondary">Related Subjects</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
