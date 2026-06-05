import { proxyBackendRequest } from "~~/app/api/sentinel/backendProxy";

export async function GET() {
  return proxyBackendRequest("/api/audit-log", {
    method: "GET",
  });
}
