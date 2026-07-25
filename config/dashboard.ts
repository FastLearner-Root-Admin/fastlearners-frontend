import { UserRole } from "@/types";
import type { SidebarNavItem } from "@/types";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "MENU",
    items: [
      // Unified Dashboard for Students & Guardians
      {
        href: "/dashboard",
        icon: "home",
        title: "Dashboard",
        authorizeOnly: UserRole.STUDENT,
      },
      {
        href: "/dashboard/subjects",
        icon: "bookOpen",
        title: "Subjects",
        authorizeOnly: UserRole.STUDENT,
      },
      {
        href: "/dashboard/lessons",
        icon: "graduationCap",
        title: "Lessons",
        authorizeOnly: UserRole.STUDENT,
      },
      {
        href: "/dashboard/quiz",
        icon: "helpCircle",
        title: "Quiz",
        authorizeOnly: UserRole.STUDENT,
      },
      {
        href: "/dashboard/past-questions",
        icon: "fileText",
        title: "Past Questions",
        authorizeOnly: UserRole.STUDENT,
      },
      {
        href: "/dashboard/records",
        icon: "lineChart",
        title: "Reports",
        authorizeOnly: UserRole.STUDENT,
      },
      {
        href: "/dashboard/guardians",
        icon: "shield",
        title: "Guardians",
        authorizeOnly: UserRole.STUDENT,
      },
      {
        href: "/dashboard/tickets",
        icon: "helpCircle",
        title: "Support",
        authorizeOnly: UserRole.STUDENT,
      },
      // Guardian specific menu remains but streamlined
      {
        href: "/dashboard/records",
        icon: "folder",
        title: "Records",
        authorizeOnly: UserRole.GUARDIAN,
      },
      {
        href: "/dashboard/children",
        icon: "users",
        title: "My Children",
        authorizeOnly: UserRole.GUARDIAN,
      },
      {
        href: "/dashboard",
        icon: "home",
        title: "Dashboard",
        authorizeOnly: UserRole.GUARDIAN,
      },
      // Role-specific lesson management for Teachers, Admins, and SuperAdmins
      {
        href: "/dashboard/teacher/lessons",
        icon: "graduationCap",
        title: "Lessons",
        authorizeOnly: UserRole.TEACHER,
      },
      {
        href: "/dashboard/admin/charts",
        icon: "lineChart",
        title: "Analytics",
        authorizeOnly: UserRole.ADMIN,
      },
      {
        href: "/dashboard/admin/lessons",
        icon: "graduationCap",
        title: "Lessons",
        authorizeOnly: UserRole.ADMIN,
      },
      {
        href: "/dashboard/superadmin",
        icon: "layoutDashboard",
        title: "Dashboard",
        authorizeOnly: UserRole.SUPERADMIN,
      },
      {
        href: "/dashboard/superadmin/uploads",
        icon: "upload",
        title: "Uploads",
        authorizeOnly: UserRole.SUPERADMIN,
      },
      {
        href: "/dashboard/superadmin/browse",
        icon: "bookOpen",
        title: "Browse",
        authorizeOnly: UserRole.SUPERADMIN,
      },
      {
        href: "/dashboard/superadmin/manage",
        icon: "folderCog",
        title: "Manage Files",
        authorizeOnly: UserRole.SUPERADMIN,
      },
      {
        href: "/dashboard/superadmin/packages",
        icon: "package",
        title: "Packages",
        authorizeOnly: UserRole.SUPERADMIN,
      },
      {
        href: "/dashboard/superadmin/coupons",
        icon: "ticket",
        title: "Coupons",
        authorizeOnly: UserRole.SUPERADMIN,
      },
      {
        href: "/dashboard/superadmin/subscriptions",
        icon: "users",
        title: "Subscriptions",
        authorizeOnly: UserRole.SUPERADMIN,
      },
      {
        href: "/dashboard/superadmin/transactions",
        icon: "creditCard",
        title: "Transactions",
        authorizeOnly: UserRole.SUPERADMIN,
      },
      {
        href: "/dashboard/superadmin/tickets",
        icon: "ticket",
        title: "Tickets",
        authorizeOnly: UserRole.SUPERADMIN,
      },
      {
        href: "/dashboard/superadmin/motds",
        icon: "messages",
        title: "MOTDs",
        authorizeOnly: UserRole.SUPERADMIN,
      },
      {
        href: "/dashboard/superadmin/notifications",
        icon: "bell",
        title: "Notifications",
        authorizeOnly: UserRole.SUPERADMIN,
      },
      // ACCOUNT SECTION for students
      {
        href: "/dashboard/admin/billing",
        icon: "billing",
        title: "Billing",
        authorizeOnly: UserRole.ADMIN,
      },
      {
        href: "/dashboard/teacher/billing",
        icon: "billing",
        title: "Billing",
        authorizeOnly: UserRole.TEACHER,
      },
      // Unified orders
      {
        href: "/dashboard/admin/orders",
        icon: "package",
        title: "Orders",
        badge: 2,
        authorizeOnly: UserRole.ADMIN,
      },
      {
        href: "/dashboard/teacher/orders",
        icon: "package",
        title: "Orders",
        authorizeOnly: UserRole.TEACHER,
      },
    ],
  },
  {
    title: "SUBSCRIPTIONS",
    items: [
      {
        href: "/dashboard/subscriptions",
        icon: "package",
        title: "Plans",
        description: "Browse subscription plans",
        authorizeOnly: UserRole.STUDENT,
      },
      {
        href: "/dashboard/subscriptions/transactions",
        icon: "fileText",
        title: "Transactions",
        description: "View your payment history",
        authorizeOnly: UserRole.STUDENT,
      },
      {
        href: "/dashboard/subscriptions/history",
        icon: "folder",
        title: "Subscription History",
        description: "View your active and past subscriptions",
        authorizeOnly: UserRole.STUDENT,
      },
    ],
  },
  {
    title: "OPTIONS",
    items: [
      // Unified settings - students and guardians use main dashboard
      {
        href: "/dashboard/settings",
        icon: "settings",
        title: "Settings",
        authorizeOnly: UserRole.STUDENT,
      },
      {
        href: "/dashboard/settings",
        icon: "settings",
        title: "Settings",
        authorizeOnly: UserRole.GUARDIAN,
      },
      {
        href: "/dashboard/notifications",
        icon: "bell",
        title: "Notifications",
        authorizeOnly: UserRole.STUDENT,
      },
      {
        href: "/dashboard/notifications",
        icon: "bell",
        title: "Notifications",
        authorizeOnly: UserRole.GUARDIAN,
      },
      // Role-specific settings
      {
        href: "/dashboard/teacher/settings",
        icon: "settings",
        title: "Settings",
        authorizeOnly: UserRole.TEACHER,
      },
      {
        href: "/dashboard/admin/settings",
        icon: "settings",
        title: "Settings",
        authorizeOnly: UserRole.ADMIN,
      },
      { href: "/", icon: "home", title: "Homepage" },
      {
        href: "/docs",
        icon: "bookOpen",
        title: "Documentation",
        authorizeOnly: UserRole.SUPERADMIN,
      },

    ],
  },
];
