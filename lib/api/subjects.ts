// lib/api/subjects.ts - Client-side service for subjects API

import {
  type ApiSubjectsResponse,
  type DashboardData,
  type ProfileData,
  type SubjectItem,
  type SubjectsContent,
  type SubjectsResponse,
  type UpdateResponse,
} from "@/lib/types/subjects";
import { formatApiErrorMessage } from "@/lib/utils/api-errors";

import { BASE_API_URL as API_BASE } from "./client";

// Get user profile (direct backend call with token)
export async function getUserProfile(token: string): Promise<ProfileData> {
  const response = await fetch(`${API_BASE}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }

  const data = await response.json();
  return data.content.user;
}

// Update user profile (class, discipline, term)
// Fetches current profile first to merge updates and send complete payload
export async function updateProfile(
  token: string,
  updates: {
    class: string;
    discipline?: string;
    term?: string;
    [key: string]: any;
  },
): Promise<ProfileData> {
  // Fetch current profile to merge with updates
  // This ensures we send a complete payload that passes backend validation
  const currentProfile = await getUserProfile(token);

  // Validate discipline if provided (must be one of the allowed values for SSS classes)
  if (updates.discipline) {
    const validDisciplines = ["Art", "Commercial", "Science"];
    if (!validDisciplines.includes(updates.discipline)) {
      throw new Error(
        `Invalid discipline. Must be one of: ${validDisciplines.join(", ")}`,
      );
    }
  }

  // Build complete payload by merging current profile with updates
  const payload: Partial<ProfileData> = {
    ...currentProfile, // Preserve existing fields
    ...updates, // Overlay academic changes
  };

  // Ensure role is set (default to 'student' if not present)
  // Handle role conversion - ProfileData has role as string[], but backend may expect string
  // We'll keep it as array for the payload but ensure it has a value
  if (!currentProfile.role || currentProfile.role.length === 0) {
    // If no role, set to student
    payload.role = ["student"];
  } else if (
    Array.isArray(currentProfile.role) &&
    currentProfile.role.includes("guest")
  ) {
    // If user is guest, update to student
    payload.role = ["student"];
  }
  // Otherwise keep existing role array

  // Remove discipline for non-SSS classes
  const classCategory = updates.class?.startsWith("SSS") ? "sss" : "jss";
  if (classCategory !== "sss" && "discipline" in payload) {
    delete payload.discipline;
  }

  const response = await fetch(`${API_BASE}/profile/edit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();

    // Extract validation errors if present
    if (error.errors) {
      const errorMessages = Object.entries(error.errors)
        .map(([field, messages]) => {
          const msgArray = Array.isArray(messages) ? messages : [messages];
          return `${field}: ${msgArray.join(", ")}`;
        })
        .join("; ");
      throw new Error(
        formatApiErrorMessage(
          { message: error.message || errorMessages, errors: error.errors },
          "Validation failed",
        ),
      );
    }

    throw new Error(formatApiErrorMessage(error, "Failed to update profile"));
  }

  const result = await response.json();
  return result.content.user;
}

// Get available subjects for user (direct backend call with token)
export async function getSubjects(
  token: string,
): Promise<ApiSubjectsResponse["content"]> {
  const response = await fetch(`${API_BASE}/subjects`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch subjects");
  }

  const data = await response.json();
  return data.content;
}

