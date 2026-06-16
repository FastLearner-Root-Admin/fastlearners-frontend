"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

import { trackEvent } from "@/lib/analytics/posthog";

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    const search = window.location.search || null;
    trackEvent("$pageview", { path: pathname, search: search || null });

    if (pathname === "/pricing") {
      trackEvent("pricing_viewed");
    }
  }, [pathname]);

  return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true" ? (
    <VercelAnalytics />
  ) : null;
}
