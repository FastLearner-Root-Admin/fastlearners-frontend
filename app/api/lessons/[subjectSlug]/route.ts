import { NextRequest, NextResponse } from "next/server";

import { UPSTREAM_BASE } from "@/lib/api/client";
import {
  createErrorResponse,
  handleApiError,
  handleUpstreamError,
} from "@/lib/api/error-handler";
import { parseAuthCookiesServer } from "@/lib/server/auth-cookies";

const toNumericWeek = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
  }
  return Number.MAX_SAFE_INTEGER;
};

const sortTopicsByWeek = (data: any) => {
  const topics = data?.content?.topics;
  if (!topics || typeof topics !== "object") return data;

  const sortedTopics = Object.fromEntries(
    Object.entries(topics).map(([term, items]) => {
      if (!Array.isArray(items)) return [term, items];

      return [
        term,
        [...items].sort((a, b) => {
          const weekDifference = toNumericWeek(a?.week) - toNumericWeek(b?.week);
          if (weekDifference !== 0) return weekDifference;

          return Number(a?.order_index ?? 0) - Number(b?.order_index ?? 0);
        }),
      ];
    }),
  );

  return {
    ...data,
    content: {
      ...data.content,
      topics: sortedTopics,
    },
  };
};

export async function GET(
  req: NextRequest,
  { params }: { params: { subjectSlug: string } },
) {
  const auth = parseAuthCookiesServer(req);
  if (!auth) {
    return createErrorResponse("Unauthorized", 401);
  }

  const requestId = crypto.randomUUID();

  try {
    const subjectSlug = params.subjectSlug;

    if (!subjectSlug) {
      return createErrorResponse(
        "Invalid request: subject slug is required",
        400,
        undefined,
        requestId,
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const upstream = await fetch(`${UPSTREAM_BASE}/lessons/${subjectSlug}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await upstream.json();

      if (!upstream.ok) {
        return handleUpstreamError(upstream, data, requestId);
      }

      return NextResponse.json(sortTopicsByWeek(data), {
        status: upstream.status,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Retry on network errors
      if (
        fetchError.name === "AbortError" ||
        fetchError.message?.includes("fetch")
      ) {
        try {
          const retryUpstream = await fetch(
            `${UPSTREAM_BASE}/lessons/${subjectSlug}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${auth.token}`,
              },
              cache: "no-store",
            },
          );

          const retryData = await retryUpstream.json();

          if (!retryUpstream.ok) {
            return handleUpstreamError(retryUpstream, retryData, requestId);
          }

          return NextResponse.json(sortTopicsByWeek(retryData), {
            status: retryUpstream.status,
          });
        } catch (retryError) {
          return handleApiError(
            retryError,
            "Network error: Failed to fetch lesson topics after retry",
            requestId,
          );
        }
      }

      throw fetchError;
    }
  } catch (err: any) {
    return handleApiError(err, "Failed to fetch lesson topics", requestId);
  }
}
