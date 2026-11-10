// Allow up to 10 MB uploads (Next.js default is 4 MB)
export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

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
    const lessonsFile = formData.get("lessons_file") as File | null;

    if (!lessonsFile) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: {
            lessons_file: ["The lessons file field is required."],
          },
          content: null,
          code: 422,
        },
        { status: 422 },
      );
    }

    if (
      !isValidUploadFile(lessonsFile) ||
      lessonsFile.size > MAX_UPLOAD_SIZE_BYTES
    ) {
      const errors: Record<string, string[]> = {};
      const messages: string[] = [];

      if (!isValidUploadFile(lessonsFile)) {
        messages.push("File type must be CSV or TXT.");
      }
      if (lessonsFile.size > MAX_UPLOAD_SIZE_BYTES) {
        messages.push("File size must be less than 10MB.");
      }

      errors.lessons_file = messages;

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

    // Log upload attempt
    console.log(
      "[UPLOAD_ATTEMPT]",
      JSON.stringify({
        requestId,
        uploadType: "lessons",
        fileSize: lessonsFile.size,
        fileName: lessonsFile.name,
        timestamp: new Date().toISOString(),
      }),
    );

    // Create new FormData for upstream
    const upstreamFormData = new FormData();
    upstreamFormData.append("lessons_file", lessonsFile);

    const upstream = await fetch(
      `${BASE_API_URL}/superadmin/lessons/uploads/lessons`,
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
        uploadType: "lessons",
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
