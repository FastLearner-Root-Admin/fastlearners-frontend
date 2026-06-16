import { NextRequest, NextResponse } from "next/server";

import { BASE_API_URL } from "@/lib/api/client";
import { setAuthCookiesServer } from "@/lib/server/auth-cookies";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idToken = body?.id_token;

    if (!idToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Google ID token is required",
          errors: { id_token: ["The id_token field is required."] },
          code: 422,
        },
        { status: 422 },
      );
    }

    const r = await fetch(`${BASE_API_URL}/google/auth`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_token: idToken }),
    });
    const data = await r.json();

    if (r.ok && data?.content?.access_token && data?.content?.user) {
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const res = NextResponse.json({
        success: true,
        message: data.message || "Google authentication successful",
        content: data.content,
        user: data.content.user,
      });
      setAuthCookiesServer(res, {
        token: data.content.access_token,
        expiresAt,
      });
      return res;
    }

    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Google callback failed",
        code: 500,
      },
      { status: 500 },
    );
  }
}
