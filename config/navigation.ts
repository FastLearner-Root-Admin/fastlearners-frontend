import { SidebarNavItem } from "@/types";

import { UserRole } from "@/lib/types/auth";

/**
 * Unified Navigation Configuration
 * Based on role-aware navigation system design
 */

export interface QuickAction {
  title: string;
  icon: string;
  href: string;
  description: string;
}

export interface RoleNavigationConfig {
  role: UserRole;
  sidebarSections: SidebarNavItem[];
  quickActions: QuickAction[];
  topbarActions?: {
    primary?: QuickAction;
    secondary?: QuickAction[];
  };
}

/**
 * Navigation configuration for each user role
 */
export const roleNavigationConfig: Record<UserRole, RoleNavigationConfig> = {
  guest: {
    role: "guest",
    sidebarSections: [
      {
        title: "EXPLORE",
        items: [
          {
            href: "/",
            icon: "home",
            title: "Home",
          },
          {
            href: "/explore",
            icon: "compass",
            title: "Explore Lessons",
          },
          {
            href: "/about",
            icon: "info",
            title: "About",
          },
        ],
      },
      {
        title: "GET STARTED",
        items: [
          {
            href: "/auth/login",
            icon: "logIn",
            title: "Login",
          },
          {
            href: "/auth/register",
            icon: "userPlus",
            title: "Register",
          },
        ],
      },
    ],
    quickActions: [
      {
        title: "Sign Up",
        icon: "userPlus",
        href: "/auth/register",
        description: "Create your account",
      },
    ],
  },

  student: {
    role: "student",
    sidebarSections: [
      {
        title: "MAIN",
        items: [
          {
            href: "/dashboard",
            icon: "home",
            title: "Dashboard",
            description: "Overview of your learning progress",
          },
          {
            href: "/dashboard/subjects",
            icon: "bookOpen",
            title: "Subjects",
            description: "Browse all subjects and schemes of work",
          },
          {
            href: "/dashboard/lessons",
            icon: "graduationCap",
            title: "Lessons",
            description: "Continue your learning journey",
          },
          {
            href: "/dashboard/quizzes",
            icon: "helpCircle",
            title: "Quizzes",
            description: "Take quizzes and assessments",
          },
          {
            href: "/dashboard/past-questions",
            icon: "fileText",
            title: "Past Questions",
            description: "Practice with previous exam questions",
          },
          {
            href: "/dashboard/records",
            icon: "folder",
            title: "Records",
            description: "View your academic records and reports",
          },
        ],
      },
      {
        title: "FAMILY",
        items: [
          {
            href: "/dashboard/guardians",
            icon: "shield",
            title: "Guardians",
            description: "Manage guardian requests",
          },
        ],
      },
      {
        title: "SUBSCRIPTIONS",
        items: [
          { href: "/dashboard/subscriptions", icon: "package", title: "Plans", description: "Browse subscription plans" },
          { href: "/dashboard/subscriptions/transactions", icon: "fileText", title: "Transactions", description: "View your payment history" },
          { href: "/dashboard/subscriptions/history", icon: "folder", title: "Subscription History", description: "View your active and past subscriptions" },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          {
            href: "/dashboard/settings",
            icon: "settings",
            title: "Settings",
          },
          {
            href: "/dashboard/billing",
            icon: "creditCard",
            title: "Billing",
          },
        ],
      },
    ],
    quickActions: [
      {
        title: "Take Quiz",
        icon: "play",
        href: "/dashboard/quizzes/available",
        description: "Start a new quiz",
      },
      {
        title: "Continue Learning",
        icon: "bookOpen",
        href: "/dashboard/lessons/continue",
        description: "Resume where you left off",
      },
    ],
    topbarActions: {
      primary: {
        title: "Join Quiz",
        icon: "play",
        href: "/dashboard/quizzes/join",
        description: "Join an active quiz",
      },
    },
  },

  guardian: {
    role: "guardian",
    sidebarSections: [
      {
        title: "OVERVIEW",
        items: [
          {
            href: "/dashboard",
            icon: "dashboard",
            title: "Dashboard",
          },
          {
            href: "/dashboard/children",
            icon: "users",
            title: "My Children",
            description: "Manage child monitoring requests",
          },
        ],
      },
      {
        title: "MONITORING",
        items: [
          // TODO: Add child-specific report endpoints when backend supports it
          {
            href: "/dashboard/records",
            icon: "folder",
            title: "Records",
            description: "View child's academic records and reports",
          },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          {
            href: "/dashboard/settings",
            icon: "settings",
            title: "Settings",
          },
          {
            href: "/dashboard/billing",
            icon: "creditCard",
            title: "Billing",
          },
        ],
      },
    ],
    quickActions: [
      {
        title: "View Reports",
        icon: "barChart3",
        href: "/dashboard/records",
        description: "Check child's progress",
      },
    ],
    topbarActions: {
      primary: {
        title: "Child Reports",
        icon: "barChart3",
        href: "/dashboard/records",
        description: "Quick access to reports",
      },
    },
  },

  teacher: {
    role: "teacher",
    sidebarSections: [
      {
        title: "OVERVIEW",
        items: [
          {
            href: "/dashboard",
            icon: "dashboard",
            title: "Dashboard",
          },
          {
            href: "/dashboard/teacher/classes",
            icon: "users",
            title: "My Classes",
          },
        ],
      },
      {
        title: "CONTENT",
        items: [
          {
            href: "/dashboard/teacher/lessons",
            icon: "bookOpen",
            title: "Manage Lessons",
          },
          {
            href: "/dashboard/teacher/quizzes",
            icon: "helpCircle",
            title: "Quizzes",
          },
          {
            href: "/dashboard/teacher/assignments",
            icon: "clipboard",
            title: "Assignments",
          },
        ],
      },
      {
        title: "ANALYTICS",
        items: [
          {
            href: "/dashboard/teacher/reports",
            icon: "barChart3",
            title: "Class Reports",
          },
          {
            href: "/dashboard/teacher/performance",
            icon: "trendingUp",
            title: "Performance Analytics",
          },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          {
            href: "/dashboard/teacher/settings",
            icon: "settings",
            title: "Settings",
          },
          {
            href: "/dashboard/teacher/billing",
            icon: "creditCard",
            title: "Billing",
          },
        ],
      },
    ],
    quickActions: [
      {
        title: "Upload Lesson",
        icon: "upload",
        href: "/dashboard/teacher/lessons/upload",
        description: "Add new lesson content",
      },
      {
        title: "Create Quiz",
        icon: "plus",
        href: "/dashboard/teacher/quizzes/create",
        description: "Create a new quiz",
      },
    ],
    topbarActions: {
      primary: {
        title: "+ Lesson Upload",
        icon: "upload",
        href: "/dashboard/teacher/lessons/upload",
        description: "Quick lesson upload",
      },
      secondary: [
        {
          title: "Create Quiz",
          icon: "plus",
          href: "/dashboard/teacher/quizzes/create",
          description: "New quiz",
        },
      ],
    },
  },

  admin: {
    role: "admin",
    sidebarSections: [
      {
        title: "OVERVIEW",
        items: [
          {
            href: "/dashboard",
            icon: "dashboard",
            title: "Dashboard",
          },
          {
            href: "/dashboard/admin/analytics",
            icon: "barChart3",
            title: "Analytics",
          },
        ],
      },
      {
        title: "MANAGEMENT",
        items: [
          {
            href: "/dashboard/admin/users",
            icon: "users",
            title: "User Management",
          },
          {
            href: "/dashboard/admin/classes",
            icon: "school",
            title: "Classes & Groups",
          },
          {
            href: "/dashboard/admin/content",
            icon: "fileText",
            title: "Content Management",
          },
        ],
      },
      {
        title: "REPORTS",
        items: [
          {
            href: "/dashboard/admin/reports",
            icon: "pieChart",
            title: "System Reports",
          },
          {
            href: "/dashboard/admin/performance",
            icon: "trendingUp",
            title: "Performance Analytics",
          },
        ],
      },
      {
        title: "SYSTEM",
        items: [
          {
            href: "/dashboard/admin/settings",
            icon: "settings",
            title: "School Settings",
          },
          {
            href: "/dashboard/admin/billing",
            icon: "creditCard",
            title: "Billing",
          },
        ],
      },
    ],
    quickActions: [
      {
        title: "Add User",
        icon: "userPlus",
        href: "/dashboard/admin/users/create",
        description: "Create new user account",
      },
      {
        title: "View Reports",
        icon: "barChart3",
        href: "/dashboard/admin/reports",
        description: "System analytics",
      },
    ],
    topbarActions: {
      primary: {
        title: "+ User",
        icon: "userPlus",
        href: "/dashboard/admin/users/create",
        description: "Add new user",
      },
    },
  },

  superadmin: {
    role: "superadmin",
    sidebarSections: [
      {
        title: "OVERVIEW",
        items: [
          {
            href: "/dashboard",
            icon: "dashboard",
            title: "Dashboard",
          },
          {
            href: "/dashboard/superadmin/analytics",
            icon: "barChart3",
            title: "Global Analytics",
          },
        ],
      },
      {
        title: "ADMINISTRATION",
        items: [
          {
            href: "/dashboard/superadmin/roles",
            icon: "shield",
            title: "Role Management",
          },
          {
            href: "/dashboard/superadmin/users",
            icon: "users",
            title: "User Management",
          },
          {
            href: "/dashboard/superadmin/schools",
            icon: "building",
            title: "School Management",
          },
        ],
      },
      {
        title: "CONTENT",
        items: [
          {
            href: "/dashboard/superadmin/lessons",
            icon: "bookOpen",
            title: "Global Content",
          },
          {
            href: "/dashboard/superadmin/curriculum",
            icon: "graduationCap",
            title: "Curriculum Management",
          },
          {
            href: "/dashboard/superadmin/packages",
            icon: "package",
            title: "Packages",
          },
          {
            href: "/dashboard/superadmin/coupons",
            icon: "ticket",
            title: "Coupons",
          },
          {
            href: "/dashboard/superadmin/sponsors",
            icon: "gift",
            title: "Sponsors",
          },
          {
            href: "/dashboard/superadmin/vouchers",
            icon: "qrCode",
            title: "Vouchers",
          },
        ],
      },
      {
        title: "SYSTEM",
        items: [
          {
            href: "/dashboard/superadmin/billing",
            icon: "creditCard",
            title: "Billing & Subscriptions",
          },
          {
            href: "/dashboard/superadmin/settings",
            icon: "settings",
            title: "System Settings",
          },
          {
            href: "/dashboard/superadmin/logs",
            icon: "fileText",
            title: "System Logs",
          },
          {
            href: "/dashboard/api-test",
            icon: "settings",
            title: "API Testing",
            description: "Test API connectivity and endpoints",
          },
        ],
      },
    ],
    quickActions: [
      {
        title: "System Settings",
        icon: "settings",
        href: "/dashboard/superadmin/settings",
        description: "Global system configuration",
      },
      {
        title: "User Management",
        icon: "users",
        href: "/dashboard/superadmin/users",
        description: "Manage all users",
      },
    ],
    topbarActions: {
      primary: {
        title: "System Settings",
        icon: "settings",
        href: "/dashboard/superadmin/settings",
        description: "Quick settings access",
      },
    },
  },
};

