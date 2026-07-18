// lib/api/error-handler.ts - Standardized error handling for API routes

import { NextResponse } from "next/server";

export interface ApiErrorResponse {
  success: false;
  message: string;
  content: any;
  code: number;
  requestId: string;
  errorCode?: string;
  errors?: any;
}

/**
 * Creates a standardized error response for API routes
 */
export function createErrorResponse(
  message: string,
  code: number = 500,
  errorCode?: string,
  requestId?: string,
): NextResponse<ApiErrorResponse> {
  const id = requestId || crypto.randomUUID();

  return NextResponse.json(
    {
      success: false,
      message,
      content: null,
      code,
      requestId: id,
      ...(errorCode && { errorCode }),
    },
    { status: code },
  );
}

/**
 * Handles upstream API errors with standardized response
 */
export function handleUpstreamError(
  upstreamResponse: Response,
  upstreamData: any,
  requestId?: string,
): NextResponse<ApiErrorResponse> {
  // Log detailed error server-side
  if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
    console.error("Upstream API error:", {
      status: upstreamResponse.status,
      data: upstreamData,
      requestId,
    });
  }

  // Extract error message from upstream response
  const message =
    upstreamData?.message ||
    upstreamData?.error ||
    `Upstream API error: ${upstreamResponse.statusText}`;

  // Extract error code if available
  const errorCode = upstreamData?.code || upstreamData?.error_code;
  const id = requestId || crypto.randomUUID();

  // Build response with errors field if present
  return NextResponse.json(
    {
      success: false,
      message,
      content: upstreamData?.content ?? null,
      code: upstreamResponse.status,
      requestId: id,
      ...(errorCode && { errorCode }),
      ...(upstreamData?.errors && { errors: upstreamData.errors }),
    },
    { status: upstreamResponse.status },
  );
}

/**
 * Handles general errors in API routes
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = "An error occurred",
  requestId?: string,
): NextResponse<ApiErrorResponse> {
  // Log detailed error server-side
  if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
    console.error("API route error:", error);
  }
  try {
    const fs = require("fs");
    fs.appendFileSync("debug-error.log", "\nAPI Error: " + (error instanceof Error ? error.stack : String(error)));
  } catch(e) {}

  const message = error instanceof Error ? error.message : defaultMessage;

  return createErrorResponse(message, 500, undefined, requestId);
}
