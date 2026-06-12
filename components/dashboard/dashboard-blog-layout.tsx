"use client";

import { ReactNode } from "react";

interface DashboardBlogLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * DashboardBlogLayout - Preserves blog visual style while serving Subjects/Lessons pages.
 * Do not change layout classes without design review.
 */
export function DashboardBlogLayout({
  title,
  description,
  children,
  className,
}: DashboardBlogLayoutProps) {
  return (
    <>
      <div className="container mx-auto px-4 py-6 sm:px-6 md:pb-8 md:pt-10 lg:px-8">
        <div className="max-w-screen-sm">
          <h1 className="font-heading text-3xl md:text-4xl">{title}</h1>
          {description && (
            <p className="mt-3.5 text-base text-muted-foreground md:text-lg">
              {description}
            </p>
          )}
        </div>
      </div>

      <div
        className={
          className
            ? `container mx-auto min-w-0 overflow-hidden px-4 sm:px-6 lg:px-8 ${className}`
            : "container mx-auto min-w-0 overflow-hidden px-4 sm:px-6 lg:px-8"
        }
      >
        {children}
      </div>
    </>
  );
}
