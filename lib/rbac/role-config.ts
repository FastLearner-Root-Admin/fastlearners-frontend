import { User, UserRole } from "@/lib/types/auth";
import { isProfileComplete } from "@/lib/utils/profile-completion";
import { getPrimaryRole } from "@/lib/utils/roles";

/**
 * Single source of truth for role-based routing and access control
 */

export interface RoleConfig {
  homeRoute: string;
  allowedRoutes: string[];
  restrictedRoutes: string[];
  requiresOnboarding: boolean;
  canSwitchRoles: boolean;
  assignedBy?: UserRole[];
}

export const ROLE_CONFIGURATIONS: Record<UserRole, RoleConfig> = {
  guest: {
    homeRoute: "/onboarding",
    allowedRoutes: [
      "/auth/login",
      "/auth/register",
      "/auth/set-role",
      "/onboarding",
      "/onboarding/complete-profile",
      "/auth",
      "/auth/role", // Role selection during onboarding (legacy)
      "/role", // Role selection during onboarding (legacy)
      "/dashboard/settings", // Allow guests to access settings
    ],
    restrictedRoutes: ["/dashboard", "/superadmin", "/admin", "/teacher"],
    requiresOnboarding: true,
    canSwitchRoles: true, // Can choose student or guardian once
  },

  student: {
    homeRoute: "/dashboard",
    allowedRoutes: [
      "/dashboard",
      "/dashboard/settings",
      "/dashboard/lessons",
      "/dashboard/quizzes",
      "/dashboard/past-questions",
      "/dashboard/records",
      "/lessons",
      "/exercises",
      "/profile",
      // Onboarding access is permitted only while profile is incomplete, enforced by RBACUtils.canAccessRoute()
      "/onboarding",
      "/onboarding/complete-profile",
    ],
    restrictedRoutes: ["/superadmin", "/admin", "/teacher"],
    requiresOnboarding: false,
    canSwitchRoles: false, // Permanent choice - can only switch from Guest → Student once
  },

  guardian: {
    homeRoute: "/dashboard",
    allowedRoutes: [
      "/dashboard",
      "/dashboard/settings",
      "/dashboard/records",
      "/progress", // View children's progress
      "/profile",
      "/guardian-tools",
      // Onboarding access is permitted only while profile is incomplete, enforced by RBACUtils.canAccessRoute()
      "/onboarding",
      "/onboarding/complete-profile",
    ],
    restrictedRoutes: ["/superadmin", "/admin", "/teacher"],
    requiresOnboarding: false,
    canSwitchRoles: false, // Permanent choice - can only switch from Guest → Guardian once
  },

  teacher: {
    homeRoute: "/dashboard/teacher/lessons",
    allowedRoutes: [
      "/dashboard/teacher",
      "/dashboard",
      "/dashboard/settings",
      "/teacher",
      "/lessons",
      "/uploads",
      "/profile",
    ],
    restrictedRoutes: ["/superadmin", "/admin", "/onboarding"],
    requiresOnboarding: false,
    canSwitchRoles: false,
    assignedBy: ["superadmin"], // Must be assigned manually by superadmin
  },

  admin: {
    homeRoute: "/dashboard/admin/charts",
    allowedRoutes: [
      "/dashboard/admin",
      "/dashboard",
      "/dashboard/settings",
      "/admin",
      "/users",
      "/reports",
      "/lessons", // Can view lessons
      "/profile",
    ],
    restrictedRoutes: [
      "/superadmin",
      "/teacher", // Admin cannot access teacher-specific routes
      "/onboarding",
    ],
    requiresOnboarding: false,
    canSwitchRoles: false,
    assignedBy: ["superadmin"], // Must be assigned manually by superadmin
  },

  superadmin: {
    homeRoute: "/dashboard/superadmin",
    allowedRoutes: [
      "/dashboard/superadmin",
      "/dashboard",
      "/dashboard/settings",
      "/superadmin",
      "/users",
      "/lessons",
      "/uploads",
      "/reports",
      "/settings",
      "/profile",
    ],
    restrictedRoutes: [],
    requiresOnboarding: false,
    canSwitchRoles: false,
    assignedBy: ["superadmin"], // Only superadmin can create other superadmins
  },
};

/**
 * Role hierarchy for access control
 * Higher roles inherit permissions from lower roles
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  student: 1,
  guardian: 1,
  teacher: 2,
  admin: 3,
  superadmin: 4,
};

/**
 * Routes that require specific permissions
 */
export const PROTECTED_ROUTE_PATTERNS = {
  // Superadmin only
  SUPERADMIN: [
    "/admin/roles",
    "/admin/users/assign-roles",
    "/admin/system-config",
  ],

  // Admin and above
  ADMIN: [
    "/admin/users",
    "/admin/classes",
    "/admin/reports",
    "/dashboard/admin/lessons",
  ],

  // Teacher and above
  TEACHER: [
    "/admin/lessons",
    "/teacher/create",
    "/teacher/evaluate",
    "/dashboard/lessons",
  ],

  // Student/Guardian specific
  STUDENT: ["/dashboard/exercises", "/dashboard/progress"],

  GUARDIAN: ["/guardian/children", "/guardian/reports"],
};

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/create-password",
  "/auth/set-role",
  "/auth/role", // Legacy
  "/parental-consent",
];

