export type ExecutionStatus = "executed" | "rejected" | "confirm_needed" | "failed" | "pending";

export type RiskLevel = "low" | "medium" | "high";

export type IntentScenario =
  | "real_caw_swap"
  | "caw_pact_deny"
  | "blocked_swap"
  | "prompt_injection"
  | "agent_retry_swap"
  | "confirm_transfer";

export type ApiErrorKind = "network" | "timeout" | "execution_failed";

export type ApiError = {
  kind: ApiErrorKind;
  message: string;
  parsedReason?: string;
};

export type WalletStatus = "none" | "pairing_pending" | "paired" | "active" | "revoked" | "expired";

export type PairingStatus = "none" | "pending" | "paired" | "failed";

export type PactStatus = "none" | "pending_approval" | "active" | "expired" | "revoked" | "completed";

export type ConfigStatus = "synced" | "needs_pact_update";

export type CawPactLimits = {
  transferAmountThresholdConfirm?: string;
  swapAmountThresholdConfirm?: string;
  frequencyLimit?: number;
};

export type CawWalletBinding = {
  userAddress: string;
  walletStatus: WalletStatus;
  pairingStatus: PairingStatus;
  pactStatus: PactStatus;
  configStatus: ConfigStatus;
  cawWalletId?: string | null;
  cawWalletAddress?: string | null;
  pactId?: string | null;
  pairingUrl?: string | null;
  expiresAt?: string | null;
  hasPactApiKey?: boolean;
  cawHealthy?: boolean | null;
  walletPaired?: boolean | null;
  pendingTxsCount?: number | null;
  pactLimits?: CawPactLimits;
};

export type ConnectExistingCawWalletRequest = {
  userAddress: string;
  cawWalletId: string;
};

export type CreateCawWalletRequest = {
  userAddress: string;
};

export type RefreshWalletStatusRequest = {
  userAddress: string;
};

export type PairCawWalletRequest = {
  userAddress: string;
};

export type PairCawWalletResponse = {
  userAddress: string;
  cawWalletId?: string | null;
  cawWalletAddress?: string | null;
  pairingCode: string;
  expiresAt?: string | null;
};

export type RiskConfig = {
  swapAmountThresholdPass?: string;
  swapAmountThresholdConfirm?: string;
  transferAmountThresholdPass?: string;
  transferAmountThresholdConfirm?: string;
  slippageThresholdPass?: number;
  slippageThresholdConfirm?: number;
  frequencyLimit?: number;
  whitelistMode?: "strict" | "open" | string;
  customWhitelist?: string[];
  autoApproveLowRisk?: boolean;
};

export type RiskConfigResponse = {
  userAddress: string;
  configStatus: ConfigStatus;
  configVersion: number;
  pactConfigVersion: number;
  config: RiskConfig;
};

export type UpdateRiskConfigRequest = {
  userAddress: string;
  config: Partial<RiskConfig>;
};

export type ToolCallEvidence = {
  agent: string;
  tool: string;
  status: "succeeded" | "failed" | "skipped" | string;
  result: Record<string, unknown>;
  reason?: string | null;
};

export type ToolCall = {
  name: string;
  status: "success" | "failed" | "skipped" | string;
  durationMs?: number;
  inputSummary?: string;
  outputSummary?: string;
};

export type MemoryAnomaly = {
  kind: string;
  severity: "info" | "warning" | "critical" | string;
  reason: string;
};

export type McpEvaluationResult = {
  tool: "evaluate_transaction" | "get_risk_config" | "get_audit_log" | string;
  status: "succeeded" | "failed" | string;
  result: Record<string, unknown>;
};

export type TxProposal = {
  action: "swap" | "transfer" | "approve" | "deposit" | "withdraw" | "unknown";
  amount: string;
  fromToken?: string;
  toToken?: string;
  tokenPair?: string;
  targetContract: string;
  recipient?: string;
  slippage?: string;
  expectedOutput?: string;
  deadline?: string;
  reasoning?: string;
};

export type AgentProposal = {
  agent: "Agent A";
  proposal: TxProposal;
  reasoning: string;
  toolCalls?: ToolCall[];
};

// 硬规则结果用于解释“为什么直接通过、拒绝或要求人工确认”。
export type RuleCheck = {
  rule: string;
  passed: boolean;
  severity: "pass" | "confirm" | "reject";
  reason: string;
  toolCalls?: ToolCall[];
};

