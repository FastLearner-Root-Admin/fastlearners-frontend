/**
 * Profile Management API
 * Handles user profile operations including view, edit, and password change
 */

// Using fetch with credentials for internal API routes

// Profile data interfaces
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string[];
  email_verified_at: string | null;
  phone_verified_at: string | null;
  created_at: string;
  updated_at: string;
  // Guardian-specific fields
  child_email?: string;
  child_phone?: string;
  parent_email?: string | null;
  parent_phone?: string | null;
  avatar?: string | null;
  // Additional fields from API
  username: string | null;
  school: string | null;
  class: string | null;
  discipline: string | null;
  date_of_birth: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  gender: string | null;
  status: string;
  subscription_status?: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  content: {
    user: UserProfile;
  };
}

export interface ProfileEditData {
  name?: string;
  phone?: string;
  role?: "student" | "guest" | "guardian";
  // Required only for guardians
  child_email?: string;
  child_phone?: string;
  parent_email?: string | null;
  parent_phone?: string | null;
  // Additional fields
  username?: string;
  school?: string;
  class?: string;
  discipline?: string;
  date_of_birth?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  gender?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface DeleteAccountRequestResponse {
  success: boolean;
  message: string;
  content: null;
  code: number;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Helper function to normalize avatar URL
 * Converts relative paths from backend to full URLs
 */
const normalizeAvatarUrl = (
  avatarPath: string | null | undefined,
): string | null => {
  if (!avatarPath) return null;

  // If it's already a full URL, return as-is
  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }

  // Get the API base URL from environment variable (required)
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBase) {
    console.error(
      "NEXT_PUBLIC_API_URL is not defined in environment variables",
    );
    return avatarPath; // Return as-is if no base URL configured
  }

  // Remove /api/v1 from the base URL to get the domain root
  const baseUrl = apiBase.replace("/api/v1", "");

  // Remove leading slash from avatar path if present
  const cleanPath = avatarPath.startsWith("/")
    ? avatarPath.slice(1)
    : avatarPath;

  return `${baseUrl}/${cleanPath}`;
};

/**
 * Get current user's profile information
 */
export const getProfile = async (): Promise<UserProfile> => {
  try {
    const response = await fetch("/api/profile", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch profile");
    }

    const data = (await response.json()) as ProfileResponse;

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch profile");
    }

    // Normalize avatar URL if present
    const user = data.content.user;
    if (user.avatar) {
      user.avatar = normalizeAvatarUrl(user.avatar);
    }

    return user;
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error("Failed to fetch profile information");
  }
};

/**
 * Update user profile information
 */
export const updateProfile = async (
  profileData: ProfileEditData,
): Promise<UserProfile> => {
  try {
    const response = await fetch("/api/profile/edit", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (errorData.errors) {
        // Handle validation errors - collect all error messages
        const errors = errorData.errors;
        const errorMessages: string[] = [];

        // Collect all error messages from all fields
        Object.entries(errors).forEach(([field, messages]) => {
          const msgArray = Array.isArray(messages) ? messages : [messages];
          msgArray.forEach((msg) => {
            if (typeof msg === "string") {
              errorMessages.push(`${field}: ${msg}`);
            }
          });
        });

        // Return all error messages joined, or just the first if only one
        if (errorMessages.length > 0) {
          throw new Error(
            errorMessages.length === 1
              ? errorMessages[0]
              : errorMessages.join("\n"),
          );
        }

        throw new Error("Validation failed");
      }

      throw new Error(errorData.message || "Failed to update profile");
    }

    const data = await response.json();

    if (!data.success || !data.content?.user) {
      throw new Error(data.message || "Failed to update profile");
    }

    // Normalize avatar URL if present
    const user = data.content.user as UserProfile;
    if (user.avatar) {
      user.avatar = normalizeAvatarUrl(user.avatar);
    }

    return user;
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error("Failed to update profile");
  }
};

/**
 * Change user password
 * Note: This should be called after email verification for security
 */
export const changePassword = async (
  passwordData: ChangePasswordData,
): Promise<void> => {
  try {
    const response = await fetch("/api/profile/edit/password", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (errorData.errors) {
        // Handle validation errors
        const errors = errorData.errors;
        const firstError = Object.values(errors)[0] as string[];
        throw new Error(firstError[0] || "Validation failed");
      }

      throw new Error(errorData.message || "Failed to change password");
    }

    const data = (await response.json()) as ChangePasswordResponse;

    if (!data.success) {
      throw new Error(data.message || "Failed to change password");
    }

    // Password change successful, no user data returned
    return;
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error("Failed to change password");
  }
};

/**
 * Request to delete user account, or cancel an existing request
 */
export const deleteAccountRequest =
  async (): Promise<DeleteAccountRequestResponse> => {
    try {
      const response = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to process delete account request",
        );
      }

      const data = (await response.json()) as DeleteAccountRequestResponse;

      if (!data.success) {
        throw new Error(
          data.message || "Failed to process delete account request",
        );
      }

      return data;
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      throw new Error("Failed to process delete account request");
    }
  };

/**
 * Get profile metadata (classes, roles, disciplines)
 */
export const getProfileData = async (): Promise<{
  classes: Array<{ name: string }>;
  roles: string[];
  discipline: Array<{ name: string }>;
}> => {
  try {
    const response = await fetch("/api/profile/data", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch profile data");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch profile data");
    }

    return data.content;
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error("Failed to fetch profile metadata");
  }
};

