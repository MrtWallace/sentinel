import type {
  AgentReview,
  AttemptRecord,
  AuditLogItem,
  BackendAgentResult,
  BackendAttemptRecord,
  BackendAuditLogRecord,
  BackendAuditLogSummary,
  BackendCawWalletBinding,
  BackendDecision,
  BackendExecuteResponse,
  BackendExecutionResult,
  BackendMemoryAnomaly,
  BackendRiskConfig,
  BackendRiskConfigResponse,
  BackendRuleResult,
  BackendSuggestion,
  BackendToolCallEvidence,
  BackendTxProposal,
  CawPactLimits,
  CawWalletBinding,
  DecisionChain,
  ExecuteResponse,
  ExecutionResult,
  MemoryAnomaly,
  RiskConfig,
  RiskConfigResponse,
  RuleCheck,
  Suggestion,
  ToolCallEvidence,
  TxProposal,
} from "./types";

const DEFAULT_EXECUTION: ExecutionResult = {
  backend: "mock",
  status: "not_submitted",
  requestId: null,
  txHash: null,
  reason: "Execution result is not available.",
};

export function mapBackendExecuteResponse(dto: BackendExecuteResponse, intent: string): ExecuteResponse {
  const attempts = dto.attempts.map(mapBackendAttempt);
  const decisionChain = mapBackendDecisionChain(dto, attempts);
  const execution = mapBackendExecution(dto.execution);

  return {
    txId: dto.tx_id,
    timestamp: dto.timestamp ?? new Date().toISOString(),
    intent: dto.intent ?? intent,
    status: dto.status,
    reason: dto.decision_reason,
    decisionChain,
    attempts,
    execution,
    toolCalls: (dto.tool_calls ?? []).map(mapBackendToolCall),
    memoryAnomalies: (dto.memory_anomalies ?? []).map(mapBackendMemoryAnomaly),
  };
}

export function mapBackendAuditSummary(dto: BackendAuditLogSummary): AuditLogItem {
  return {
    txId: dto.tx_id,
    timestamp: dto.timestamp,
    intent: dto.intent,
    status: dto.status,
    reason: auditSummaryReason(dto),
    txHash: dto.tx_hash,
  };
}

export function mapBackendAuditRecord(dto: BackendAuditLogRecord): ExecuteResponse {
  return mapBackendExecuteResponse(dto, dto.intent);
}

export function mapBackendWalletBinding(dto: BackendCawWalletBinding): CawWalletBinding {
  return {
    userAddress: dto.user_address,
    walletStatus: dto.wallet_status,
    pairingStatus: dto.pairing_status,
    pactStatus: dto.pact_status,
    configStatus: dto.config_status,
    cawWalletId: dto.caw_wallet_id ?? undefined,
    cawWalletAddress: dto.caw_wallet_address ?? undefined,
    pactId: dto.pact_id ?? undefined,
    pairingUrl: dto.pairing_url ?? undefined,
    expiresAt: dto.expires_at ?? undefined,
    pactLimits: dto.pact_limits ? mapBackendPactLimits(dto.pact_limits) : undefined,
  };
}

export function mapBackendRiskConfigResponse(dto: BackendRiskConfigResponse): RiskConfigResponse {
  return {
    userAddress: dto.user_address,
    configStatus: dto.config_status,
    configVersion: dto.config_version,
    pactConfigVersion: dto.pact_config_version,
    config: mapBackendRiskConfig(dto.config),
  };
}

export function mapBackendAttempt(attempt: BackendAttemptRecord): AttemptRecord {
  const agentReviews = [attempt.security_audit, attempt.risk_analysis].flatMap(agent =>
    agent ? [mapBackendAgent(agent)] : [],
  );

  return {
    attemptIndex: attempt.attempt_index,
    proposal: mapBackendProposal(attempt.proposal),
    hardRules: attempt.hard_rules.map(mapBackendRule),
    agentReviews,
    decision: attempt.decision.decision,
    decisionReason: attempt.decision.reason,
    suggestions: (attempt.decision.suggestions ?? []).map(mapBackendSuggestion),
    rejectionSource: attempt.rejection_source,
  };
}

export function mapBackendProposal(proposal: BackendTxProposal): TxProposal {
  const fromToken = proposal.from_token ?? undefined;
  const toToken = proposal.to_token ?? undefined;
  const recipient = proposal.recipient ?? undefined;
  const targetContract = proposal.to_contract ?? recipient ?? "N/A";

  return {
    action: proposal.action,
    amount: proposal.amount,
    fromToken,
    toToken,
    tokenPair: fromToken && toToken ? `${fromToken} / ${toToken}` : recipient ? "ETH transfer" : undefined,
    targetContract,
    recipient,
    slippage: typeof proposal.slippage === "number" ? `${Math.round(proposal.slippage * 100)}%` : undefined,
    expectedOutput: proposal.expected_output ?? undefined,
    deadline: typeof proposal.deadline === "number" ? `${proposal.deadline}s` : undefined,
    reasoning: proposal.reasoning ?? undefined,
  };
}

export function mapBackendRule(rule: BackendRuleResult): RuleCheck {
  return {
    rule: rule.rule_name,
    passed: rule.status !== "rejected",
    severity: mapRuleSeverity(rule),
    reason: rule.reason,
  };
}

export function mapBackendAgent(agent: BackendAgentResult): AgentReview {
  const isSecurityAuditor = agent.agent_name.toLowerCase().includes("security");

  return {
    agent: isSecurityAuditor ? "Agent B" : "Agent C",
    role: isSecurityAuditor ? "Security Auditor" : "Risk Analyst",
    passed: agent.passed,
    riskLevel: agent.risk_level,
    findings: agent.findings,
    reasoning: agent.reasoning,
    suggestions: (agent.suggestions ?? []).map(mapBackendSuggestion),
  };
}