/**
 * Routes that should redirect authenticated users
 */
export const AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/create-password",
  // role selection is allowed for guest only; middleware handles guest exception
];

/**
 * Utility functions for role-based access control
 */
export class RBACUtils {
  /**
   * Check if a user can access a specific route
   */
  static canAccessRoute(user: User | null, route: string): boolean {
    if (!user) return false;
    const userRole = getPrimaryRole(user);

    if (!userRole) {
      console.warn("Invalid or missing user role array in canAccessRoute");
      return false;
    }

    // Special handling for onboarding routes
    if (route.startsWith("/onboarding")) {
      // Only allow guest, student, and guardian (when incomplete) to access onboarding
      if (
        userRole === "guest" ||
        userRole === "student" ||
        userRole === "guardian"
      ) {
        if (userRole === "guest") return true;
        return !isProfileComplete(user);
      }
      // For admin, teacher, and superadmin, respect restrictedRoutes
      return false;
    }

    const config = ROLE_CONFIGURATIONS[userRole];

    // Superadmin can access everything
    if (userRole === "superadmin") {
      return true;
    }

    // Check if route is explicitly restricted
    if (
      config.restrictedRoutes.some((restrictedRoute) =>
        route.startsWith(restrictedRoute),
      )
    ) {
      return false;
    }

    // Check if route is explicitly allowed
    if (
      config.allowedRoutes.some((allowedRoute) =>
        route.startsWith(allowedRoute),
      )
    ) {
      return true;
    }

    // Check protected route patterns
    for (const [permission, patterns] of Object.entries(
      PROTECTED_ROUTE_PATTERNS,
    )) {
      const matchesPattern = patterns.some((pattern) =>
        route.startsWith(pattern),
      );
      if (matchesPattern) {
        return this.hasPermission(
          userRole,
          permission as keyof typeof PROTECTED_ROUTE_PATTERNS,
        );
      }
    }

    return false;
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(
    userRole: UserRole,
    permission: keyof typeof PROTECTED_ROUTE_PATTERNS,
  ): boolean {
    const userLevel = ROLE_HIERARCHY[userRole];

    switch (permission) {
      case "SUPERADMIN":
        return userLevel >= ROLE_HIERARCHY.superadmin;
      case "ADMIN":
        return userLevel >= ROLE_HIERARCHY.admin;
      case "TEACHER":
        return userLevel >= ROLE_HIERARCHY.teacher;
      case "STUDENT":
        return userRole === "student" || userLevel >= ROLE_HIERARCHY.teacher;
      case "GUARDIAN":
        return userRole === "guardian" || userLevel >= ROLE_HIERARCHY.admin;
      default:
        return false;
    }
  }

  /**
   * Get the correct home route for a user role
   */
  static getHomeRoute(userRole: UserRole | undefined | null): string {
    // Default to guest if role is undefined or null (fallback for when role fetch fails in middleware)
    if (!userRole) {
      console.log(
        `Role fetch failed or undefined, falling back to guest home route: ${ROLE_CONFIGURATIONS.guest.homeRoute}`,
      );
      return ROLE_CONFIGURATIONS.guest.homeRoute;
    }

    // Check if the role exists in configurations
    if (!ROLE_CONFIGURATIONS[userRole]) {
      console.warn(`Unknown role "${userRole}", defaulting to guest route`);
      console.log(
        `Invalid role encountered: ${userRole}, falling back to guest home route`,
      );
      return ROLE_CONFIGURATIONS.guest.homeRoute;
    }

    return ROLE_CONFIGURATIONS[userRole].homeRoute;
  }

  /**
   * Check if user needs onboarding
   */
  static requiresOnboarding(userRole: UserRole): boolean {
    return ROLE_CONFIGURATIONS[userRole].requiresOnboarding;
  }

  /**
   * Check if user can switch roles
   */
  static canSwitchRoles(userRole: UserRole): boolean {
    return ROLE_CONFIGURATIONS[userRole].canSwitchRoles;
  }

  /**
   * Get roles that can assign a specific role
   */
  static getAssignmentRoles(targetRole: UserRole): UserRole[] {
    return ROLE_CONFIGURATIONS[targetRole].assignedBy || [];
  }

  /**
   * Validate if current user can assign target role
   */
  static canAssignRole(
    currentUserRole: UserRole,
    targetRole: UserRole,
  ): boolean {
    const assignmentRoles = this.getAssignmentRoles(targetRole);
    return (
      assignmentRoles.length === 0 || assignmentRoles.includes(currentUserRole)
    );
  }
}
