import { mapBackendExecuteResponse } from "~~/lib/sentinel/backendMapper";
import { MOCK_AUDIT_LOG, MOCK_EXECUTE_RESPONSES, responseToAuditItem } from "~~/lib/sentinel/mockData";
import type {
  ApiError,
  AuditLogItem,
  BackendExecuteResponse,
  ConfirmExecutionResponse,
  ExecuteResponse,
  IntentScenario,
} from "~~/lib/sentinel/types";

const MOCK_LATENCY_MS = 350;
const EXECUTE_PROXY_PATH = "/api/sentinel/execute";

// 这个函数是页面唯一需要依赖的执行入口；后端完成后只替换函数内部实现。
export async function executeIntent(intent: string): Promise<ExecuteResponse> {
  const backendResponse = await executeIntentViaBackend(intent);

  if (backendResponse) {
    return backendResponse;
  }

  await waitForMockLatency();

  maybeThrowMockError(intent);

  const scenario = detectIntentScenario(intent);
  const response = cloneResponse(MOCK_EXECUTE_RESPONSES[scenario]);

  return {
    ...response,
    intent,
  };
}

// MVP 的确认接口只记录用户选择，不假设会触发真实链上交易。
export async function confirmExecution(txId: string, approved: boolean): Promise<ConfirmExecutionResponse> {
  await waitForMockLatency();

  const baseResponse = cloneResponse(MOCK_EXECUTE_RESPONSES.confirm_transfer);
  const status = approved ? "executed" : "rejected";
  const reason = approved ? "Operator approved. Audit state updated." : "Operator rejected. Audit state updated.";

  return {
    ...baseResponse,
    approved,
    txId,
    status,
    reason,
    decisionChain: {
      ...baseResponse.decisionChain,
      finalDecision: status,
      decisionReason: reason,
      txHash: null,
      confirmation: {
        required: false,
        reason,
        riskNote: "Confirmation was recorded by the mock API layer.",
      },
    },
    attempts: baseResponse.attempts.map(attempt => ({
      ...attempt,
      decision: approved ? "execute" : "reject",
      decisionReason: reason,
      rejectionSource: approved ? "none" : "sentinel",
    })),
    execution: {
      ...baseResponse.execution,
      txHash: null,
      reason,
    },
  };
}

async function executeIntentViaBackend(intent: string): Promise<ExecuteResponse | null> {
  try {
    const response = await fetch(EXECUTE_PROXY_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ intent }),
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as BackendExecuteResponse;

    return mapBackendExecuteResponse(body, intent);
  } catch {
    return null;
  }
}

function maybeThrowMockError(intent: string): void {
  const normalizedIntent = intent.toLowerCase();

  if (normalizedIntent.includes("network")) {
    throwApiError({
      kind: "network",
      message: "Connection failed. Try again.",
    });
  }

  if (normalizedIntent.includes("timeout")) {
    throwApiError({
      kind: "timeout",
      message: "Request timed out.",
    });
  }

  if (normalizedIntent.includes("revert") || normalizedIntent.includes("daily limit")) {
    throwApiError({
      kind: "execution_failed",
      message: "Contract execution failed.",
      parsedReason: "daily limit exceeded",
    });
  }
}

function throwApiError(error: ApiError): never {
  throw error;
}

export async function getAuditLog(): Promise<AuditLogItem[]> {
  await waitForMockLatency();

  return MOCK_AUDIT_LOG.map(item => {
    const clonedItem = cloneAuditItem(item);

    return {
      txId: clonedItem.txId,
      timestamp: clonedItem.timestamp,
      intent: clonedItem.intent,
      status: clonedItem.status,
      reason: clonedItem.reason,
      txHash: clonedItem.txHash,
    };
  });
}

export async function getAuditLogItem(txId: string): Promise<AuditLogItem> {
  await waitForMockLatency();

  const item = MOCK_AUDIT_LOG.find(auditItem => auditItem.txId === txId);

  if (item) {
    return cloneAuditItem(item);
  }

  return responseToAuditItem({
    ...cloneResponse(MOCK_EXECUTE_RESPONSES.confirm_transfer),
    txId,
    reason: "Generated fallback audit record.",
  });
}

function detectIntentScenario(intent: string): IntentScenario {
  const normalizedIntent = intent.toLowerCase();
  const swapEthAmount = getEthToUsdcSwapAmount(normalizedIntent);

  if (swapEthAmount !== null && swapEthAmount >= 1) {
    return "blocked_swap";
  }

  if (swapEthAmount !== null && swapEthAmount >= 0.2) {
    return "agent_retry_swap";
  }

  if (normalizedIntent.includes("send") || normalizedIntent.includes("0.08 eth")) {
    return "confirm_transfer";
  }

  return "safe_swap";
}

function getEthToUsdcSwapAmount(normalizedIntent: string): number | null {
  const match = normalizedIntent.match(/\bswap\s+([0-9]+(?:\.[0-9]+)?)\s+eth\s+to\s+usdc\b/);

  if (!match?.[1]) {
    return null;
  }

  const amount = Number(match[1]);

  return Number.isFinite(amount) ? amount : null;
}

function waitForMockLatency(): Promise<void> {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, MOCK_LATENCY_MS);
  });
}

function cloneResponse(response: ExecuteResponse): ExecuteResponse {
  return JSON.parse(JSON.stringify(response)) as ExecuteResponse;
}

function cloneAuditItem(item: AuditLogItem): AuditLogItem {
  return JSON.parse(JSON.stringify(item)) as AuditLogItem;
}
