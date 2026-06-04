export type ExecutionStatus = "executed" | "rejected" | "confirm_needed" | "failed";

export type RiskLevel = "low" | "medium" | "high";

export type IntentScenario = "safe_swap" | "agent_retry_swap" | "blocked_swap" | "confirm_transfer";

export type ApiErrorKind = "network" | "timeout" | "execution_failed";

export type ApiError = {
  kind: ApiErrorKind;
  message: string;
  parsedReason?: string;
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
};

// 硬规则结果用于解释“为什么直接通过、拒绝或要求人工确认”。
export type RuleCheck = {
  rule: string;
  passed: boolean;
  severity: "pass" | "confirm" | "reject";
  reason: string;
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
  status: "not_submitted" | "dry_run" | "submitted" | "succeeded" | "policy_denied" | "failed" | string;
  requestId: string | null;
  txHash: string | null;
  reason?: string;
  walletId?: string | null;
  walletAddress?: string | null;
  pactId?: string | null;
  policyReason?: string | null;
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
  error?: ApiError;
};

export type AuditLogItem = {
  txId: string;
  timestamp: string;
  intent: string;
  status: ExecutionStatus;
  reason: string;
  txHash: string | null;
  decisionChain?: DecisionChain;
  attempts?: AttemptRecord[];
  execution?: ExecutionResult;
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
  tx_hash: string | null;
  reason?: string | null;
  wallet_id?: string | null;
  wallet_address?: string | null;
  pact_id?: string | null;
  policy_reason?: string | null;
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
  status: ExecutionStatus;
  decision: BackendDecision;
  decision_reason: string;
  attempts: BackendAttemptRecord[];
  decision_chain: BackendLegacyDecisionChain | null;
  execution: BackendExecutionResult;
};
