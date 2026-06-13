import { NextRequest, NextResponse } from "next/server";

import { UPSTREAM_BASE } from "@/lib/api/client";
import {
  createErrorResponse,
  handleApiError,
  handleUpstreamError,
} from "@/lib/api/error-handler";
import { parseAuthCookiesServer } from "@/lib/server/auth-cookies";

export async function POST(req: NextRequest) {
  const auth = parseAuthCookiesServer(req);
  if (!auth) {
    return createErrorResponse("Unauthorized", 401);
  }

  const requestId = crypto.randomUUID();

  try {
    const body = await req.json();
    const { subject } = body;

    if (!subject || typeof subject !== "number") {
      return createErrorResponse(
        "Invalid request: subject ID is required",
        400,
        undefined,
        requestId,
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    const formData = new URLSearchParams();
    formData.append("subject", String(subject));
    formData.append("subject_id", String(subject));

    try {
      const upstream = await fetch(
        `${UPSTREAM_BASE}/subjects/update-compulsory-selective`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${auth.token}`,
          },
          body: formData.toString(),
          cache: "no-store",
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);
      const data = await upstream.json();

      if (!upstream.ok) {
        return handleUpstreamError(upstream, data, requestId);
      }

      return NextResponse.json(data, { status: upstream.status });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Retry on network errors
      if (
        fetchError.name === "AbortError" ||
        fetchError.message?.includes("fetch")
      ) {
        try {
          const retryUpstream = await fetch(
            `${UPSTREAM_BASE}/subjects/update-compulsory-selective`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Bearer ${auth.token}`,
              },
              body: formData.toString(),
              cache: "no-store",
            },
          );

          const retryData = await retryUpstream.json();

          if (!retryUpstream.ok) {
            return handleUpstreamError(retryUpstream, retryData, requestId);
          }

          return NextResponse.json(retryData, { status: retryUpstream.status });
        } catch (retryError) {
          return handleApiError(
            retryError,
            "Network error: Failed to update compulsory selective after retry",
            requestId,
          );
        }
      }

      throw fetchError;
    }
  } catch (err: any) {
    return handleApiError(
      err,
      "Failed to update compulsory selective",
      requestId,
    );
  }
}
