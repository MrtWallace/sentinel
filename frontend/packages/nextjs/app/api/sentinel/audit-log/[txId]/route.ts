import { proxyBackendRequest } from "~~/app/api/sentinel/backendProxy";

type AuditDetailRouteContext = {
  params: Promise<{
    txId: string;
  }>;
};

export async function GET(_request: Request, context: AuditDetailRouteContext) {
  const { txId } = await context.params;

  return proxyBackendRequest(`/api/audit-log/${encodeURIComponent(txId)}`, {
    method: "GET",
  });
}
