
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

  try {
    const formData = await req.formData();
    const file = formData.get("scheme_of_work_file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: {
            scheme_of_work_file: ["The scheme of work file field is required."],
          },
          content: null,
          code: 422,
        },
        { status: 422 },
      );
    }

    if (!isValidUploadFile(file) || file.size > MAX_UPLOAD_SIZE_BYTES) {
      const errors: Record<string, string[]> = {};
      const messages: string[] = [];

      if (!isValidUploadFile(file)) {
        messages.push("File type must be CSV or TXT.");
      }
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        messages.push("File size must be less than 10MB.");
      }

      errors.scheme_of_work_file = messages;

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

    // Create new FormData for upstream
    const upstreamFormData = new FormData();
    upstreamFormData.append("scheme_of_work_file", file);

    const upstream = await fetch(
      `${BASE_API_URL}/superadmin/lessons/uploads/scheme-of-work`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: upstreamFormData,
        cache: "no-store",
      },
    );

    const data = await upstream.json();

    if (!upstream.ok) {
      return handleUpstreamError(upstream, data);
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (err: any) {
    return handleApiError(err, "Error processing upload");
  }
}
