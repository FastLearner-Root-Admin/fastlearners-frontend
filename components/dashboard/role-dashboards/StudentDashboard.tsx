"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Info,
  Loader2,
  Target,
  Trophy,
  Bell,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

import { getMotd } from "@/lib/api/motd";
import { Motd } from "@/lib/types/motd";

import { getDashboard, type DashboardContent } from "@/lib/api/dashboard";
import { getAllSubjectsTotalScores } from "@/lib/api/lessons";
import { getSubscriptionStatusBadge } from "@/lib/utils/subscription-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DismissibleCard } from "@/components/ui/dismissible-card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AchievementsSection } from "@/components/dashboard/AchievementsSection";
import { GlassGreetingCard } from "@/components/dashboard/glass-greeting-card";
import { LeaderBoard } from "@/components/dashboard/LeaderBoard";
import { OverviewGrid } from "@/components/dashboard/OverviewGrid";
import { PerformanceSection } from "@/components/dashboard/PerformanceSection";
import { ProgressDonut } from "@/components/dashboard/ProgressDonut";
import { useAcademicContext } from "@/components/providers/academic-context";



// Animation variants for smooth entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
    },
  },
};

function getDashboardValue(value: unknown, fallback = "—"): string | number {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number" || typeof value === "string") return value;
  return fallback;
}

