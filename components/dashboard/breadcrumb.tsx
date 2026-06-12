"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

const SEGMENT_TITLE_MAP: Record<string, string> = {
  "past-questions": "Past Questions",
  superadmin: "Super Admin",
  onboarding: "Onboarding",
  settings: "Settings",
  profile: "Profile",
};

interface BreadcrumbItem {
  title: string;
  href: string;
  isLast?: boolean;
}

interface BreadcrumbProps {
  className?: string;
  rootLabel?: string;
  rootHref?: string;
}

export function Breadcrumb({
  className,
  rootLabel = "Dashboard",
  rootHref = "/dashboard",
}: BreadcrumbProps) {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split("/").filter(Boolean);

    // Start with home
    const breadcrumbs: BreadcrumbItem[] = [
      { title: rootLabel, href: rootHref },
    ];

    // Build breadcrumbs from path segments
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip the first segment if it's already covered by Dashboard
      if (segment === "dashboard") return;

      // Format segment title
      const title =
        SEGMENT_TITLE_MAP[segment] ||
        segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

      breadcrumbs.push({
        title,
        href: currentPath,
        isLast: index === pathSegments.length - 1,
      });
    });

    // Mark the last item
    if (breadcrumbs.length > 0) {
      breadcrumbs[breadcrumbs.length - 1].isLast = true;
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex min-w-0 max-w-full items-center space-x-0.5 overflow-hidden whitespace-nowrap text-xs text-muted-foreground sm:space-x-1 sm:text-sm",
        className,
      )}
    >
      <Home className="size-3.5 shrink-0 sm:size-4" />
      {breadcrumbs.map((item, index) => {
        const isMiddleItem =
          breadcrumbs.length > 4 && index > 1 && index < breadcrumbs.length - 2;
        const shouldShowEllipsis = isMiddleItem && index === 2;

        return (
          <React.Fragment key={item.href}>
            {index >= 0 && (
              <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
            )}
            {isMiddleItem ? (
              shouldShowEllipsis ? (
                <span
                  className="flex shrink-0 items-center px-0.5"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="size-4" />
                </span>
              ) : null
            ) : item.isLast ? (
              <span
                className="max-w-[110px] truncate font-medium text-foreground sm:max-w-[180px] lg:max-w-[260px]"
                title={item.title}
              >
                {item.title}
              </span>
            ) : (
              <Link
                href={item.href}
                className="max-w-[72px] truncate transition-colors hover:text-foreground sm:max-w-[130px] lg:max-w-[180px]"
                title={item.title}
              >
                {item.title}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
