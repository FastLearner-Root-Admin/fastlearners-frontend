// lib/api/lessons.ts - Client-side service for lessons API

import type {
  AllLessonsTotalScoresResponse,
  AllSubjectsTotalScoresResponse,
  ConceptScoreBreakdown,
  ExerciseCheckResponse,
  LessonCheckResponse,
  LessonCompletionData,
  LessonContent,
  LessonContentResponse,
  LessonSummaryResponse,
  SubjectsWithSlugsResponse,
  TopicOverviewResponse,
  TopicsResponse,
} from "@/lib/types/lessons";
import { trackEvent } from "@/lib/analytics/posthog";

// getLessonContent removed - use getLessonContentBySlug instead

// Mark lesson as complete
// Note: Route moved to /api/lessons/by-id/[id]/complete to avoid conflict with [subjectSlug]
export async function markLessonComplete(
  lessonId: number,
): Promise<{ success: boolean; message: string; code: number }> {
  try {
    const res = await fetch(`/api/lessons/by-id/${lessonId}/complete`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to mark lesson as complete",
        code: res.status,
      };
    }

    trackEvent("lesson_completed", { lesson_id: lessonId });

    return {
      success: true,
      message: data.message || "Lesson marked as complete",
      code: res.status,
    };
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.error("markLessonComplete error:", err);
    }
    return {
      success: false,
      message: err?.message || "Network error",
      code: 500,
    };
  }
}

