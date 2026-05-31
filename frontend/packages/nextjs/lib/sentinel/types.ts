export type ExecutionStatus = "executed" | "rejected" | "confirm_needed" | "failed";

export type RiskLevel = "low" | "medium" | "high";

export type IntentScenario = "safe_swap" | "blocked_swap" | "confirm_transfer";

export type ApiErrorKind = "network" | "timeout" | "execution_failed";

export type ApiError = {
  kind: ApiErrorKind;
  message: string;
  parsedReason?: string;
};

export type TxProposal = {
  action: "swap" | "transfer" | "approve" | "unknown";
  amount: string;
  fromToken?: string;
  toToken?: string;
  tokenPair?: string;
  targetContract: string;
  recipient?: string;
  slippage?: string;
  expectedOutput?: string;
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

export type ExecuteResponse = {
  txId: string;
  timestamp: string;
  intent: string;
  status: ExecutionStatus;
  reason: string;
  decisionChain: DecisionChain;
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
};

export type ConfirmExecutionResponse = ExecuteResponse & {
  approved: boolean;
};
