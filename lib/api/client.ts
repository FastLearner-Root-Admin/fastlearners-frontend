// lib/api/client.ts - Shared API configuration and utilities

import { z } from "zod";

// Environment validation schema
const apiEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
});

type ApiEnv = z.infer<typeof apiEnvSchema>;

// Validate environment variables
function validateApiEnv(): ApiEnv | null {
  try {
    const env = {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    };

    const result = apiEnvSchema.safeParse(env);

    if (!result.success) {
      const errors = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");

      if (process.env.NODE_ENV === "development") {
        console.warn(`[API Config] Environment validation warnings: ${errors}`);
      } else {
        throw new Error(`Invalid API configuration: ${errors}`);
      }

      return null;
    }

    return result.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[API Config] Environment validation failed, using defaults:",
        error,
      );
    }
    return null;
  }
}

// Get API URL from environment
const env = validateApiEnv();
if (!env?.NEXT_PUBLIC_API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL must be configured.");
}

export const BASE_API_URL = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");

// Helper to build request headers for internal API routes (uses cookies)
export function buildInternalApiHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// Export for use in API routes
export const UPSTREAM_BASE = BASE_API_URL;