export function mapBackendSuggestion(suggestion: BackendSuggestion): Suggestion {
  return {
    field: suggestion.field,
    suggestedValue: String(suggestion.suggested_value),
    reason: suggestion.reason,
    rejectionCode: suggestion.rejection_code ?? undefined,
  };
}

export function mapBackendExecution(execution: BackendExecutionResult | null | undefined): ExecutionResult {
  if (!execution) {
    return DEFAULT_EXECUTION;
  }

  return {
    backend: execution.backend,
    status: execution.status,
    requestId: execution.request_id,
    txId: execution.tx_id ?? undefined,
    txHash: execution.tx_hash,
    reason: execution.reason ?? undefined,
    walletId: execution.wallet_id ?? undefined,
    walletAddress: execution.wallet_address ?? undefined,
    pactId: execution.pact_id ?? undefined,
    policyReason: execution.policy_reason ?? undefined,
    raw: execution.raw,
  };
}

export function mapBackendToolCall(toolCall: BackendToolCallEvidence): ToolCallEvidence {
  return {
    agent: toolCall.agent,
    tool: toolCall.tool,
    status: toolCall.status,
    result: toolCall.result,
    reason: toolCall.reason ?? undefined,
  };
}

export function mapBackendMemoryAnomaly(memoryAnomaly: BackendMemoryAnomaly): MemoryAnomaly {
  return {
    kind: memoryAnomaly.kind,
    severity: memoryAnomaly.severity,
    reason: memoryAnomaly.reason,
  };
}

function mapBackendPactLimits(limits: NonNullable<BackendCawWalletBinding["pact_limits"]>): CawPactLimits {
  return {
    transferAmountThresholdConfirm: limits.transfer_amount_threshold_confirm,
    swapAmountThresholdConfirm: limits.swap_amount_threshold_confirm,
    frequencyLimit: limits.frequency_limit,
  };
}

function mapBackendRiskConfig(config: BackendRiskConfig): RiskConfig {
  return {
    swapAmountThresholdPass: config.swap_amount_threshold_pass,
    swapAmountThresholdConfirm: config.swap_amount_threshold_confirm,
    transferAmountThresholdPass: config.transfer_amount_threshold_pass,
    transferAmountThresholdConfirm: config.transfer_amount_threshold_confirm,
    slippageThresholdPass: config.slippage_threshold_pass,
    slippageThresholdConfirm: config.slippage_threshold_confirm,
    frequencyLimit: config.frequency_limit,
    whitelistMode: config.whitelist_mode,
    customWhitelist: config.custom_whitelist,
    autoApproveLowRisk: config.auto_approve_low_risk,
  };
}

function auditSummaryReason(dto: BackendAuditLogSummary): string {
  if (dto.execution_status) {
    return `Decision: ${dto.decision}; execution: ${dto.execution_status}`;
  }

  return `Decision: ${dto.decision}`;
}

function mapBackendDecisionChain(dto: BackendExecuteResponse, attempts: AttemptRecord[]): DecisionChain {
  const legacy = dto.decision_chain;
  const lastAttempt = attempts.at(-1);
  const proposal =
    lastAttempt?.proposal ??
    (legacy?.agent_a?.proposal && mapBackendProposal(legacy.agent_a.proposal)) ??
    mapBackendProposal({ action: "unknown", amount: "0" });
  const legacyAgentReviews = [legacy?.agent_b, legacy?.agent_c].flatMap(agent =>
    agent ? [mapBackendAgent(agent)] : [],
  );

  return {
    agentProposal: {
      agent: "Agent A",
      proposal,
      reasoning: proposal.reasoning ?? "Backend generated a structured transaction proposal.",
    },
    hardRules:
      legacy?.hard_rules?.map(rule => ({
        rule: rule.rule,
        passed: rule.passed,
        severity: mapLegacyRuleSeverity(rule.status, rule.severity),
        reason: rule.reason,
      })) ??
      lastAttempt?.hardRules ??
      [],
    agentReviews: legacyAgentReviews.length > 0 ? legacyAgentReviews : (lastAttempt?.agentReviews ?? []),
    finalDecision: dto.status,
    decisionReason: legacy?.decision_reason ?? dto.decision_reason,
    simulation: legacy?.simulation
      ? {
          success: legacy.simulation.success,
          gasEstimate: legacy.simulation.gas_estimate ?? undefined,
        }
      : { success: dto.status !== "rejected" },
    txHash: dto.execution.tx_hash ?? legacy?.tx_hash ?? null,
    confirmation:
      dto.status === "confirm_needed" ? confirmationFromDecision(dto.decision, dto.decision_reason) : undefined,
  };
}

function mapRuleSeverity(rule: BackendRuleResult): RuleCheck["severity"] {
  if (rule.status === "rejected" || rule.severity === "critical") {
    return "reject";
  }

  if (rule.status === "confirm" || rule.severity === "warning") {
    return "confirm";
  }

  return "pass";
}

function mapLegacyRuleSeverity(
  status: BackendRuleResult["status"] | undefined,
  severity: BackendRuleResult["severity"] | undefined,
): RuleCheck["severity"] {
  return mapRuleSeverity({
    rule_name: "LegacyRule",
    status: status ?? "passed",
    reason: "",
    severity: severity ?? "info",
  });
}

function confirmationFromDecision(decision: BackendDecision, reason: string): DecisionChain["confirmation"] {
  if (decision !== "confirm") {
    return undefined;
  }

  return {
    required: true,
    reason,
    riskNote: "Backend returned CONFIRM as a terminal MVP state. Operator approval records an audit decision only.",
  };
}
