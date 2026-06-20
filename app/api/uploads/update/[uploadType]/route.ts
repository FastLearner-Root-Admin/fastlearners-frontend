import { NextRequest, NextResponse } from "next/server";

import { BASE_API_URL } from "@/lib/api/client";
import { handleApiError, handleUpstreamError } from "@/lib/api/error-handler";
import { parseAuthCookiesServer } from "@/lib/server/auth-cookies";
import {
  isValidUploadFile,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/lib/server/upload-validation";

const UPDATE_UPLOAD_CONFIG: Record<
  string,
  { field: string; upstreamPath: string; label: string }
> = {
  lessons: {
    field: "lessons_file",
    upstreamPath: "lessons",
    label: "lessons file",
  },
  concepts: {
    field: "concepts_file",
    upstreamPath: "concepts",
    label: "concepts file",
  },
  examples: {
    field: "examples_file",
    upstreamPath: "examples",
    label: "examples file",
  },
  exercises: {
    field: "exercises_file",
    upstreamPath: "exercises",
    label: "exercises file",
  },
  "general-exercises": {
    field: "general_exercises_file",
    upstreamPath: "general-exercises",
    label: "general exercises file",
  },
  "check-markers": {
    field: "check_markers_file",
    upstreamPath: "check-markers",
    label: "check markers file",
  },
};

export async function POST(
  req: NextRequest,
  { params }: { params: { uploadType: string } },
) {
  const auth = parseAuthCookiesServer(req);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", code: 401, content: null },
      { status: 401 },
    );
  }

  const config = UPDATE_UPLOAD_CONFIG[params.uploadType];
  if (!config) {
    return NextResponse.json(
      {
        success: false,
        message: "Unsupported lesson update upload type.",
        code: 400,
        content: null,
      },
      { status: 400 },
    );
  }

  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const formData = await req.formData();
    const file = formData.get(config.field) as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: {
            [config.field]: [`The ${config.label} field is required.`],
          },
          content: null,
          code: 422,
        },
        { status: 422 },
      );
    }

    if (!isValidUploadFile(file) || file.size > MAX_UPLOAD_SIZE_BYTES) {
      const messages: string[] = [];

      if (!isValidUploadFile(file)) {
        messages.push("File type must be CSV or TXT.");
      }
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        messages.push("File size must be less than 10MB.");
      }

      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: {
            [config.field]: messages,
          },
          content: null,
          code: 422,
        },
        { status: 422 },
      );
    }

    console.log(
      "[UPLOAD_UPDATE_ATTEMPT]",
      JSON.stringify({
        requestId,
        uploadType: params.uploadType,
        fileSize: file.size,
        fileName: file.name,
        timestamp: new Date().toISOString(),
      }),
    );

    const upstreamFormData = new FormData();
    upstreamFormData.append(config.field, file);

    const upstream = await fetch(
      `${BASE_API_URL}/superadmin/lessons/uploads/update/${config.upstreamPath}`,
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

    console.log(
      "[UPLOAD_UPDATE_COMPLETE]",
      JSON.stringify({
        requestId,
        uploadType: params.uploadType,
        statusCode: upstream.status,
        success: upstream.ok,
        skippedCount:
          data?.content?.skipped_count ||
          data?.content?.skipped_lessons_count ||
          0,
        timestamp: new Date().toISOString(),
      }),
    );

    if (!upstream.ok) {
      return handleUpstreamError(upstream, data);
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (err: any) {
    return handleApiError(err, "Error processing lesson update");
  }
}
