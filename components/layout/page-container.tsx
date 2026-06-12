"use client";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum width constraint. Defaults to "default" (7xl) */
  maxWidth?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "full"
    | "default";
  /** Whether to add padding. Defaults to true */
  withPadding?: boolean;
  /** Whether to add bottom padding for mobile navigation. Defaults to true */
  withBottomPadding?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
  default: "max-w-7xl",
};

/**
 * PageContainer - A consistent layout wrapper for all dashboard pages
 *
 * Provides:
 * - Centered content with responsive padding
 * - Configurable max-width
 * - Consistent spacing across all pages
 *
 * Usage:
 * <PageContainer>
 *   <YourContent />
 * </PageContainer>
 *
 * <PageContainer maxWidth="4xl" withBottomPadding={false}>
 *   <YourContent />
 * </PageContainer>
 */
export function PageContainer({
  children,
  className,
  maxWidth = "default",
  withPadding = true,
  withBottomPadding = true,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-full overflow-x-hidden",
        maxWidthClasses[maxWidth],
        withPadding && "px-4 sm:px-6 lg:px-8",
        withBottomPadding && "pb-16 sm:pb-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * PageHeader - A consistent header section for dashboard pages
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("min-w-0 space-y-1 pb-4 pt-2", className)}>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="break-words text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
