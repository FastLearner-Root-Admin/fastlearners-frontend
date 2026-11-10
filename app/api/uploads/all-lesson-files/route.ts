
import { NextRequest, NextResponse } from "next/server";

import { BASE_API_URL } from "@/lib/api/client";
import { handleApiError, handleUpstreamError } from "@/lib/api/error-handler";
import { parseAuthCookiesServer } from "@/lib/server/auth-cookies";
import {
  isValidUploadFile,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/lib/server/upload-validation";

export async function POST(req: NextRequest) {
  const auth = parseAuthCookiesServer(req);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", code: 401, content: null },
      { status: 401 },
    );
  }

  // Generate request ID for log correlation
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const formData = await req.formData();

    // Validate required files
    const requiredFields = [
      "lessons_file",
      "concepts_file",
      "examples_file",
      "exercises_file",
      "general_exercises_file",
      "check_markers_file",
    ] as const;

    const missingFiles = requiredFields.filter((field) => !formData.get(field));

    if (missingFiles.length > 0) {
      const errors: Record<string, string[]> = {};
      missingFiles.forEach((field) => {
        const humanLabel =
          field === "check_markers_file"
            ? "check markers file"
            : field.replace(/_/g, " ").replace(/file$/, "file");
        errors[field] = [`The ${humanLabel} field is required.`];
      });

      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors,
          content: null,
          code: 422,
        },
        { status: 422 },
      );
    }

    // Server-side file validation (type and size) before proxying upstream
    for (const field of requiredFields) {
      const file = formData.get(field) as File | null;
      if (!file) continue;

      if (!isValidUploadFile(file) || file.size > MAX_UPLOAD_SIZE_BYTES) {
        const errors: Record<string, string[]> = {};
        const messages: string[] = [];

        if (!isValidUploadFile(file)) {
          messages.push("File type must be CSV or TXT.");
        }
        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
          messages.push("File size must be less than 10MB.");
        }

        errors[field] = messages;

        return NextResponse.json(
          {
            success: false,
            message: "Validation failed.",
            errors,
            content: null,
            code: 422,
          },
          { status: 422 },
        );
      }
    }

    // Log upload attempt
    const fileSizes: Record<string, number> = {};
    requiredFields.forEach((field) => {
      const file = formData.get(field) as File | null;
      if (file) fileSizes[field] = file.size;
    });

    console.log(
      "[UPLOAD_ATTEMPT]",
      JSON.stringify({
        requestId,
        uploadType: "all-lesson-files",
        fileSizes,
        timestamp: new Date().toISOString(),
      }),
    );

    // Create new FormData for upstream with all files
    const upstreamFormData = new FormData();
    requiredFields.forEach((field) => {
      const file = formData.get(field) as File;
      if (file) {
        // No field name mapping needed - API accepts the same field names
        upstreamFormData.append(field, file);
      }
    });

    const upstream = await fetch(
      `${BASE_API_URL}/superadmin/lessons/uploads/all-lesson-files`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${auth.token}`,
          "X-Request-ID": requestId,
        },
        body: upstreamFormData,
        cache: "no-store",
      },
    );

    const data = await upstream.json();

    // Log upload completion
    console.log(
      "[UPLOAD_COMPLETE]",
      JSON.stringify({
        requestId,
        uploadType: "all-lesson-files",
        statusCode: upstream.status,
        success: upstream.ok,
        hasErrors: !!data.errors,
        hasConflicts: !!data.conflicts,
        conflictCount: data.conflicts?.length || 0,
        timestamp: new Date().toISOString(),
      }),
    );

    if (!upstream.ok) {
      return handleUpstreamError(upstream, data);
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (err: any) {
    return handleApiError(err, "Error processing upload");
  }
}
