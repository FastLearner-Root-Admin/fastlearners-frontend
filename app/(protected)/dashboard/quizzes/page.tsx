"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Award,
  Calendar,
  GraduationCap,
  History,
  MapPin,
  Trophy,
  Unlock,
  Users,
} from "lucide-react";

import {
  getQuizCompetitions,
  getQuizDashboard,
} from "@/lib/api/quiz-competition";
import { QuizCompetition, QuizDashboardUser } from "@/lib/types/quiz-competition";
import { getCompetitionStatusBadge } from "@/lib/utils/quiz-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { OverviewGrid } from "@/components/dashboard/OverviewGrid";

export default function QuizCompetitionsPage() {
  const [user, setUser] = useState<QuizDashboardUser | null>(null);
  const [competitions, setCompetitions] = useState<QuizCompetition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [dashboardRes, competitionsRes] = await Promise.all([
          getQuizDashboard(),
          getQuizCompetitions(),
        ]);

        if (dashboardRes.success && dashboardRes.content) {
          setUser(dashboardRes.content.user);
        }

        if (competitionsRes.success && competitionsRes.content) {
          setCompetitions(competitionsRes.content.quiz_competition || []);
        } else if (competitionsRes.code !== 200) {
          setError(
            competitionsRes.message || "Failed to load quiz competitions.",
          );
        }
      } catch (err) {
        setError("An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Trophy className="size-7 text-primary" />
            Quiz Competition
          </h1>
          <p className="mt-2 text-muted-foreground">
            Register for the Fast Learners National Quiz Competition (FLNQC).
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/quizzes/history">
            <History className="mr-2 size-4" />
            My Registrations
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 rounded-lg" />
            ))}
          </div>
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 size-12 text-destructive" />
            <p className="text-lg font-medium text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {user && (
            <OverviewGrid
              title={`Welcome, ${user.name}`}
              description="Your quiz profile at a glance"
              stats={[
                {
                  label: "Class",
                  value: user.class,
                  icon: <GraduationCap className="size-4" />,
                },
                {
                  label: "Location",
                  value: user.location || "Not set",
                  icon: <MapPin className="size-4" />,
                },
                {
                  label: "Sponsor",
                  value: user.sponsor || "Self",
                  icon: <Users className="size-4" />,
                },
                {
                  label: "Open for Registration",
                  value: competitions.filter(
                    (c) => c.status.toLowerCase() === "registration open",
                  ).length,
                  icon: <Unlock className="size-4" />,
                },
              ]}
            />
          )}

          {competitions.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon name="trophy" />
              <EmptyPlaceholder.Title>
                No quiz competitions available right now
              </EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                Check back soon for the next FLNQC.
              </EmptyPlaceholder.Description>
            </EmptyPlaceholder>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {competitions.map((competition) => (
                <Link
                  key={competition.id}
                  href={`/dashboard/quizzes/${competition.id}`}
                  className="block"
                >
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg leading-tight">
                          {competition.title}
                        </CardTitle>
                        {getCompetitionStatusBadge(competition.status)}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {competition.description}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4" />
                        <span>Competition: {competition.competition_date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4" />
                        <span>
                          Registration closes {competition.registration_end_date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="size-4" />
                        <span className="font-mono text-xs">
                          {competition.competition_code}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