// Get subjects via lessons endpoint (preferred source for student's offered subjects)
export async function getLessonSubjects(
  token: string,
): Promise<SubjectsContent> {
  const response = await fetch(`${API_BASE}/lessons/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch subjects");
  }

  const data = await response.json();
  const subjects = data?.content?.subjects ?? [];

  // Normalize to SubjectsContent shape
  return {
    subjects,
    compulsory_selective_status: "selected",
    compulsory_selective: [],
    selective_status: "selected",
    selective: [],
  };
}

// Update compulsory selective subject (1 religious study)
export async function updateCompulsorySelective(
  token: string,
  subjectId: number,
): Promise<{ success: boolean; message: string }> {
  const formData = new URLSearchParams();
  formData.append("subject", subjectId.toString());
  formData.append("subject_id", subjectId.toString());

  const response = await fetch(
    `${API_BASE}/subjects/update-compulsory-selective`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      formatApiErrorMessage(error, "Failed to update compulsory selective"),
    );
  }

  return {
    success: true,
    message: "Compulsory selective updated successfully",
  };
}

// Update selective subjects (JSS: 2, SSS: 4) - using FormData
export async function updateSelectiveSubjects(
  token: string,
  subjectIds: number[],
): Promise<{ success: boolean; message: string }> {
  const formData = new FormData();
  subjectIds.forEach((id) => {
    formData.append("subjects[]", id.toString());
  });

  const response = await fetch(`${API_BASE}/subjects/update-selective`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      formatApiErrorMessage(error, "Failed to update selective subjects"),
    );
  }

  return { success: true, message: "Selective subjects updated successfully" };
}

// Get dashboard data
export async function getDashboard(
  token: string,
): Promise<DashboardData["content"]> {
  const response = await fetch(`${API_BASE}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  const data = await response.json();
  return data.content;
}

// Client-side functions using internal API routes (for browser use)
// These are kept for backward compatibility and security (tokens stay server-side)

export async function getStudentSubjects(): Promise<SubjectsResponse> {
  try {
    // Call the /api/subjects endpoint which returns:
    // - subjects: current assigned subjects
    // - compulsory_selective: available religious study options (JSS only)
    // - compulsory_selective_status: "selected" or "not_selected"
    // - selective: available selective/discipline subjects
    // - selective_status: "selected" or "not_selected"
    const res = await fetch("/api/subjects", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || !data?.success) {
      return {
        success: false,
        message: formatApiErrorMessage(data, "Failed to fetch subjects"),
        content: null,
        code: res.status,
      };
    }

    // The API returns the correct SubjectsContent structure directly
    const content: SubjectsContent = {
      subjects: data.content.subjects || [],
      compulsory_selective_status:
        data.content.compulsory_selective_status || "not_selected",
      compulsory_selective: data.content.compulsory_selective || [],
      selective_status: data.content.selective_status || "not_selected",
      selective: data.content.selective || [],
    };

    return {
      success: true,
      message: data.message || "Success",
      content,
      code: res.status,
    };
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.error("getStudentSubjects error:", err);
    }
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function updateCompulsorySelectiveClient(
  subjectId: number,
): Promise<UpdateResponse> {
  try {
    const res = await fetch("/api/subjects/update-compulsory-selective", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject: subjectId }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: formatApiErrorMessage(
          data,
          "Failed to update compulsory selective",
        ),
        content: null,
        code: res.status,
        errors: data.errors,
      };
    }

    return data as UpdateResponse;
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.error("updateCompulsorySelective error:", err);
    }
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

export async function updateSelectiveSubjectsClient(
  subjectIds: number[],
): Promise<UpdateResponse> {
  try {
    // Clean and validate subject IDs before sending
    // Filter out null, undefined, NaN, and invalid values
    // Convert to numbers and ensure they're positive integers
    const cleanedSubjectIds = subjectIds
      .filter((id) => id != null && id !== undefined && !Number.isNaN(id))
      .map((id) => {
        const numId = typeof id === "string" ? parseInt(id, 10) : Number(id);
        return Number.isNaN(numId) ? null : numId;
      })
      .filter(
        (id): id is number => id !== null && id > 0 && Number.isInteger(id),
      )
      .filter((id, index, array) => array.indexOf(id) === index); // Remove duplicates

    // Validate that we have at least one valid subject ID
    if (cleanedSubjectIds.length === 0) {
      return {
        success: false,
        message: "Invalid request: at least one valid subject ID is required",
        content: null,
        code: 400,
        errors: {
          subjects: [
            "Subject IDs array is empty or contains only invalid values",
          ],
        },
      };
    }

    // Log what we're sending for debugging
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.log("[updateSelectiveSubjectsClient] Sending:", {
        originalCount: subjectIds.length,
        cleanedCount: cleanedSubjectIds.length,
        cleanedSubjectIds,
        originalSubjectIds: subjectIds,
      });
    }

    const res = await fetch("/api/subjects/update-selective", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subjects: cleanedSubjectIds }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      // Log error details for debugging
      if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
        console.error("[updateSelectiveSubjectsClient] Error response:", {
          status: res.status,
          data,
          sentSubjectIds: cleanedSubjectIds,
        });
      }
      return {
        success: false,
        message: formatApiErrorMessage(
          data,
          "Failed to update selective subjects",
        ),
        content: null,
        code: res.status,
        errors: data.errors,
      };
    }

    return data as UpdateResponse;
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.error("updateSelectiveSubjects error:", err);
    }
    return {
      success: false,
      message: err?.message || "Network error",
      content: null,
      code: 500,
    };
  }
}

// Note: The direct backend functions (with token parameter) are the primary API.
// The Client functions (using internal routes) are kept for backward compatibility.
// For new code, prefer the direct functions when you have access to the token.

// Note: After updating subjects, callers should refresh the user profile
// by calling useAuthStore.getState().hydrate() to ensure auth store
// has the latest subject selections.
