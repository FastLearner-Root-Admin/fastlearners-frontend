import { create } from "zustand";

import { authApi } from "@/lib/api/auth";
import {
  LoginCredentials,
  ProfileStatus,
  User,
  UserRole,
} from "@/lib/types/auth";
import {
  calculateProfileCompletion,
  getMissingFields,
  isProfileComplete,
} from "@/lib/utils/profile-completion";
import { resetAnalytics } from "@/lib/analytics/posthog";

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean; // Track if store has been rehydrated from localStorage
  isHydrating: boolean; // Track if hydration is in progress
  academicFieldsChanged: boolean; // Flag to indicate if academic fields have changed

  // Actions
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  hydrate: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: (data: {
    user: User;
    access_token: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => void;
  clearError: () => void;

  // Profile completion helpers
  getProfileStatus: () => ProfileStatus;
  isProfileComplete: () => boolean;
  getProfileCompletionPercentage: () => number;
  getMissingProfileFields: () => string[];
  canAccessFeature: (feature: string) => boolean;

  // Role-based helpers
  hasRole: (role: UserRole) => boolean;
  isPrimaryRole: (role: UserRole) => boolean;
  isGuest: () => boolean;
  canChangeRole: () => boolean;

  // Academic fields change helper
  hasAcademicFieldsChanged: (updates: Partial<User>) => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  // Initial state - start with null/false on both server and client
  user: null,
  isAuthenticated: false,
  isLoading: false, // Start with loading false to prevent premature loading state
  error: null,
  isHydrated: false, // Set to false initially
  isHydrating: false,
  academicFieldsChanged: false, // Initial flag

  // Actions
  setUser: (user: User) => {
    set({ user, isAuthenticated: true, error: null });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),

  hydrate: () => {
    // Prevent duplicate hydration if already hydrated or currently hydrating
    const state = get();
    if (
      state.isHydrated ||
      state.isHydrating ||
      typeof window === "undefined"
    ) {
      return;
    }

    set({ isHydrating: true });

    const useHttpOnly = process.env.NEXT_PUBLIC_USE_HTTPONLY_AUTH !== "false"; // default to true
    if (useHttpOnly) {
      // Fetch session from server (HttpOnly cookies) with timeout and retry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

      const attemptFetch = async (attempt: number = 0): Promise<void> => {
        const maxAttempts = 2;
        const backoffDelays = [300, 900]; // ms

        try {
          const response = await fetch("/api/auth/session", {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            // Handle specific error codes
            if (
              data.code === "NO_AUTH_COOKIES" ||
              data.code === "TOKEN_EXPIRED"
            ) {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isHydrated: true,
                isHydrating: false,
              });
              return;
            }
            throw new Error(data.message || "No session");
          }

          const data = await response.json();
          set({
            user: data.user || null,
            isAuthenticated: Boolean(data.user),
            isLoading: false,
            isHydrated: true,
            isHydrating: false,
          });
        } catch (error: any) {
          clearTimeout(timeoutId);

          // Retry with exponential backoff
          if (attempt < maxAttempts && !controller.signal.aborted) {
            const delay = backoffDelays[attempt] || 900;
            if (process.env.NODE_ENV !== "production") {
              console.warn(
                `Auth hydration attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
                error,
              );
            }
            setTimeout(() => attemptFetch(attempt + 1), delay);
            return;
          }

          // Final failure - set hydrated state to prevent blocking
          if (process.env.NODE_ENV !== "production") {
            // Ignore AbortError if it was caused by us or React strict mode unmounting
            if (error.name !== "AbortError") {
              console.warn("Auth hydration failed after retries:", error);
            }
          }
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isHydrated: true,
            isHydrating: false,
          });
        }
      };

      attemptFetch();
    } else {
      // Dev-only fallback: no-op path that sets unauthenticated state
      if (process.env.NODE_ENV !== "production") {
        console.warn("HttpOnly auth is disabled. This is a dev-only fallback.");
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isHydrated: true,
        isHydrating: false,
      });
    }
  },

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });

      // Always use server route to set HttpOnly cookies
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await r.json();

      if (r.ok && data?.user) {
        set({ user: data.user, isAuthenticated: true, error: null });
        return;
      }

      // Handle error responses
      const errorMessage = data?.message || "Login failed";
      set({ error: errorMessage, isAuthenticated: false, user: null });

      // Throw error with redirect info if present (for unverified users)
      if (data?.redirect) {
        throw { message: errorMessage, redirect: data.redirect };
      }

      throw new Error(errorMessage);
    } catch (error: any) {
      let errorMessage = "An error occurred during login";

      if (error && typeof error === "object") {
        if (error.message) {
          errorMessage = error.message;
        }
        // Preserve redirect info if present
        if (error.redirect) {
          set({ error: errorMessage, isAuthenticated: false, user: null });
          throw error; // Throw the full error object with redirect
        }
      }

      set({
        error: errorMessage,
        isAuthenticated: false,
        user: null,
      });

      throw new Error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async (data: { user: User; access_token: string }) => {
    try {
      set({ isLoading: true, error: null });

      set({
        user: data.user,
        isAuthenticated: true,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.message || "Google authentication failed";

      set({
        error: errorMessage,
        isAuthenticated: false,
        user: null,
      });

      throw new Error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      resetAnalytics();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  updateUserProfile: (updates: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const hasChanged = get().hasAcademicFieldsChanged(updates);
      if (hasChanged) {
        set({ academicFieldsChanged: true });
      }
      const updatedUser = { ...currentUser, ...updates };
      get().setUser(updatedUser);
      // Clear banner dismissal to ensure banner reappears if profile becomes incomplete
      if (typeof window !== "undefined" && updatedUser.id) {
        localStorage.removeItem(
          `profile-completion-banner-dismissed-${updatedUser.id}`,
        );
      }
    }
  },

  clearError: () => set({ error: null }),

  // Profile completion helpers
  getProfileStatus: (): ProfileStatus => {
    const user = get().user;
    if (!user) return "guest";

    const percentage = calculateProfileCompletion(user);
    if (percentage <= 20) return "guest";
    if (percentage <= 40) return "basic_complete";
    if (percentage <= 60) return "role_selected";
    if (percentage <= 80) return "role_details_complete";
    return "complete";
  },

  isProfileComplete: (): boolean => {
    const user = get().user;
    return user ? isProfileComplete(user) : false;
  },

  getProfileCompletionPercentage: (): number => {
    const user = get().user;
    return user ? calculateProfileCompletion(user) : 0;
  },

  getMissingProfileFields: (): string[] => {
    const user = get().user;
    return user ? getMissingFields(user) : [];
  },

  canAccessFeature: (feature: string): boolean => {
    const user = get().user;
    if (!user) return false;

    const isGuest = user.role[0] === "guest";

    const restrictedFeatures = [
      "submit_assignment",
      "take_quiz",
      "save_progress",
      "make_purchase",
      "access_personalized_content",
      "participate_in_discussions",
      "access_courses",
      "access_activities",
      "access_progress",
      "premium_content",
    ];

    if (isGuest && restrictedFeatures.includes(feature)) {
      return false;
    }

    return true;
  },

  // Role-based helpers
  hasRole: (role: UserRole): boolean => {
    const user = get().user;
    return user ? user.role.includes(role) : false;
  },

  isPrimaryRole: (role: UserRole): boolean => {
    const user = get().user;
    return user ? user.role[0] === role : false;
  },

  isGuest: (): boolean => {
    return get().isPrimaryRole("guest");
  },

  canChangeRole: (): boolean => {
    const user = get().user;
    if (!user) return false;

    // Only guests can change their role (during onboarding)
    // Once a user has selected student or guardian, they cannot change
    return user.role[0] === "guest";
  },

  hasAcademicFieldsChanged: (updates: Partial<User>): boolean => {
    const user = get().user;
    if (!user) return false;

    return (
      Boolean(updates.class && updates.class !== user.class) ||
      Boolean(updates.discipline && updates.discipline !== user.discipline) ||
      Boolean(updates.role && updates.role[0] !== user.role[0])
    );
  },
}));

// Access control checker function
export const checkGuestAccess = (
  action: string,
  user: User | null,
): boolean => {
  if (!user || user.role[0] !== "guest") return true;

  const restrictedActions = [
    "submit_assignment",
    "take_quiz",
    "save_progress",
    "make_purchase",
    "access_personalized_content",
    "participate_in_discussions",
  ];

  return !restrictedActions.includes(action);
};

// Role-based routing helper (now uses RBAC utilities)
export const getRoleBasedRoute = (user: User | null): string => {
  if (!user) return "/auth/login";

  // Import RBAC utilities dynamically to avoid circular dependency
  const { RBACUtils } = require("@/lib/rbac/role-config");
  return RBACUtils.getHomeRoute(user.role[0]);
};

// Cookie-based auth store doesn't need manual initialization
// State is loaded directly from cookies in the initial state