// AgentReview 对应 Agent B / Agent C 的 LLM 审查结果。
export type AgentReview = {
  agent: "Agent B" | "Agent C";
  role: "Security Auditor" | "Risk Analyst";
  passed: boolean;
  riskLevel: RiskLevel;
  findings: string[];
  reasoning: string;
  suggestions: Suggestion[];
  toolCalls?: ToolCall[];
};

export type Suggestion = {
  field: string;
  suggestedValue: string;
  reason: string;
  rejectionCode?: string;
};

export type SimulationResult = {
  success: boolean;
  gasEstimate?: number;
  parsedReason?: string;
};

export type ConfirmationRequest = {
  required: boolean;
  reason: string;
  riskNote: string;
};

// DecisionChain 是页面展示的核心数据：从 AI 提案到最终审计结果。
export type DecisionChain = {
  agentProposal: AgentProposal;
  hardRules: RuleCheck[];
  agentReviews: AgentReview[];
  finalDecision: ExecutionStatus;
  decisionReason: string;
  simulation: SimulationResult | null;
  txHash: string | null;
  confirmation?: ConfirmationRequest;
};

export type BackendDecision = "execute" | "reject" | "confirm";

export type RejectionSource = "sentinel" | "caw" | "none";

export type AttemptRecord = {
  attemptIndex: number;
  proposal: TxProposal;
  hardRules: RuleCheck[];
  agentReviews: AgentReview[];
  decision: BackendDecision;
  decisionReason: string;
  suggestions: Suggestion[];
  rejectionSource: RejectionSource;
};

export type ExecutionResult = {
  backend: "mock" | "caw" | "local" | string;
  status:
    | "not_submitted"
    | "skipped"
    | "dry_run"
    | "submitted"
    | "succeeded"
    | "pending_approval"
    | "policy_denied"
    | "failed"
    | string;
  requestId: string | null;
  txId?: string | null;
  txHash: string | null;
  reason?: string;
  walletId?: string | null;
  walletAddress?: string | null;
  pactId?: string | null;
  policyReason?: string | null;
  blockNumber?: string | null;
  usdcReceived?: string | null;
  realTxEnabled?: boolean | null;
  raw?: Record<string, unknown>;
};

export type ExecuteResponse = {
  txId: string;
  timestamp: string;
  intent: string;
  status: ExecutionStatus;
  reason: string;
  decisionChain: DecisionChain;
  attempts: AttemptRecord[];
  execution: ExecutionResult;
  toolCalls: ToolCallEvidence[];
  memoryAnomalies: MemoryAnomaly[];
  error?: ApiError;
};

export type AuditLogItem = {
  txId: string;
  timestamp: string;
  intent: string;
  status: ExecutionStatus;
  reason: string;
  txHash: string | null;
  executionBackend?: string | null;
  executionStatus?: string | null;
  decisionChain?: DecisionChain;
  attempts?: AttemptRecord[];
  execution?: ExecutionResult;
  toolCalls?: ToolCallEvidence[];
  memoryAnomalies?: MemoryAnomaly[];
};

export type AuditLogQuery = {
  userAddress?: string;
  status?: ExecutionStatus;
  limit?: number;
  offset?: number;
};

export type AuditLogPage = {
  items: AuditLogItem[];
  limit: number;
  offset: number;
  total: number;
};

export type ConfirmExecutionResponse = ExecuteResponse & {
  approved: boolean;
};

export type BackendTxProposal = {
  action: "swap" | "transfer" | "approve" | "deposit" | "withdraw" | "unknown";
  amount: string;
  from_token?: string | null;
  to_token?: string | null;
  to_contract?: string | null;
  slippage?: number | null;
  expected_output?: string | null;
  deadline?: number | null;
  reasoning?: string | null;
  recipient?: string | null;
};

export type BackendRuleResult = {
  rule_name: string;
  status: "passed" | "rejected" | "confirm" | "skipped";
  reason: string;
  severity: "info" | "warning" | "critical";
};

export type BackendSuggestion = {
  field: string;
  suggested_value: string | number | boolean;
  reason: string;
  rejection_code?: string | null;
};

export type BackendAgentResult = {
  agent_name: string;
  passed: boolean;
  risk_level: RiskLevel;
  findings: string[];
  reasoning: string;
  suggestions?: BackendSuggestion[];
  tool_calls?: BackendToolCallEvidence[];
};

export type BackendDecisionResult = {
  decision: BackendDecision;
  reason: string;
  suggestions?: BackendSuggestion[];
};

