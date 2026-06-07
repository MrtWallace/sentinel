import { proxyBackendRequest } from "~~/app/api/sentinel/backendProxy";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).search;

  return proxyBackendRequest(`/api/config${searchParams}`, {
    method: "GET",
  });
}

export async function PUT(request: Request) {
  const body = await request.text();

  return proxyBackendRequest("/api/config", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}
