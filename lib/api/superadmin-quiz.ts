import { ApiResponse } from "@/lib/types/auth";
import {
  AdminQuizCompetition,
  AdminQuizLga,
  AdminQuizState,
  CreateLgaData,
  CreateQuizCompetitionData,
  CreateStateData,
  PaginationLinks,
  PaginationMeta,
  QuizCompetitionStatusOption,
} from "@/lib/types/quiz-competition";

function fail(error: any, message: string): ApiResponse<any> {
  return { success: false, message: error?.message || message, content: null, code: 500 };
}

// ---- Competitions ----

export async function adminGetCompetitions(
  page = 1,
): Promise<
  ApiResponse<{
    quiz_competition: AdminQuizCompetition[];
    links: PaginationLinks;
    meta: PaginationMeta;
  }>
> {
  try {
    const res = await fetch(
      `/api/proxy/superadmin/quizzes/competitions?page=${page}`,
      { method: "GET", headers: { Accept: "application/json" }, credentials: "include" },
    );
    const data = await res.json();
    if (data.success && data.content?.competitions) {
      data.content = data.content.competitions;
    }
    return data;
  } catch (error: any) {
    return fail(error, "Failed to fetch quiz competitions");
  }
}

export async function adminGetCompetition(
  id: number,
): Promise<ApiResponse<{ competition: AdminQuizCompetition }>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/quizzes/competitions/${id}/view`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to fetch quiz competition");
  }
}

export async function adminCreateCompetition(
  data: CreateQuizCompetitionData,
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch("/api/proxy/superadmin/quizzes/competitions/create", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to create quiz competition");
  }
}

export async function adminUpdateCompetition(
  id: number,
  data: CreateQuizCompetitionData,
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/quizzes/competitions/${id}/update`, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to update quiz competition");
  }
}

export async function adminDeleteCompetition(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/quizzes/competitions/${id}/delete`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to delete quiz competition");
  }
}

async function postAction(path: string, message: string): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/quizzes/competitions/${path}`, {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, message);
  }
}

export const adminOpenRegistration = (id: number) =>
  postAction(`${id}/open-registration`, "Failed to open registration");
export const adminCloseRegistration = (id: number) =>
  postAction(`${id}/close-registration`, "Failed to close registration");
export const adminPublishCompetition = (id: number) =>
  postAction(`${id}/publish-competition`, "Failed to publish competition");
export const adminArchiveCompetition = (id: number) =>
  postAction(`${id}/archive-competition`, "Failed to archive competition");

// ---- Competition statuses ----

export async function adminGetCompetitionStatuses(): Promise<
  ApiResponse<{ competition_statuses: QuizCompetitionStatusOption[] }>
> {
  try {
    const res = await fetch("/api/proxy/superadmin/quizzes/competitions/statuses", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to fetch competition statuses");
  }
}

export async function adminCreateCompetitionStatus(name: string): Promise<ApiResponse<null>> {
  try {
    const res = await fetch("/api/proxy/superadmin/quizzes/competitions/statuses/create", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name }),
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to create competition status");
  }
}

export async function adminUpdateCompetitionStatus(
  id: number,
  name: string,
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/quizzes/competitions/statuses/${id}/update`, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name }),
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to update competition status");
  }
}

export async function adminDeleteCompetitionStatus(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/quizzes/competitions/statuses/${id}/delete`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to delete competition status");
  }
}

// ---- States ----

export async function adminGetStates(): Promise<ApiResponse<{ states: AdminQuizState[] }>> {
  try {
    const res = await fetch("/api/proxy/superadmin/states", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to fetch states");
  }
}

export async function adminCreateState(data: CreateStateData): Promise<ApiResponse<null>> {
  try {
    const res = await fetch("/api/proxy/superadmin/states/create", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to create state");
  }
}

export async function adminUpdateState(
  id: number,
  data: CreateStateData,
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/states/${id}/update`, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to update state");
  }
}

export async function adminDeleteState(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/states/${id}/delete`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to delete state");
  }
}

// ---- LGAs ----

export async function adminGetLgasByState(
  stateId: number,
): Promise<ApiResponse<{ lgas: AdminQuizLga[] }>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/lgas/${stateId}/by-state`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to fetch LGAs");
  }
}

export async function adminCreateLga(data: CreateLgaData): Promise<ApiResponse<null>> {
  try {
    const res = await fetch("/api/proxy/superadmin/lgas/create", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to create LGA");
  }
}

export async function adminUpdateLga(
  id: number,
  data: CreateLgaData,
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/lgas/${id}/update`, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to update LGA");
  }
}

export async function adminDeleteLga(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/lgas/${id}/delete`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return fail(error, "Failed to delete LGA");
  }
}
