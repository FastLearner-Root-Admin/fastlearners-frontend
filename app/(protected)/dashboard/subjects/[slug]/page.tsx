"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { getSubjectScore, getSubjectsWithSlugs } from "@/lib/api/lessons";
import { trackEvent } from "@/lib/analytics/posthog";
import type { TopicItem, TopicsByTerm } from "@/lib/types/lessons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAcademicContext } from "@/components/providers/academic-context";

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectSlug = params?.slug as string;

  const [subjectName, setSubjectName] = useState<string>("");
  const [topics, setTopics] = useState<TopicsByTerm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectScore, setSubjectScore] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const { currentTermApiId } = useAcademicContext();

  // Fetch subject score when subject_id and term_id are available
  useEffect(() => {
    const fetchSubjectScore = async () => {
      if (!subjectId || !currentTermApiId) return;
      const response = await getSubjectScore(subjectId, currentTermApiId);
      if (response.success && response.content) {
        setSubjectScore(response.content.subject_total_score);
      }
    };

    fetchSubjectScore();
  }, [subjectId, currentTermApiId]);

  // Fetch subject_id from subjects API on mount
  useEffect(() => {
    const fetchSubjectId = async () => {
      if (!subjectSlug) return;

      try {
        const subjectsResponse = await getSubjectsWithSlugs();
        if (subjectsResponse.success && subjectsResponse.content?.subjects) {
          const subject = subjectsResponse.content.subjects.find(
            (s) => s.slug === subjectSlug,
          );
          if (subject) {
            setSubjectId(subject.id);
            trackEvent("subject_opened", {
              subject_id: subject.id,
              subject_name: subject.name,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch subject ID:", error);
      }
    };

    fetchSubjectId();
  }, [subjectSlug]);

  // Check if the parameter is a numeric ID and convert to slug if needed
  useEffect(() => {
    const handleSlugOrId = async () => {
      if (!subjectSlug) {
        setError("Subject identifier is required");
        setIsLoading(false);
        return;
      }

      // Check if it's a numeric ID
      const isNumericId =
        !isNaN(Number(subjectSlug)) && !subjectSlug.includes("-");

      if (isNumericId) {
        // It's a numeric ID, fetch subjects to get the slug
        try {
          const subjectsResponse = await getSubjectsWithSlugs();
          if (subjectsResponse.success && subjectsResponse.content?.subjects) {
            const subject = subjectsResponse.content.subjects.find(
              (s) => s.id === Number(subjectSlug),
            );
            if (subject && subject.slug) {
              // Redirect to the slug route
              router.replace(`/dashboard/subjects/${subject.slug}`);
              return;
            }
          }
          setError("Subject not found");
          setIsLoading(false);
        } catch (error) {
          setError("Failed to look up subject");
          setIsLoading(false);
        }
        return;
      }

      // It's a slug, proceed with fetching topics
      setIsLoading(true);
      setError(null);

      try {
        // Fetch topics from /api/lessons/{subjectSlug}
        const response = await fetch(`/api/lessons/${subjectSlug}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load topics");
          setIsLoading(false);
          return;
        }

        // API returns: { success: true, content: { topics: { first_term: [], second_term: [], third_term: [] } } }
        if (data.success && data.content?.topics) {
          setTopics(data.content.topics);
          // Extract subject name from slug (capitalize and replace hyphens)
          const nameFromSlug = subjectSlug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          setSubjectName(nameFromSlug);
        } else {
          setError(data.message || "No topics found");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load topics";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    handleSlugOrId();
  }, [subjectSlug, router]);

  const handleTopicClick = (topic: TopicItem) => {
    trackEvent("topic_started", {
      topic_id: topic.id,
      topic: topic.topic,
    });
    // Navigate directly to the lesson page
    router.push(`/dashboard/lessons/${subjectSlug}/${topic.slug}`);
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="mx-auto mb-4 size-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading topics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Error Loading Topics</h3>
            <p className="mb-4 text-muted-foreground">{error}</p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 size-4" />
                Go Back
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!topics) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Topics Found</h3>
            <p className="mb-4 text-muted-foreground">
              No topics available for this subject.
            </p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="mr-2 size-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasTopics =
    (topics.first_term && topics.first_term.length > 0) ||
    (topics.second_term && topics.second_term.length > 0) ||
    (topics.third_term && topics.third_term.length > 0);

  if (!hasTopics) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Topics Available</h3>
            <p className="mb-4 text-muted-foreground">
              This subject doesn&apos;t have any topics yet.
            </p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="mr-2 size-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{subjectName}</h1>
          <p className="text-muted-foreground">
            Select a topic to view lessons
            {subjectScore && (
              <span className="ml-2 font-medium text-primary">
                • Total Score: {subjectScore}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Topics Accordion */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Topics</CardTitle>
            <CardDescription>
              Click on a topic to view its lessons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {topics.first_term && topics.first_term.length > 0 && (
                <AccordionItem value="first_term">
                  <AccordionTrigger>
                    First Term ({topics.first_term.length} topics)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {topics.first_term.map((topic: TopicItem) => (
                        <Button
                          key={topic.id}
                          variant="ghost"
                          className="w-full justify-between"
                          onClick={() => handleTopicClick(topic)}
                        >
                          <span className="text-left">
                            <span className="font-medium">
                              Week {topic.week}
                            </span>{" "}
                            - {topic.topic}
                          </span>
                          <ChevronRight className="size-4" />
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {topics.second_term && topics.second_term.length > 0 && (
                <AccordionItem value="second_term">
                  <AccordionTrigger>
                    Second Term ({topics.second_term.length} topics)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {topics.second_term.map((topic: TopicItem) => (
                        <Button
                          key={topic.id}
                          variant="ghost"
                          className="w-full justify-between"
                          onClick={() => handleTopicClick(topic)}
                        >
                          <span className="text-left">
                            <span className="font-medium">
                              Week {topic.week}
                            </span>{" "}
                            - {topic.topic}
                          </span>
                          <ChevronRight className="size-4" />
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {topics.third_term && topics.third_term.length > 0 && (
                <AccordionItem value="third_term">
                  <AccordionTrigger>
                    Third Term ({topics.third_term.length} topics)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {topics.third_term.map((topic: TopicItem) => (
                        <Button
                          key={topic.id}
                          variant="ghost"
                          className="w-full justify-between"
                          onClick={() => handleTopicClick(topic)}
                        >
                          <span className="text-left">
                            <span className="font-medium">
                              Week {topic.week}
                            </span>{" "}
                            - {topic.topic}
                          </span>
                          <ChevronRight className="size-4" />
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation Hint */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Alert>
          <BookOpen className="size-4" />
          <AlertDescription>
            Click on any topic above to view its lessons. You can also navigate
            to{" "}
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={() =>
                router.push(`/dashboard/lessons?subject=${subjectSlug}`)
              }
            >
              the lessons page
            </Button>{" "}
            to browse all topics.
          </AlertDescription>
        </Alert>
      </motion.div>
    </div>
  );
}
