"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Bell,
  CreditCard,
  Palette,
  Shield,
  User,
  UserCog,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { DashboardHeader } from "@/components/dashboard/header";
import { Main } from "@/components/settings/layout/main";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const navItems = [
    { title: "Profile", href: "/dashboard/settings/profile", icon: User },
    { title: "Account", href: "/dashboard/settings/account", icon: Shield },
    {
      title: "Appearance",
      href: "/dashboard/settings/appearance",
      icon: Palette,
    },
    {
      title: "Notifications",
      href: "/dashboard/settings/notifications",
      icon: Bell,
    },
    {
      title: "Billing",
      href: "/dashboard/settings/billing",
      icon: CreditCard,
    },
    ...(user?.role?.includes("student")
      ? [
          {
            title: "Guardians",
            href: "/dashboard/settings/guardians",
            icon: UserCog,
          },
        ]
      : []),
    ...(user?.role?.includes("guardian")
      ? [
          {
            title: "Children",
            href: "/dashboard/settings/children",
            icon: Users,
          },
        ]
      : []),
  ];

  if (isLoading) {
    return (
      <Main fixed>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </Main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Main fixed>
      <div className="min-w-0 space-y-6">
        <DashboardHeader
          heading="Settings"
          text="Manage account and website settings."
        />
        <Separator />

        <div className="mobile-scroll-x flex pb-1">
          <nav className="flex min-w-max gap-1 rounded-lg bg-muted/50 p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="min-w-0 rounded-lg border bg-card pb-2">
          <div className="min-w-0 divide-y divide-border px-4 sm:px-6">
            {children}
          </div>
        </div>
      </div>
    </Main>
  );
}
