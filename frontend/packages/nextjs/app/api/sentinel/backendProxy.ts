import { NextResponse } from "next/server";

const BACKEND_API_BASE_URL = process.env.SENTINEL_BACKEND_URL ?? "http://127.0.0.1:8000";

export async function proxyBackendRequest(path: string, init?: RequestInit): Promise<NextResponse> {
  try {
    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
    });
    const responseBody = await backendResponse.text();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ error: "Sentinel backend unavailable" }, { status: 503 });
  }
}