export type BackendAttemptRecord = {
  attempt_index: number;
  proposal: BackendTxProposal;
  hard_rules: BackendRuleResult[];
  security_audit: BackendAgentResult | null;
  risk_analysis: BackendAgentResult | null;
  decision: BackendDecisionResult;
  rejection_source: RejectionSource;
};

export type BackendExecutionResult = {
  backend: string;
  status: string;
  request_id: string | null;
  tx_id?: string | null;
  tx_hash: string | null;
  reason?: string | null;
  wallet_id?: string | null;
  wallet_address?: string | null;
  caw_wallet_id?: string | null;
  caw_wallet_address?: string | null;
  pact_id?: string | null;
  policy_reason?: string | null;
  raw?: Record<string, unknown>;
};

export type BackendCawPactLimits = {
  transfer_amount_threshold_confirm?: string;
  swap_amount_threshold_confirm?: string;
  frequency_limit?: number;
};

export type BackendCawWalletBinding = {
  user_address: string;
  wallet_status: WalletStatus;
  pairing_status: PairingStatus;
  pact_status: PactStatus;
  config_status: ConfigStatus;
  caw_wallet_id?: string | null;
  caw_wallet_address?: string | null;
  pact_id?: string | null;
  pairing_url?: string | null;
  expires_at?: string | null;
  has_pact_api_key?: boolean;
  caw_healthy?: boolean | null;
  wallet_paired?: boolean | null;
  pending_txs_count?: number | null;
  pact_limits?: BackendCawPactLimits;
};

export type BackendPairCawWalletResponse = {
  user_address: string;
  caw_wallet_id?: string | null;
  caw_wallet_address?: string | null;
  pairing_code: string;
  expires_at?: string | null;
};

export type BackendRiskConfig = {
  swap_amount_threshold_pass?: string;
  swap_amount_threshold_confirm?: string;
  transfer_amount_threshold_pass?: string;
  transfer_amount_threshold_confirm?: string;
  slippage_threshold_pass?: number;
  slippage_threshold_confirm?: number;
  frequency_limit?: number;
  whitelist_mode?: "strict" | "open" | string;
  custom_whitelist?: string[];
  auto_approve_low_risk?: boolean;
};

export type BackendRiskConfigResponse = {
  user_address: string;
  config_status: ConfigStatus;
  config_version: number;
  pact_config_version: number;
  config: BackendRiskConfig;
};

export type BackendToolCallEvidence = {
  agent: string;
  tool: string;
  status: ToolCallEvidence["status"];
  result: Record<string, unknown>;
  reason?: string | null;
};

export type BackendMemoryAnomaly = {
  kind: string;
  severity: MemoryAnomaly["severity"];
  reason: string;
};

export type BackendLegacyDecisionChain = {
  agent_a?: {
    proposal?: BackendTxProposal;
  };
  hard_rules?: Array<{
    rule: string;
    status?: BackendRuleResult["status"];
    passed: boolean;
    reason: string;
    severity?: BackendRuleResult["severity"];
  }>;
  agent_b?: BackendAgentResult | null;
  agent_c?: BackendAgentResult | null;
  decision?: ExecutionStatus;
  decision_reason?: string;
  simulation?: {
    success: boolean;
    gas_estimate?: number | null;
  } | null;
  tx_hash?: string | null;
};

export type BackendExecuteResponse = {
  tx_id: string;
  timestamp?: string;
  intent?: string;
  input_proposal?: Record<string, unknown> | null;
  status: ExecutionStatus;
  decision: BackendDecision;
  decision_reason: string;
  sentinel_decision?: BackendDecision;
  sentinel_decision_reason?: string;
  attempts: BackendAttemptRecord[];
  decision_chain: BackendLegacyDecisionChain | null;
  execution: BackendExecutionResult;
  tool_calls?: BackendToolCallEvidence[];
  memory_anomalies?: BackendMemoryAnomaly[];
};

export type BackendAuditLogSummary = {
  tx_id: string;
  timestamp: string;
  intent: string;
  status: ExecutionStatus;
  decision: BackendDecision;
  decision_reason?: string;
  sentinel_decision?: BackendDecision;
  execution_backend?: string | null;
  execution_status?: string | null;
  tx_hash: string | null;
};

export type BackendAuditLogPage = {
  items: BackendAuditLogSummary[];
  limit: number;
  offset: number;
  total: number;
};

export type BackendAuditLogRecord = BackendExecuteResponse & {
  timestamp: string;
  intent: string;
  confirmation?: {
    action: "approve" | "reject";
    status: "approved" | "rejected";
  };
};
