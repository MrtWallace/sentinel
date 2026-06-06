import { proxyBackendRequest } from "~~/app/api/sentinel/backendProxy";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).search;

  return proxyBackendRequest(`/api/wallet/status${searchParams}`, {
    method: "GET",
  });
}
