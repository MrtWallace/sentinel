import { proxyBackendRequest } from "~~/app/api/sentinel/backendProxy";

export async function POST(request: Request) {
  const body = await request.text();

  return proxyBackendRequest("/api/wallet/pair-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}