/**
 * Validate profile data before submission
 * Only enforces fields relevant to the current role context
 */
export const validateProfileData = (data: ProfileEditData): string[] => {
  const errors: string[] = [];

  // Basic validations - always required
  if (!data.name?.trim()) {
    errors.push("Name is required");
  }

  // Phone format validation if provided (not universally required)
  // Let backend handle nuanced requirements

  // Role validation - only for student/guardian (not guest)
  if (data.role && !["student", "guardian"].includes(data.role)) {
    errors.push("Role must be student or guardian");
  }

  // Student-specific validations (only if role is student)
  if (data.role === "student") {
    if (!data.parent_email?.trim()) {
      errors.push("Parent email is required for students to process consent");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.parent_email)) {
      errors.push("Please enter a valid parent email address");
    }
  }

  // Guardian-specific validation (only if role is guardian)
  if (data.role === "guardian") {
    if (
      data.child_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.child_email)
    ) {
      errors.push("Please enter a valid child email address");
    }
    // Let backend enforce required fields for guardians
  }

  // Format validations for optional fields (only if provided)
  if (
    data.discipline &&
    !["Art", "Commercial", "Science"].includes(data.discipline)
  ) {
    errors.push("Discipline must be Art, Commercial, or Science");
  }

  if (
    data.class &&
    !["JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3"].includes(data.class)
  ) {
    errors.push("Class must be JSS1-JSS3 or SSS1-SSS3");
  }

  if (
    data.date_of_birth &&
    !/^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/.test(data.date_of_birth)
  ) {
    errors.push("Date of birth must be in DD/MM/YYYY or YYYY-MM-DD format");
  }

  if (data.gender && !["male", "female"].includes(data.gender)) {
    errors.push("Gender must be male or female");
  }

  return errors;
};

/**
 * Validate password change data
 */
export const validatePasswordData = (data: ChangePasswordData): string[] => {
  const errors: string[] = [];

  if (!data.current_password) {
    errors.push("Current password is required");
  }

  if (!data.new_password) {
    errors.push("New password is required");
  } else if (data.new_password.length < 8) {
    errors.push("New password must be at least 8 characters long");
  }

  if (!data.new_password_confirmation) {
    errors.push("Password confirmation is required");
  } else if (data.new_password !== data.new_password_confirmation) {
    errors.push("New password and confirmation do not match");
  }

  if (data.current_password === data.new_password) {
    errors.push("New password must be different from current password");
  }

  return errors;
};

/**
 * Check if a username is available
 */
export const checkUsernameAvailability = async (
  username: string,
): Promise<{ available: boolean; message?: string }> => {
  try {
    if (!username || username.trim().length === 0) {
      return { available: false, message: "Username cannot be empty" };
    }

    const response = await fetch(
      `/api/profile/check-username/${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        available: false,
        message: errorData.message || "Failed to check username availability",
      };
    }

    const data = await response.json();

    // The API proxy now returns 200 OK for both available and unavailable outcomes
    // with success: true for available, success: false for unavailable.
    // Content will have { is_available: boolean, username: string }

    if (data.success) {
      return {
        available: true,
        message: data.content?.username || "Username is available",
      };
    } else {
      return {
        available: false,
        message:
          data.message || data.content?.username || "Username is not available",
      };
    }
  } catch (error: any) {
    return {
      available: false,
      message: error.message || "Failed to check username availability",
    };
  }
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (file: File): Promise<string> => {
  try {
    // Client-side validation
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed.",
      );
    }

    if (file.size > 1048576) {
      // 1MB
      throw new Error("File size must be less than 1MB.");
    }

    const formData = new FormData();
    formData.append("profile_picture", file);

    const response = await fetch("/api/profile/edit/profile-picture", {
      method: "POST",
      credentials: "include",
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (errorData.errors) {
        const errors = errorData.errors;
        const firstError = Object.values(errors)[0] as string[];
        throw new Error(firstError[0] || "Upload failed");
      }

      throw new Error(errorData.message || "Failed to upload profile picture");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to upload profile picture");
    }

    // According to API docs, content can be null.
    // If we have an avatar in the response, use it.
    // Otherwise, fetch the updated profile to get the new avatar URL.
    let avatarUrl: string | null = null;

    if (data.content?.avatar) {
      avatarUrl = normalizeAvatarUrl(data.content.avatar);
    }

    // Fallback: if no avatar in response or normalization failed (shouldn't happen for valid string), fetch profile
    if (!avatarUrl) {
      try {
        const userProfile = await getProfile();
        avatarUrl = userProfile.avatar || null;
      } catch (fetchError) {
        console.error(
          "Failed to fetch updated profile after upload:",
          fetchError,
        );
        // If we can't fetch the profile, we can't return the new URL.
        // But the upload WAS successful.
        // We might return null or throw.
        // Since the function signature allows returning string, let's assume getProfile works or throw.
        throw new Error(
          "Profile picture uploaded, but failed to retrieve new image URL.",
        );
      }
    }

    if (!avatarUrl) {
      throw new Error("Failed to get avatar URL from server");
    }

    return avatarUrl;
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error("Failed to upload profile picture");
  }
};
