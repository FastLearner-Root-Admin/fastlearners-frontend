import { NextRequest, NextResponse } from "next/server";

import { BASE_API_URL } from "@/lib/api/client";
import { parseAuthCookiesServer } from "@/lib/server/auth-cookies";

async function forward(req: NextRequest, path: string[]) {
  const auth = parseAuthCookiesServer(req);
  const url = `${BASE_API_URL}/${path.join("/")}${req.nextUrl.search}`;

  const headers: HeadersInit = {
    Accept: "application/json",
  };
  if (auth?.token) (headers as any)["Authorization"] = `Bearer ${auth.token}`;

  try {
    if (
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "PATCH"
    ) {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData().catch(() => undefined);
        const resp = await fetch(url, {
          method: req.method,
          headers: { ...headers },
          body: formData,
          cache: "no-store",
        });
        const data = await resp.json().catch(() => ({}));
        return NextResponse.json(data, { status: resp.status });
      }

      const body = await req.json().catch(() => undefined);
      const resp = await fetch(url, {
        method: req.method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    }

    // Default: GET/DELETE
    const resp = await fetch(url, {
      method: req.method,
      headers,
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));

    if (
      req.method === "GET" &&
      path.join("/") === "packages" &&
      resp.status === 404 &&
      data?.message === "No package was found!"
    ) {
      return NextResponse.json(
        {
          type: "success",
          success: true,
          message: "No packages available",
          content: { packages: [] },
          code: 200,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Proxy request failed",
        code: 500,
      },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return forward(req, params.path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return forward(req, params.path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return forward(req, params.path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return forward(req, params.path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return forward(req, params.path);
}
