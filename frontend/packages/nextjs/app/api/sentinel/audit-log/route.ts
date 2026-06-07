import { proxyBackendRequest } from "~~/app/api/sentinel/backendProxy";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyBackendRequest(`/api/audit-log${search}`, {
    method: "GET",
  });
}
