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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const activeItem = navItems.find((item) => item.href === pathname);

  return (
    <Main fixed>
      <div className="min-w-0 space-y-6">
        <DashboardHeader
          heading="Settings"
          text="Manage account and website settings."
        />
        <Separator />

        {/* Mobile: section switcher */}
        <div className="md:hidden">
          <Select
            value={pathname}
            onValueChange={(href) => router.push(href)}
          >
            <SelectTrigger className="h-11">
              <SelectValue>
                <span className="flex items-center gap-2">
                  {activeItem && <activeItem.icon className="size-4" />}
                  {activeItem?.title ?? "Settings"}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {navItems.map((item) => (
                <SelectItem key={item.href} value={item.href}>
                  <span className="flex items-center gap-2">
                    <item.icon className="size-4" />
                    {item.title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-8 md:flex-row md:gap-10">
          {/* Desktop: sidebar nav */}
          <nav className="hidden shrink-0 md:block md:w-52">
            <div className="sticky top-20 flex flex-col gap-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="min-w-0 flex-1 pb-10">{children}</div>
        </div>
      </div>
    </Main>
  );
}
