import {
  mapBackendAuditRecord,
  mapBackendAuditSummary,
  mapBackendExecuteResponse,
  mapBackendRiskConfigResponse,
  mapBackendWalletBinding,
} from "~~/lib/sentinel/backendMapper";
import {
  DEMO_USER_ADDRESS,
  MOCK_AUDIT_LOG,
  MOCK_EXECUTE_RESPONSES,
  MOCK_RISK_CONFIG,
  MOCK_WALLET_BINDINGS,
  responseToAuditItem,
} from "~~/lib/sentinel/mockData";
import type {
  ApiError,
  AuditLogItem,
  AuditLogPage,
  AuditLogQuery,
  BackendAuditLogPage,
  BackendAuditLogRecord,
  BackendAuditLogSummary,
  BackendCawWalletBinding,
  BackendExecuteResponse,
  BackendRiskConfig,
  BackendRiskConfigResponse,
  CawWalletBinding,
  ConfirmExecutionResponse,
  ConnectExistingCawWalletRequest,
  CreateCawWalletRequest,
  ExecuteResponse,
  IntentScenario,
  RefreshWalletStatusRequest,
  RiskConfig,
  RiskConfigResponse,
  UpdateRiskConfigRequest,
} from "~~/lib/sentinel/types";

const MOCK_LATENCY_MS = 350;
const EXECUTE_PROXY_PATH = "/api/sentinel/execute";
const AUDIT_LOG_PROXY_PATH = "/api/sentinel/audit-log";
const CONFIRM_PROXY_PATH = "/api/sentinel/confirm";
const WALLET_STATUS_PROXY_PATH = "/api/sentinel/wallet/status";
const WALLET_CONNECT_EXISTING_PROXY_PATH = "/api/sentinel/wallet/connect-existing";
const WALLET_CREATE_PROXY_PATH = "/api/sentinel/wallet/create";
const WALLET_REFRESH_STATUS_PROXY_PATH = "/api/sentinel/wallet/refresh-status";
const WALLET_PACT_PROXY_PATH = "/api/sentinel/wallet/pact";
const CONFIG_PROXY_PATH = "/api/sentinel/config";

// 这个函数是页面唯一需要依赖的执行入口；后端完成后只替换函数内部实现。
export async function executeIntent(intent: string, userAddress = DEMO_USER_ADDRESS): Promise<ExecuteResponse> {
  const backendResponse = await executeIntentViaBackend(intent, userAddress);

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

export async function getWalletStatus(userAddress = DEMO_USER_ADDRESS): Promise<CawWalletBinding> {
  const backendResponse = await getWalletStatusViaBackend(userAddress);

  if (backendResponse) {
    return backendResponse;
  }

  await waitForMockLatency();

  return cloneWalletBinding(MOCK_WALLET_BINDINGS.active);
}

export async function connectExistingCawWallet(request: ConnectExistingCawWalletRequest): Promise<CawWalletBinding> {
  const backendResponse = await postWalletAction(WALLET_CONNECT_EXISTING_PROXY_PATH, {
    user_address: request.userAddress,
    caw_wallet_id: request.cawWalletId,
  });

  if (backendResponse) {
    return backendResponse;
  }

  await waitForMockLatency();

  return {
    ...cloneWalletBinding(MOCK_WALLET_BINDINGS.paired),
    userAddress: request.userAddress,
    cawWalletId: request.cawWalletId,
  };
}

export async function createCawWallet(request: CreateCawWalletRequest): Promise<CawWalletBinding> {
  const backendResponse = await postWalletAction(WALLET_CREATE_PROXY_PATH, {
    user_address: request.userAddress,
  });

  if (backendResponse) {
    return backendResponse;
  }

  await waitForMockLatency();

  return {
    ...cloneWalletBinding(MOCK_WALLET_BINDINGS.pairingPending),
    userAddress: request.userAddress,
  };
}

export async function submitPact(
  userAddress: string,
  limits: Record<string, unknown>,
): Promise<CawWalletBinding> {
  const backendResponse = await postWalletAction(WALLET_PACT_PROXY_PATH, {
    user_address: userAddress,
    limits,
  });

  if (backendResponse) {
    return backendResponse;
  }

  await waitForMockLatency();

  return {
    ...cloneWalletBinding(MOCK_WALLET_BINDINGS.active),
    userAddress,
    pactStatus: "pending_approval",
  };
}

export async function refreshWalletStatus(request: RefreshWalletStatusRequest): Promise<CawWalletBinding> {
  const backendResponse = await postWalletAction(WALLET_REFRESH_STATUS_PROXY_PATH, {
    user_address: request.userAddress,
  });

  if (backendResponse) {
    return backendResponse;
  }

  await waitForMockLatency();

  return {
    ...cloneWalletBinding(MOCK_WALLET_BINDINGS.active),
    userAddress: request.userAddress,
  };
}

export async function getRiskConfig(userAddress = DEMO_USER_ADDRESS): Promise<RiskConfigResponse> {
  const backendResponse = await getRiskConfigViaBackend(userAddress);

  if (backendResponse) {
    return backendResponse;
  }

  await waitForMockLatency();

  return cloneRiskConfig(MOCK_RISK_CONFIG);
}

export async function updateRiskConfig(request: UpdateRiskConfigRequest): Promise<RiskConfigResponse> {
  const backendResponse = await updateRiskConfigViaBackend(request);

  if (backendResponse) {
    return backendResponse;
  }

  await waitForMockLatency();

  return {
    ...cloneRiskConfig(MOCK_RISK_CONFIG),
    userAddress: request.userAddress,
    configStatus: "needs_pact_update",
    configVersion: MOCK_RISK_CONFIG.configVersion + 1,
    config: {
      ...MOCK_RISK_CONFIG.config,
      ...request.config,
    },
  };
}

// MVP 的确认接口只记录用户选择，不假设会触发真实链上交易。
export async function confirmExecution(txId: string, approved: boolean): Promise<ConfirmExecutionResponse> {
  const backendResponse = await confirmExecutionViaBackend(txId, approved);

  if (backendResponse) {
    return backendResponse;
  }

  await waitForMockLatency();

  return mockConfirmExecution(txId, approved);
}

async function confirmExecutionViaBackend(txId: string, approved: boolean): Promise<ConfirmExecutionResponse | null> {
  try {
    const response = await fetch(CONFIRM_PROXY_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_id: txId,
        action: approved ? "approve" : "reject",
      }),
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as BackendAuditLogRecord;
    const mappedResponse = mapBackendAuditRecord(body);

    return normalizeConfirmedResponse(mappedResponse, approved);
  } catch {
    return null;
  }
}