function getAccountStatusBadge(status: string | undefined | null) {
  const normalized = status?.trim().toLowerCase() || "inactive";

  if (normalized === "active") {
    return (
      <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
        Active
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="capitalize">
      {normalized.replace(/_/g, " ")}
    </Badge>
  );
}

export function StudentDashboard() {
  const { user } = useAuthStore();
  const { currentTermApiId, currentClass } = useAcademicContext();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<DashboardContent | null>(
    null,
  );
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [termPerformanceData, setTermPerformanceData] = useState<
    Array<{ subject: string; percentage: number }>
  >([]);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);

  const [motd, setMotd] = useState<Motd | null>(null);
  const [motdDismissed, setMotdDismissed] = useState(true);

  // Fetch MOTD
  useEffect(() => {
    if (!user) return;
    const dismissedKey = `motd_dismissed_${user.id}`;
    const isDismissed = sessionStorage.getItem(dismissedKey) === "true";
    setMotdDismissed(isDismissed);

    const fetchMotd = async () => {
      if (isDismissed) return;
      try {
        const res = await getMotd();
        if (res.success && res.content?.motd) {
          setMotd(res.content.motd);
        }
      } catch (error) {
        console.error("Failed to fetch MOTD:", error);
      }
    };
    fetchMotd();
  }, [user]);

  const handleDismissMotd = () => {
    if (!user) return;
    const dismissedKey = `motd_dismissed_${user.id}`;
    sessionStorage.setItem(dismissedKey, "true");
    setMotdDismissed(true);
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoadingDashboard(true);
      try {
        const response = await getDashboard();
        if (response.success && response.content) {
          setDashboardData(response.content);
          // Set selected subject to the progress subject if available
          if (response.content.progress?.subject) {
            setSelectedSubject(response.content.progress.subject);
          }
        } else {
          toast.error(response.message || "Could not load dashboard data");
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
        toast.error("Could not load dashboard data");
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    fetchDashboard();
  }, []);

  useEffect(() => {
    const fetchPerformance = async () => {
      if (typeof currentTermApiId !== "number") {
        setTermPerformanceData([]);
        setIsLoadingPerformance(false);
        return;
      }

      setIsLoadingPerformance(true);
      try {
        const response = await getAllSubjectsTotalScores(currentTermApiId);
        if (response.success && response.content?.total_scores) {
          const scores = response.content.total_scores;
          const performanceData = Object.entries(scores).map(
            ([subject, scoreArray]) => {
              if (!scoreArray || scoreArray.length === 0) {
                return { subject, percentage: 0 };
              }
              const avg =
                scoreArray.reduce(
                  (acc, curr) => acc + parseFloat(curr.total_score || "0"),
                  0,
                ) / scoreArray.length;
              const percentage = Math.min(100, Math.max(0, Math.round(avg)));
              return { subject, percentage };
            },
          );
          setTermPerformanceData(performanceData);
        } else {
          setTermPerformanceData([]);
          if (!(response as any).noData) {
            toast.error(response.message || "Could not load performance data");
          }
        }
      } catch (error) {
        setTermPerformanceData([]);
        toast.error("Could not load performance data");
      } finally {
        setIsLoadingPerformance(false);
      }
    };

    fetchPerformance();
  }, [currentTermApiId]);

  // Derived data for donut
  const lessonsCovered = Number(
    dashboardData?.lessons_covered ?? dashboardData?.progress?.covered ?? 0,
  );
  const totalLessons = Number(
    dashboardData?.total_lessons ??
      ((dashboardData?.progress?.covered ?? 0) +
        (dashboardData?.progress?.left ?? 0)),
  );
  const lessonsLeft = Math.max(0, totalLessons - lessonsCovered);
  const totalSubjects =
    dashboardData?.cards?.total_subjects ?? dashboardData?.subjects;
  const subscriptionStatus =
    dashboardData?.cards?.subscription?.status ??
    dashboardData?.subscription_status ??
    "inactive";
  const accountStatus =
    dashboardData?.cards?.account_status ?? dashboardData?.account_status;
  const progressSubject = dashboardData?.progress?.subject || "Lessons";

  const progressPercent =
    totalLessons > 0
      ? Math.round((lessonsCovered / totalLessons) * 100)
      : 0;

  const donutSubject = progressSubject || selectedSubject;

  const donutOptions =
    isLoadingDashboard || !donutSubject
      ? []
      : [
          {
            label: donutSubject,
            value: donutSubject,
            color: "#3b82f6",
          },
        ];

  const donutProgressMap =
    isLoadingDashboard || !donutSubject
      ? {}
      : {
          [donutSubject]: progressPercent,
        };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="dashboard-spacing"
    >
      <motion.div variants={itemVariants}>
        {motd && !motdDismissed && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/20">
            <CardContent className="flex items-start justify-between p-4">
              <div className="flex gap-3">
                <div className="mt-1 rounded-full bg-amber-100 p-2 dark:bg-amber-900/50">
                  <Bell className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-100">{motd.title}</h4>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{motd.message}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismissMotd}
                className="text-amber-700 hover:bg-amber-200/50 hover:text-amber-900 dark:text-amber-300 dark:hover:bg-amber-800/50 dark:hover:text-amber-100"
              >
                <X className="size-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        <DismissibleCard
          id="student_dashboard_intro"
          title="Welcome to your Dashboard!"
          icon={<Info className="size-5 text-blue-500" />}
          content={
            <div className="space-y-2">
              <p>Here are a few tips to get you started:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Sidebar:</strong> Access it using the menu icon to
                  navigate through the app.
                </li>
                <li>
                  <strong>Profile Editing:</strong> Click your avatar in the top
                  right to update your details.
                </li>
                <li>
                  <strong>Subject Selection:</strong> Use the sidebar or quick
                  links to navigate to your registered subjects.
                </li>
              </ul>
            </div>
          }
          className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/20"
        />
      </motion.div>

      {/* iOS 26 Glassmorphism Welcome Header with Apple Hello Animation */}
      <motion.div variants={itemVariants}>
        <GlassGreetingCard
          userName={dashboardData?.name || "Student"}
          role="Student"
          level={5}
          streak={7}
          lessonsToday={3}
          currentClass={user?.class ? (currentClass?.name ?? null) : null}
        />
      </motion.div>

      {/* Top Stats Grid */}
      <motion.div
        variants={itemVariants}
        className="responsive-gap grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Lessons Completed */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="relative overflow-hidden border-gray-200/50 bg-gradient-to-br from-white to-gray-50/50 dark:border-gray-700/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardContent className="responsive-padding">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Lessons Completed
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-xl font-bold sm:text-2xl">
                    {isLoadingDashboard ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      getDashboardValue(lessonsCovered)
                    )}
                  </h3>
                </div>
              </div>
              <div className="absolute right-0 top-0 flex size-8 items-center justify-center rounded-bl-xl bg-primary/10">
                <div className="size-2 rounded-full bg-primary/40"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subjects */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="relative overflow-hidden border-gray-200/50 bg-gradient-to-br from-white to-gray-50/50 dark:border-gray-700/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardContent className="responsive-padding">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Subjects
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-xl font-bold sm:text-2xl">
                    {isLoadingDashboard ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      getDashboardValue(totalSubjects)
                    )}
                  </h3>
                </div>
              </div>
              <div className="absolute right-0 top-0 flex size-8 items-center justify-center rounded-bl-xl bg-primary/10">
                <div className="size-2 rounded-full bg-primary/40"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Status */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="relative overflow-hidden border-gray-200/50 bg-gradient-to-br from-white to-gray-50/50 dark:border-gray-700/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardContent className="responsive-padding">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Subscription Status
                </p>
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-bold sm:text-2xl">
                    {isLoadingDashboard ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      getSubscriptionStatusBadge(subscriptionStatus)
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute right-0 top-0 flex size-8 items-center justify-center rounded-bl-xl bg-primary/10">
                <div className="size-2 rounded-full bg-primary/40"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Status */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="relative overflow-hidden border-gray-200/50 bg-gradient-to-br from-white to-gray-50/50 dark:border-gray-700/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardContent className="responsive-padding">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Account Status
                </p>
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-bold sm:text-2xl">
                    {isLoadingDashboard ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      getAccountStatusBadge(accountStatus)
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute right-0 top-0 flex size-8 items-center justify-center rounded-bl-xl bg-primary/10">
                <div className="size-2 rounded-full bg-primary/40"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Progress + Achievements + Overview row */}
      <motion.div
        variants={itemVariants}
        className="responsive-gap grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* Progress Donut - Phase B replacement */}
        <ProgressDonut
          options={donutOptions}
          value={donutSubject}
          onChange={setSelectedSubject}
          progressMap={donutProgressMap}
        />

        {/* Achievements (3 cards) - extracted */}
        <AchievementsSection
          items={[]}
          description="Achievements coming soon"
        />

        {/* Overview grid - extracted */}
        <div className="md:col-span-2 lg:col-span-1">
          {isLoadingDashboard ? (
            <Card className="h-full border bg-card">
              <CardContent className="flex items-center justify-center p-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <OverviewGrid
              stats={[
                {
                  label: "Subjects",
                  value: totalSubjects || "N/A",
                },
                {
                  label: "Lessons",
                  value: lessonsCovered || "N/A",
                },
                {
                  label: "Subscription Status",
                  value: getSubscriptionStatusBadge(subscriptionStatus),
                },
                {
                  label: "Account Status",
                  value: getAccountStatusBadge(accountStatus),
                },
              ]}
            />
          )}
        </div>

        {/* Progress Card */}
        {dashboardData && (
          <motion.div variants={itemVariants}>
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50/50 dark:to-blue-950/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Target className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Progress Overview</CardTitle>
                    <CardDescription>
                      Your learning progress
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {progressSubject} Progress
                      </span>
                      <span className="font-medium">
                        {lessonsCovered} / {totalLessons}
                      </span>
                    </div>
                    <Progress
                      value={
                        progressPercent
                      }
                      className="h-3"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <div className="text-sm text-muted-foreground">
                        Covered
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {lessonsCovered}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <div className="text-sm text-muted-foreground">
                        Remaining
                      </div>
                      <div className="text-2xl font-bold text-muted-foreground">
                        {lessonsLeft}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* Today's Lessons - Enhanced */}
      <motion.div variants={itemVariants}>
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50/50 dark:to-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Calendar className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Today&apos;s Lessons
                  </CardTitle>
                  <CardDescription>
                    Start with your scheduled lessons for today
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <BookOpen className="size-8 text-primary" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">
                Your lesson schedule will appear here
              </h3>
              <p className="text-sm text-muted-foreground">
                Lesson scheduling is coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Leaderboard Section - extracted */}
      <motion.div variants={itemVariants}>
        <LeaderBoard entries={[]} subtitle="Leaderboard coming soon" />
      </motion.div>

      {/* Performance (bars) + Achievements - Original */}
      <div className="responsive-gap grid grid-cols-1 lg:grid-cols-3">
        {/* Term Performance - extracted (takes 2 columns) */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          {isLoadingPerformance ? (
            <Skeleton className="h-48 w-full" />
          ) : termPerformanceData.length > 0 ? (
            <PerformanceSection
              items={termPerformanceData.map((s) => ({
                subject: s.subject,
                percentage: s.percentage,
                target: 100,
                colorClass: "bg-primary",
              }))}
              title="Term Performance"
              description="Overall performance across all subjects this term"
            />
          ) : (
            <PerformanceSection
              items={[]}
              title="Term Performance"
              description="No performance data available yet."
            />
          )}
        </motion.div>

        {/* Achievements - Original */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-lg bg-yellow-100 p-2">
                  <Trophy className="size-5 text-yellow-600" />
                </div>
                Achievements
              </CardTitle>
              <CardDescription>Your learning milestones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-component-sm sm:space-y-component-md">
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Trophy className="mb-2 size-8 opacity-20" />
                <p>Achievements coming soon</p>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full">
                View All Achievements
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
