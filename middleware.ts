import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_ROUTES, PUBLIC_ROUTES, RBACUtils } from "@/lib/rbac/role-config";
import { parseAuthCookiesServer } from "@/lib/server/auth-cookies";
import { User, UserRole } from "@/lib/types/auth";

type RoleFetchResult = UserRole | null | "UNAUTHORIZED";

function isValidRole(role: RoleFetchResult): role is UserRole {
  return (
    role !== null &&
    role !== "UNAUTHORIZED" &&
    typeof role === "string" &&
    ["guest", "student", "guardian", "teacher", "admin", "superadmin"].includes(
      role,
    )
  );
}

async function getUserRoleFromBackend(
  authToken: string,
): Promise<RoleFetchResult> {
  // Require NEXT_PUBLIC_API_URL to be present
  // Only allow hardcoded fallback in production environment
  // Note: Middleware uses stricter fallback (production-only) compared to session route
  // to avoid cross-origin calls in local dev environments
  const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://app.fastlearnersapp.com/api/v1"
      : null);

  if (!BASE_URL) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.debug("Skipping role fetch due to missing NEXT_PUBLIC_API_URL");
    }
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

  try {
    const response = await fetch(`${BASE_URL}/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    // Distinguish authorization failures from transient errors
    if (response.status === 401 || response.status === 403) {
      if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
        console.warn(`Authorization failed: HTTP ${response.status}`);
      }
      return "UNAUTHORIZED";
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const role = data?.content?.user?.role?.[0];
    if (
      typeof role === "string" &&
      [
        "guest",
        "student",
        "guardian",
        "teacher",
        "admin",
        "superadmin",
      ].includes(role)
    ) {
      if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
        console.log("Role fetched successfully:", role);
      }
      return role as UserRole;
    } else {
      if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
        console.warn("Invalid role structure in response:", data);
      }
      return null;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.warn("Role fetch timed out after 5 seconds");
      } else {
        console.warn("Network error fetching role:", error.message);
      }
    } else {
      console.warn("Unknown error fetching role:", error);
    }
    // Only fail-open for timeouts/network errors, not for authorization failures
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip role verification for static assets to prevent timeouts
  const staticAssetExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".css",
    ".js",
    ".map",
  ];
  const isStaticAsset =
    staticAssetExtensions.some((ext) => pathname.toLowerCase().endsWith(ext)) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/_static/") ||
    pathname.startsWith("/favicon.ico");

  if (isStaticAsset) {
    return NextResponse.next();
  }

  // 0. Unconditional bypass for Parental Consent pages (Bypass auth and RBAC for all users)
  // Covers /parental-consent/[token]/[action] AND /[token]/[action]
  const isConsentPath =
    pathname.startsWith("/parental-consent") ||
    /^\/[^\/]+\/(accept|reject)$/.test(pathname);

  if (isConsentPath) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
      console.log(`Bypassing auth for parental consent path: ${pathname}`);
    }
    return NextResponse.next();
  }

  const authData = parseAuthCookiesServer(request);
  const isAuthenticated = !!authData;
  let userRole: RoleFetchResult = null;
  if (authData) {
    userRole = await getUserRoleFromBackend(authData.token);
  }
  const debug =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEBUG_AUTH === "true";
  if (debug) {
    console.log(`RBAC Middleware: ${pathname}`, {
      authenticated: isAuthenticated,
      userRole,
      roleFetched: userRole !== null && userRole !== "UNAUTHORIZED",
    });
  }

  // 1. Handle authorization failures (401/403) - treat as unauthenticated
  if (userRole === "UNAUTHORIZED") {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    if (debug) {
      console.log("Authorization failed (401/403), redirecting to login");
    }
    // Optionally clear cookies here if available
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated users away from auth pages (check before PUBLIC_ROUTES to prevent short-circuit)
  if (
    isAuthenticated &&
    AUTH_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    const homeRoute = isValidRole(userRole)
      ? RBACUtils.getHomeRoute(userRole)
      : RBACUtils.getHomeRoute(undefined);
    if (debug && !isValidRole(userRole)) {
      console.log(
        `Role fetch failed, using RBACUtils fallback home route: ${homeRoute}`,
      );
    }
    return NextResponse.redirect(new URL(homeRoute, request.url));
  }

  // 3. Allow public routes (only for unauthenticated users to prevent short-circuit)
  if (
    !isAuthenticated &&
    PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route),
    )
  ) {
    return NextResponse.next();
  }

  // 4. Redirect unauthenticated users to login
  if (!isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Handle guest users who need role selection
  if (userRole === "guest") {
    if (
      !pathname.startsWith("/auth/set-role") &&
      !pathname.startsWith("/guest")
    ) {
      return NextResponse.redirect(new URL("/auth/set-role", request.url));
    }
    return NextResponse.next();
  }

  // 6. Check role-based route access
  if (isValidRole(userRole)) {
    const validRole = userRole;

    // For onboarding routes, we need to fetch full profile to check completeness
    // RBACUtils.canAccessRoute() requires full user object with profile data for onboarding checks
    if (pathname.startsWith("/onboarding")) {
      // Try to fetch full profile for profile completeness check
      let fullUser: User | null = null;
      if (authData) {
        try {
          const BASE_URL =
            process.env.NEXT_PUBLIC_API_URL ||
            (process.env.NODE_ENV === "production"
              ? "https://app.fastlearnersapp.com/api/v1"
              : null);

          if (BASE_URL) {
            const profileResponse = await fetch(`${BASE_URL}/profile`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${authData.token}`,
                Accept: "application/json",
              },
              cache: "no-store",
            });

            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              if (profileData.content?.user) {
                fullUser = profileData.content.user as User;
              }
            }
          }
        } catch (error) {
          if (debug) {
            console.warn(
              "Failed to fetch full profile for onboarding check:",
              error,
            );
          }
        }
      }

      // Use full user if available, otherwise use minimal user
      const userForCheck = fullUser || ({ role: [validRole] } as User);

      // RBACUtils.canAccessRoute() handles onboarding access with profile completeness check
      if (!RBACUtils.canAccessRoute(userForCheck, pathname)) {
        const homeRoute = RBACUtils.getHomeRoute(validRole);
        if (debug) {
          console.log(
            `Onboarding access denied for ${validRole}, redirecting to ${homeRoute}`,
          );
        }
        return NextResponse.redirect(new URL(homeRoute, request.url));
      }

      // Allow access to onboarding if RBACUtils says it's okay
      return NextResponse.next();
    }

    const minimalUser: User = { role: [validRole] } as User; // Minimal user object for RBAC check
    if (!RBACUtils.canAccessRoute(minimalUser, pathname)) {
      const homeRoute = RBACUtils.getHomeRoute(validRole);
      if (debug) {
        console.log(
          `Access denied to ${pathname}, redirecting to ${homeRoute}`,
        );
      }
      return NextResponse.redirect(new URL(homeRoute, request.url));
    }
  } else {
    // Fail-open: if role fetch failed, allow access but log warning
    console.warn(
      `Role verification failed for authenticated user at ${pathname}, allowing access (temporary until Phase 2)`,
    );
  }

  // 7. Allow access - user has proper role permissions
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public|manifest.webmanifest|site.webmanifest|sitemap.xml|robots.txt).*)",
    "/auth/:path*",
  ],
};