function mockConfirmExecution(txId: string, approved: boolean): ConfirmExecutionResponse {
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

function normalizeConfirmedResponse(response: ExecuteResponse, approved: boolean): ConfirmExecutionResponse {
  const status = approved ? "executed" : "rejected";
  const reason = approved ? "Operator approved. Audit state updated." : "Operator rejected. Audit state updated.";

  return {
    ...response,
    approved,
    status,
    reason,
    decisionChain: {
      ...response.decisionChain,
      finalDecision: status,
      decisionReason: reason,
      txHash: response.decisionChain.txHash,
      confirmation: {
        required: false,
        reason,
        riskNote:
          "Backend confirmation records the operator decision in audit state and does not imply real on-chain execution.",
      },
    },
    attempts: response.attempts.map(attempt => ({
      ...attempt,
      decision: approved ? "execute" : "reject",
      decisionReason: reason,
      rejectionSource: approved ? "none" : "sentinel",
    })),
    execution: {
      ...response.execution,
      reason,
    },
  };
}

async function executeIntentViaBackend(intent: string, userAddress: string): Promise<ExecuteResponse | null> {
  try {
    const response = await fetch(EXECUTE_PROXY_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_address: userAddress, intent }),
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

async function getWalletStatusViaBackend(userAddress: string): Promise<CawWalletBinding | null> {
  try {
    const response = await fetch(`${WALLET_STATUS_PROXY_PATH}?user_address=${encodeURIComponent(userAddress)}`, {
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as BackendCawWalletBinding;

    return mapBackendWalletBinding(body);
  } catch {
    return null;
  }
}

async function postWalletAction(path: string, body: Record<string, unknown>): Promise<CawWalletBinding | null> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return null;
    }

    const responseBody = (await response.json()) as BackendCawWalletBinding;

    return mapBackendWalletBinding(responseBody);
  } catch {
    return null;
  }
}

async function getRiskConfigViaBackend(userAddress: string): Promise<RiskConfigResponse | null> {
  try {
    const response = await fetch(`${CONFIG_PROXY_PATH}?user_address=${encodeURIComponent(userAddress)}`, {
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as BackendRiskConfigResponse;

    return mapBackendRiskConfigResponse(body);
  } catch {
    return null;
  }
}

async function updateRiskConfigViaBackend(request: UpdateRiskConfigRequest): Promise<RiskConfigResponse | null> {
  try {
    const response = await fetch(CONFIG_PROXY_PATH, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_address: request.userAddress,
        config: mapRiskConfigToBackend(request.config),
      }),
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as BackendRiskConfigResponse;

    return mapBackendRiskConfigResponse(body);
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

export async function getAuditLog(query: AuditLogQuery = {}): Promise<AuditLogPage> {
  const backendItems = await getAuditLogViaBackend(query);

  if (backendItems) {
    return backendItems;
  }

  await waitForMockLatency();

  const filteredItems = MOCK_AUDIT_LOG.filter(item => !query.status || item.status === query.status);
  const offset = query.offset ?? 0;
  const limit = query.limit ?? filteredItems.length;
  const pageItems = filteredItems.slice(offset, offset + limit);

  return {
    items: pageItems.map(item => {
      const clonedItem = cloneAuditItem(item);

      return {
        txId: clonedItem.txId,
        timestamp: clonedItem.timestamp,
        intent: clonedItem.intent,
        status: clonedItem.status,
        reason: clonedItem.reason,
        txHash: clonedItem.txHash,
        executionBackend: clonedItem.execution?.backend ?? clonedItem.executionBackend ?? null,
        executionStatus: clonedItem.execution?.status ?? clonedItem.executionStatus ?? null,
      };
    }),
    limit,
    offset,
    total: filteredItems.length,
  };
}

export async function getAuditLogItem(txId: string): Promise<AuditLogItem> {
  const backendItem = await getAuditLogItemViaBackend(txId);

  if (backendItem) {
    return backendItem;
  }

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

async function getAuditLogViaBackend(query: AuditLogQuery): Promise<AuditLogPage | null> {
  try {
    const response = await fetch(`${AUDIT_LOG_PROXY_PATH}${auditQueryString(query)}`, {
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as BackendAuditLogSummary[] | BackendAuditLogPage;

    if (Array.isArray(body)) {
      const items = body
        .map(mapBackendAuditSummary)
        .sort((left, right) => right.timestamp.localeCompare(left.timestamp));

      return {
        items,
        limit: query.limit ?? items.length,
        offset: query.offset ?? 0,
        total: items.length,
      };
    }

    return {
      items: body.items
        .map(mapBackendAuditSummary)
        .sort((left, right) => right.timestamp.localeCompare(left.timestamp)),
      limit: body.limit,
      offset: body.offset,
      total: body.total,
    };
  } catch {
    return null;
  }
}

async function getAuditLogItemViaBackend(txId: string): Promise<AuditLogItem | null> {
  try {
    const response = await fetch(`${AUDIT_LOG_PROXY_PATH}/${encodeURIComponent(txId)}`, {
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as BackendAuditLogRecord;

    return responseToAuditItem(mapBackendAuditRecord(body));
  } catch {
    return null;
  }
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

function auditQueryString(query: AuditLogQuery): string {
  const params = new URLSearchParams();

  if (query.userAddress) {
    params.set("user_address", query.userAddress);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (typeof query.limit === "number") {
    params.set("limit", String(query.limit));
  }

  if (typeof query.offset === "number") {
    params.set("offset", String(query.offset));
  }

  const serialized = params.toString();

  return serialized ? `?${serialized}` : "";
}

function cloneResponse(response: ExecuteResponse): ExecuteResponse {
  return JSON.parse(JSON.stringify(response)) as ExecuteResponse;
}

function cloneAuditItem(item: AuditLogItem): AuditLogItem {
  return JSON.parse(JSON.stringify(item)) as AuditLogItem;
}

function cloneWalletBinding(binding: CawWalletBinding): CawWalletBinding {
  return JSON.parse(JSON.stringify(binding)) as CawWalletBinding;
}

function cloneRiskConfig(config: RiskConfigResponse): RiskConfigResponse {
  return JSON.parse(JSON.stringify(config)) as RiskConfigResponse;
}

function mapRiskConfigToBackend(config: Partial<RiskConfig>): Partial<BackendRiskConfig> {
  return {
    swap_amount_threshold_pass: config.swapAmountThresholdPass,
    swap_amount_threshold_confirm: config.swapAmountThresholdConfirm,
    transfer_amount_threshold_pass: config.transferAmountThresholdPass,
    transfer_amount_threshold_confirm: config.transferAmountThresholdConfirm,
    slippage_threshold_pass: config.slippageThresholdPass,
    slippage_threshold_confirm: config.slippageThresholdConfirm,
    frequency_limit: config.frequencyLimit,
    whitelist_mode: config.whitelistMode,
    custom_whitelist: config.customWhitelist,
    auto_approve_low_risk: config.autoApproveLowRisk,
  };
}
