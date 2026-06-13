/**
 * Dashboard API
 * Handles fetching student dashboard data
 */

export interface DashboardProgress {
  subject: string;
  covered: number;
  left: number;
}

export interface DashboardContent {
  name: string;
  cards?: {
    class?: string;
    total_subjects?: number | string;
    subscription?: {
      status?: string | null;
      expires_at?: string | null;
      days_remaining?: number | string | null;
    } | null;
    account_status?: string | null;
  };
  lessons_covered?: number | string;
  total_lessons?: number | string;
  subjects?: string;
  lessons?: string;
  progress?: DashboardProgress;
  quizzes?: string;
  subscription_status?: string;
  account_status?: string;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  content: DashboardContent;
  code: number;
}

export interface GuardianDashboardContent {
  children: number;
  active_children: number;
  active_subscriptions: number;
  account_status: string;
  reports: any[];
}

export interface GuardianDashboardResponse {
  success: boolean;
  message: string;
  content: GuardianDashboardContent;
  code: number;
}

/**
 * Get student dashboard data
 */
export async function getDashboard(): Promise<DashboardResponse> {
  try {
    const response = await fetch("/api/dashboard", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch dashboard",
        content: {
          name: "",
          cards: {
            total_subjects: 0,
            subscription: { status: "inactive" },
            account_status: "",
          },
          lessons_covered: 0,
          total_lessons: 0,
          subjects: "",
          lessons: "",
          progress: {
            subject: "",
            covered: 0,
            left: 0,
          },
          quizzes: "",
          subscription_status: "",
          account_status: "",
        },
        code: response.status,
      };
    }

    return data as DashboardResponse;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Network error",
      content: {
        name: "",
        cards: {
          total_subjects: 0,
          subscription: { status: "inactive" },
          account_status: "",
        },
        lessons_covered: 0,
        total_lessons: 0,
        subjects: "",
        lessons: "",
        progress: {
          subject: "",
          covered: 0,
          left: 0,
        },
        quizzes: "",
        subscription_status: "",
        account_status: "",
      },
      code: 500,
    };
  }
}

/**
 * Get guardian dashboard data
 */
export async function getGuardianDashboard(): Promise<GuardianDashboardResponse> {
  try {
    const response = await fetch("/api/guardian", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch guardian dashboard",
        content: {
          children: 0,
          active_children: 0,
          active_subscriptions: 0,
          account_status: "",
          reports: [],
        },
        code: response.status,
      };
    }

    return data as GuardianDashboardResponse;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Network error",
      content: {
        children: 0,
        active_children: 0,
        active_subscriptions: 0,
        account_status: "",
        reports: [],
      },
      code: 500,
    };
  }
}
