"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Bell, BookOpen, FolderCog, LayoutDashboard, Upload, Package, Ticket, Users, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SuperadminLayoutProps {
  children: React.ReactNode;
}

export default function SuperadminLayout({ children }: SuperadminLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && !user.role.includes("superadmin")) {
      toast.error("Access Denied", {
        description: "You do not have permission to view this page.",
      });
      router.push("/dashboard");
    }
  }, [user, router]);

  if (!user || !user.role.includes("superadmin")) {
    return null;
  }

  const tabs = [
    {
      href: "/dashboard/superadmin",
      label: "Overview",
      icon: LayoutDashboard,
      active: pathname === "/dashboard/superadmin",
    },
    {
      href: "/dashboard/superadmin/uploads",
      label: "Upload Files",
      icon: Upload,
      active: pathname.startsWith("/dashboard/superadmin/uploads"),
    },
    {
      href: "/dashboard/superadmin/browse",
      label: "Browse Lessons",
      icon: BookOpen,
      active: pathname.startsWith("/dashboard/superadmin/browse"),
    },
    {
      href: "/dashboard/superadmin/manage",
      label: "Manage Files",
      icon: FolderCog,
      active: pathname.startsWith("/dashboard/superadmin/manage"),
    },
    {
      href: "/dashboard/superadmin/packages",
      label: "Packages",
      icon: Package,
      active: pathname.startsWith("/dashboard/superadmin/packages"),
    },
    {
      href: "/dashboard/superadmin/coupons",
      label: "Coupons",
      icon: Ticket,
      active: pathname.startsWith("/dashboard/superadmin/coupons"),
    },
    {
      href: "/dashboard/superadmin/subscriptions",
      label: "Subscriptions",
      icon: Users,
      active: pathname.startsWith("/dashboard/superadmin/subscriptions"),
    },
    {
      href: "/dashboard/superadmin/transactions",
      label: "Transactions",
      icon: CreditCard,
      active: pathname.startsWith("/dashboard/superadmin/transactions"),
    },
    {
      href: "/dashboard/superadmin/notifications",
      label: "Notifications",
      icon: Bell,
      active: pathname.startsWith("/dashboard/superadmin/notifications"),
    },
  ];

  return (
    <div className="flex flex-col space-y-6 p-8">
      {/* Sub-navigation Header */}
      <div className="flex flex-col gap-4 border-b pb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Superadmin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage lesson content and system settings.
          </p>
        </div>

        <nav className="flex items-center space-x-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href}>
              <Button
                variant={tab.active ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "justify-start gap-2",
                  tab.active && "bg-secondary font-medium text-foreground",
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
