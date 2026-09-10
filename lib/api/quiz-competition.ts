import { ApiResponse } from "@/lib/types/auth";
import {
  PaginationLinks,
  PaginationMeta,
  QuizCompetition,
  QuizDashboard,
  QuizLga,
  QuizRegistration,
  QuizState,
} from "@/lib/types/quiz-competition";

export async function getQuizDashboard(): Promise<ApiResponse<QuizDashboard>> {
  try {
    const res = await fetch("/api/proxy/quizzes/dashboard", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch quiz dashboard",
      content: null,
      code: 500,
    };
  }
}

export async function getStates(): Promise<ApiResponse<{ states: QuizState[] }>> {
  try {
    const res = await fetch("/api/proxy/states", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch states",
      content: null,
      code: 500,
    };
  }
}

export async function getLgas(
  stateId: number,
): Promise<ApiResponse<{ lgas: QuizLga[] }>> {
  try {
    const res = await fetch(`/api/proxy/lgas/${stateId}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch LGAs",
      content: null,
      code: 500,
    };
  }
}

export async function getQuizCompetitions(
  page = 1,
): Promise<
  ApiResponse<{
    quiz_competition: QuizCompetition[];
    links: PaginationLinks;
    meta: PaginationMeta;
  }>
> {
  try {
    const res = await fetch(`/api/proxy/quizzes/competitions?page=${page}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch quiz competitions",
      content: null,
      code: 500,
    };
  }
}

export async function getQuizCompetition(
  id: number,
): Promise<ApiResponse<{ quiz: QuizCompetition }>> {
  try {
    const res = await fetch(`/api/proxy/quizzes/competitions/${id}/view`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch quiz competition",
      content: null,
      code: 500,
    };
  }
}

export async function getRegistrationHistory(
  page = 1,
): Promise<
  ApiResponse<{
    quizzes: {
      quizzes: QuizRegistration[];
      links: PaginationLinks;
      meta: PaginationMeta;
    };
  }>
> {
  try {
    const res = await fetch(
      `/api/proxy/quizzes/competitions/registration-history?page=${page}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      },
    );
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch registration history",
      content: null,
      code: 500,
    };
  }
}

export async function registerForCompetition(
  quizCompetitionId: number,
  stateId: number,
  lgaId: number,
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch("/api/proxy/quizzes/competitions/registration", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        quiz_competition_id: quizCompetitionId,
        state_id: stateId,
        lga_id: lgaId,
      }),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to register for competition",
      content: null,
      code: 500,
    };
  }
}

// A 2026-09-06 test hit "POST method not supported... Supported methods: GET, HEAD."
// Backend confirmed the fix on 2026-09-10 ("Quiz cancellation issue resolved") and the
// docs still list POST, so this now uses POST as documented. See docs/known-issues.md.
export async function cancelRegistration(
  competitionId: number,
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(
      `/api/proxy/quizzes/competitions/${competitionId}/cancel-registration`,
      {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "include",
      },
    );
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to cancel registration",
      content: null,
      code: 500,
    };
  }
}