/**
 * Global navigation items that appear for all authenticated users
 */
export const globalNavItems: SidebarNavItem[] = [
  {
    title: "SUPPORT",
    items: [
      {
        href: "/docs",
        icon: "bookOpen",
        title: "Documentation",
      },
      {
        href: "/support",
        icon: "helpCircle",
        title: "Support",
      },
      {
        href: "/",
        icon: "home",
        title: "Homepage",
      },
    ],
  },
];

/**
 * Get navigation configuration for a specific role
 */
export function getNavigationForRole(role: UserRole): RoleNavigationConfig {
  return roleNavigationConfig[role] || roleNavigationConfig.guest;
}

/**
 * Get complete sidebar configuration for a role (includes global items)
 */
export function getSidebarConfig(role: UserRole): SidebarNavItem[] {
  const roleConfig = getNavigationForRole(role);

  // For guests, don't add global items
  if (role === "guest") {
    return roleConfig.sidebarSections;
  }

  // For authenticated users, combine role-specific + global
  return [...roleConfig.sidebarSections, ...globalNavItems];
}

/**
 * Get quick actions for a role
 */
export function getQuickActions(role: UserRole): QuickAction[] {
  const roleConfig = getNavigationForRole(role);
  return roleConfig.quickActions;
}

/**
 * Get topbar actions for a role
 */
export function getTopbarActions(role: UserRole) {
  const roleConfig = getNavigationForRole(role);
  return roleConfig.topbarActions;
}