export async function getSubjectsWithSlugs(): Promise<SubjectsWithSlugsResponse> {
  try {
    const res = await fetch("/api/lessons", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch subjects with slugs",
        content: null,
        code: res.status,
      };
    }

    return data as SubjectsWithSlugsResponse;
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.error("getSubjectsWithSlugs error:", err);
    }
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function getTopicsBySubjectSlug(
  subjectSlug: string,
): Promise<TopicsResponse> {
  try {
    const res = await fetch(`/api/lessons/${subjectSlug}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch topics by subject slug",
        content: null,
        code: res.status,
      };
    }

    return data as TopicsResponse;
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.error("getTopicsBySubjectSlug error:", err);
    }
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function getTopicOverview(
  subjectSlug: string,
  topicSlug: string,
): Promise<TopicOverviewResponse> {
  try {
    const res = await fetch(
      `/api/lessons/${subjectSlug}/${topicSlug}/overview`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch topic overview",
        content: null,
        code: res.status,
      };
    }

    return data as TopicOverviewResponse;
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.error("getTopicOverview error:", err);
    }
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function getLessonContentBySlug(
  subjectSlug: string,
  topicSlug: string,
): Promise<LessonContentResponse> {
  try {
    const res = await fetch(
      `/api/lessons/${subjectSlug}/${topicSlug}/content`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch lesson content by slug",
        content: null,
        code: res.status,
      };
    }

    return data as LessonContentResponse;
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.error("getLessonContentBySlug error:", err);
    }
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function getLessonContentById(
  lessonId: number,
): Promise<LessonContentResponse> {
  try {
    const res = await fetch(`/api/lessons/by-id/${lessonId}/content`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch lesson content by ID",
        content: null,
        code: res.status,
      };
    }

    return data as LessonContentResponse;
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.error("getLessonContentById error:", err);
    }
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

// Lesson Completion Check Endpoints

export async function checkLessonOverview(
  lessonId: number,
): Promise<LessonCheckResponse> {
  try {
    const res = await fetch(`/api/lessons/check/overview/${lessonId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to verify overview completion",
        content: null,
        code: res.status,
      };
    }

    return data as LessonCheckResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function checkLessonConcept(
  lessonId: number,
  conceptId: number,
): Promise<LessonCheckResponse> {
  try {
    const res = await fetch(
      `/api/lessons/check/concept/${lessonId}/${conceptId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to verify concept completion",
        content: null,
        code: res.status,
      };
    }

    return data as LessonCheckResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function checkLessonSummaryAndApplication(
  lessonId: number,
): Promise<LessonCheckResponse> {
  try {
    const res = await fetch(
      `/api/lessons/check/summary-and-application/${lessonId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message:
          data.message || "Failed to verify summary and application completion",
        content: null,
        code: res.status,
      };
    }

    return data as LessonCheckResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function checkLessonGeneralExercises(
  lessonId: number,
): Promise<LessonCheckResponse> {
  try {
    const res = await fetch(
      `/api/lessons/check/general-exercises/${lessonId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message:
          data.message || "Failed to verify general exercises completion",
        content: null,
        code: res.status,
      };
    }

    return data as LessonCheckResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

// Exercise Answer Checking

export async function checkExerciseAnswer(
  exerciseId: number,
  answer: string,
  isGeneral: boolean = false,
): Promise<ExerciseCheckResponse> {
  try {
    // Validate inputs
    if (!exerciseId || exerciseId <= 0 || !Number.isInteger(exerciseId)) {
      return {
        success: false,
        message: "Invalid exercise ID",
        content: null,
        code: 422,
        isCorrect: false,
        errors: {
          exercise_id: ["Exercise ID is required and must be greater than 0"],
        },
      };
    }

    if (!answer || answer.trim() === "") {
      return {
        success: false,
        message: "Answer is required",
        content: null,
        code: 422,
        isCorrect: false,
        errors: { answer: ["The answer field is required."] },
      };
    }

    // Ensure answer is uppercase letter (A, B, C, D, etc.)
    const normalizedAnswer = answer.trim().toUpperCase();
    if (!/^[A-Z]$/.test(normalizedAnswer)) {
      return {
        success: false,
        message: "Answer must be a single letter (A, B, C, D, etc.)",
        content: null,
        code: 422,
        isCorrect: false,
        errors: { answer: ["Answer must be a single letter"] },
      };
    }

    const body = isGeneral
      ? { general_exercise_id: Number(exerciseId), answer: normalizedAnswer }
      : { exercise_id: Number(exerciseId), answer: normalizedAnswer };

    // Use different endpoints for concept vs general exercises
    const endpoint = isGeneral
      ? "/api/lessons/check-general-exercise-answer"
      : "/api/lessons/check-exercise-answer";

    // Debug logging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("[checkExerciseAnswer] Request:", {
        endpoint,
        body,
        isGeneral,
      });
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json();

    // Debug logging (always log in development to see what we're getting)
    if (process.env.NODE_ENV === "development") {
      console.log("[checkExerciseAnswer] Response:", {
        status: res.status,
        statusText: res.statusText,
        data,
        requestBody: body,
        headers: Object.fromEntries(res.headers.entries()),
      });
    }

    if (!res.ok) {
      // Check if it's an "already answered" error - these should be treated as success
      const isAlreadyAnswered =
        data.message?.toLowerCase().includes("already answered") ||
        data.message?.toLowerCase().includes("already answered correctly");

      if (isAlreadyAnswered) {
        return {
          success: true,
          message: data.message || "Exercise already answered",
          content: data.content || null,
          code: 200, // Treat as success
          isCorrect: true,
          errors: null,
        };
      }

      return {
        success: false,
        message: data.message || "Wrong answer. Try again!",
        content: null,
        code: data.code || res.status,
        isCorrect: false,
        errors: data.errors,
      };
    }

    // Success response (200) - determine if answer is correct
    // Backend returns 200 with success: true for correct answers
    // Backend returns 200 with message "already answered" for previously answered exercises
    const isAlreadyAnswered =
      data.message?.toLowerCase().includes("already answered") ||
      data.message?.toLowerCase().includes("already answered correctly");

    // Answer is correct if:
    // 1. success is explicitly true, OR
    // 2. status is 200 and message doesn't say "wrong answer", OR
    // 3. message indicates "already answered" (was previously correct)
    const isCorrect =
      data.success === true ||
      (res.status === 200 &&
        !data.message?.toLowerCase().includes("wrong answer")) ||
      isAlreadyAnswered;

    return {
      ...data,
      isCorrect: isCorrect,
      code: data.code || res.status,
      success: data.success !== false, // Ensure success is set
    } as ExerciseCheckResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
      isCorrect: false,
    };
  }
}

// Score Fetching Endpoints

export async function getConceptScore(
  conceptId: number,
): Promise<import("@/lib/types/lessons").ConceptScoreResponse> {
  try {
    const res = await fetch(`/api/lessons/scores/concepts/${conceptId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      // Handle 400 errors (score not found) as default zero scores
      if (res.status === 400) {
        return {
          success: true,
          message: "No score available yet",
          content: {
            total_score: "0.00",
            weight: "0.00",
            ...((data.content as any) || {}),
          } as any,
          code: 200,
        };
      }

      return {
        success: false,
        message: data.message || "Failed to fetch concept score",
        content: null,
        code: res.status,
      };
    }

    return data as import("@/lib/types/lessons").ConceptScoreResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function getGeneralExerciseScore(
  generalExerciseId: number,
): Promise<import("@/lib/types/lessons").GeneralExerciseScoreResponse> {
  try {
    const res = await fetch(
      `/api/lessons/scores/general-exercises/${generalExerciseId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      // Handle 400 errors (score not found) as default zero scores
      if (res.status === 400) {
        return {
          success: true,
          message: "No score available yet",
          content: {
            total_score: "0.00",
            weight: "0.00",
            ...((data.content as any) || {}),
          } as any,
          code: 200,
        };
      }
      return {
        success: false,
        message: data.message || "Failed to fetch general exercise score",
        content: null,
        code: res.status,
      };
    }

    return data as import("@/lib/types/lessons").GeneralExerciseScoreResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function getLessonScore(
  lessonId: number,
): Promise<import("@/lib/types/lessons").LessonScoreResponse> {
  try {
    const res = await fetch(`/api/lessons/scores/lessons/${lessonId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      // Handle 400/404 errors (score not found/unavailable) as default zero scores
      if (res.status === 400 || res.status === 404) {
        return {
          success: true,
          message: "No score available yet",
          content: {
            lesson_total_score: "0.00",
            ...((data.content as any) || {}),
          } as any,
          code: 200,
        };
      }
      return {
        success: false,
        message: data.message || "Failed to fetch lesson score",
        content: null,
        code: res.status,
      };
    }

    return data as import("@/lib/types/lessons").LessonScoreResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function getSubjectScore(
  subjectId: number,
  classId: number,
): Promise<import("@/lib/types/lessons").SubjectScoreResponse> {
  try {
    const res = await fetch(
      `/api/lessons/scores/subjects/${subjectId}/${classId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 400) {
        return {
          success: true,
          message: "No score available yet",
          content: { subject_total_score: "0.00", weight: 0 },
          code: 200,
        } as any;
      }

      return {
        success: false,
        message: data.message || "Failed to fetch subject score",
        content: null,
        code: res.status,
      };
    }

    return data as import("@/lib/types/lessons").SubjectScoreResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

// Helper function for safe number parsing
function parseScoreString(scoreStr: string | undefined | null): number {
  if (!scoreStr) return 0;
  const parsed = parseFloat(scoreStr);
  return isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
}

/**
 * Aggregates lesson completion data from multiple API endpoints and local store data
 * @param lessonId - The lesson ID
 * @param lessonContent - The lesson content object
 * @param sectionTimeTracking - Record of time tracking per section
 * @param exerciseProgress - Record of exercise progress
 * @returns Promise with success status, data, and message
 */
export async function getLessonCompletionData(
  lessonId: number,
  lessonContent: LessonContent,
  sectionTimeTracking: Record<string, any>,
  exerciseProgress: Record<number, any>,
): Promise<{
  success: boolean;
  data: LessonCompletionData | null;
  message: string;
}> {
  try {
    // Validate inputs
    if (!lessonId || !lessonContent) {
      return {
        success: false,
        data: null,
        message: "Invalid lesson ID or content",
      };
    }

    // 1. Fetch lesson total score
    let lessonScore = 0;
    try {
      const lessonScoreResponse = await getLessonScore(lessonId);
      if (lessonScoreResponse.success && lessonScoreResponse.content) {
        lessonScore = parseScoreString(
          lessonScoreResponse.content.lesson_total_score,
        );
      }
    } catch (err) {
      // Handle 400 error (no score yet) by defaulting to 0
      if (process.env.NODE_ENV === "development") {
        console.warn("Lesson score not available yet, defaulting to 0");
      }
    }

    // 2. Fetch all concept scores in parallel
    const concepts = lessonContent.concepts || [];
    const conceptScorePromises = concepts.map(async (concept) => {
      try {
        const conceptScoreResponse = await getConceptScore(concept.id);
        const score =
          conceptScoreResponse.success && conceptScoreResponse.content
            ? parseScoreString(conceptScoreResponse.content.total_score)
            : 0;
        const weight =
          conceptScoreResponse.success && conceptScoreResponse.content
            ? parseScoreString(conceptScoreResponse.content.weight)
            : 0;

        // Count completed exercises for this concept
        const conceptExerciseIds =
          concept.exercises?.map((ex: any) => ex.id) || [];
        const completedExercises = conceptExerciseIds.filter(
          (exId: number) => exerciseProgress[exId]?.isCompleted === true,
        ).length;

        return {
          conceptId: concept.id,
          title: concept.title || `Concept ${concept.id}`,
          score,
          weight,
          totalExercises: concept.exercises?.length || 0,
          completedExercises,
        } as ConceptScoreBreakdown;
      } catch (err) {
        // Handle error for individual concept by returning 0 score
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `Concept score not available for concept ${concept.id}, defaulting to 0`,
          );
        }
        return {
          conceptId: concept.id,
          title: concept.title || `Concept ${concept.id}`,
          score: 0,
          weight: 0,
          totalExercises: concept.exercises?.length || 0,
          completedExercises: 0,
        } as ConceptScoreBreakdown;
      }
    });

    const conceptScores = await Promise.all(conceptScorePromises);

    // 3. Aggregate general exercises score
    let generalExercisesScore = 0;
    let generalExercisesWeight = 0;
    const generalExercises = lessonContent.general_exercises || [];

    if (generalExercises.length > 0) {
      // Fetch all general exercise scores in parallel
      const generalExercisePromises = generalExercises.map(async (exercise) => {
        try {
          const response = await getGeneralExerciseScore(exercise.id);
          if (response.success && response.content) {
            return {
              score: parseScoreString(response.content.total_score),
              weight: parseScoreString(response.content.weight),
            };
          }
          return { score: 0, weight: 0 };
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `General exercise score not available for exercise ${exercise.id}, defaulting to 0`,
            );
          }
          return { score: 0, weight: 0 };
        }
      });

      const generalExerciseScores = await Promise.all(generalExercisePromises);

      // Aggregate scores using weighted average
      const totalWeight = generalExerciseScores.reduce(
        (sum, item) => sum + item.weight,
        0,
      );
      // Aggregate scores using simple average for general exercises as per requirement
      if (generalExercises.length > 0) {
        const totalScore = generalExerciseScores.reduce(
          (sum, item) => sum + item.score,
          0,
        );
        generalExercisesScore = totalScore / generalExercises.length;
        // Calculate average weight
        generalExercisesWeight =
          generalExerciseScores.reduce((sum, item) => sum + item.weight, 0) /
            generalExercises.length || 0;
      }
    }

    // 4. Calculate total time spent
    let timeSpent = 0;
    if (sectionTimeTracking && typeof sectionTimeTracking === "object") {
      Object.values(sectionTimeTracking).forEach((section: any) => {
        if (section && typeof section.timeSpent === "number") {
          timeSpent += section.timeSpent;
        }
      });
    }

    // 5. Calculate accuracy rate
    let accuracyRate = 0;
    if (exerciseProgress && typeof exerciseProgress === "object") {
      const completedExercises = Object.values(exerciseProgress).filter(
        (ex: any) => ex?.isCompleted === true,
      );
      const correctExercises = completedExercises.filter(
        (ex: any) => ex?.isCorrect === true,
      );

      if (completedExercises.length > 0) {
        accuracyRate =
          (correctExercises.length / completedExercises.length) * 100;
      }
    }

    // 6. Calculate exercise counts
    const totalConceptExercises = concepts.reduce(
      (sum, concept) => sum + (concept.exercises?.length || 0),
      0,
    );
    const totalExercises = totalConceptExercises + generalExercises.length;

    const completedExercises = Object.values(exerciseProgress).filter(
      (ex: any) => ex?.isCompleted === true,
    ).length;

    // 7. Assemble LessonCompletionData object
    const data: LessonCompletionData = {
      lessonId,
      lessonTitle: lessonContent.title || `Lesson ${lessonId}`,
      lessonScore,
      conceptScores,
      generalExercisesScore,
      generalExercisesWeight,
      totalExercises,
      completedExercises,
      timeSpent,
      accuracyRate,
    };

    // 8. Return success response
    return {
      success: true,
      data,
      message: "Lesson completion data retrieved successfully",
    };
  } catch (err: any) {
    // Global error handling
    if (process.env.NODE_ENV === "development") {
      console.error("getLessonCompletionData error:", err);
    }
    return {
      success: false,
      data: null,
      message: err?.message || "Failed to retrieve lesson completion data",
    };
  }
}

/**
 * Fetch lesson summary scores and overview
 */
export async function getLessonSummary(
  lessonId: number,
): Promise<LessonSummaryResponse> {
  try {
    const res = await fetch(`/api/lessons/scores/lessons/summary/${lessonId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 400) {
        return {
          success: false,
          message: data.message || "No summary data yet",
          content: null,
          code: 400,
          noData: true,
        };
      }
      return {
        success: false,
        message: data.message || "Failed to fetch lesson summary",
        content: null,
        code: res.status,
      };
    }

    return data as LessonSummaryResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

/**
 * Fetch all lessons total scores for a subject and term
 */
export async function getAllLessonsTotalScores(
  subjectId: number,
  termId: number,
): Promise<AllLessonsTotalScoresResponse> {
  try {
    const res = await fetch(
      `/api/lessons/scores/lessons/total/${subjectId}/${termId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 400) {
        return {
          success: false,
          message: data.message || "No lessons total scores found",
          content: null,
          code: 400,
          noData: true,
        };
      }
      return {
        success: false,
        message: data.message || "Failed to fetch all lessons total scores",
        content: null,
        code: res.status,
      };
    }

    return data as AllLessonsTotalScoresResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

/**
 * Fetch all subjects total scores for a term
 */
export async function getAllSubjectsTotalScores(
  termId: number,
): Promise<AllSubjectsTotalScoresResponse> {
  try {
    const res = await fetch(`/api/lessons/scores/subjects/total/${termId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 400) {
        return {
          success: false,
          message: data.message || "No subjects total scores found",
          content: null,
          code: 400,
          noData: true,
        };
      }
      return {
        success: false,
        message: data.message || "Failed to fetch all subjects total scores",
        content: null,
        code: res.status,
      };
    }

    return data as AllSubjectsTotalScoresResponse;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}
