import type {
  AttemptRecord,
  AuditLogItem,
  BackendDecision,
  DecisionChain,
  ExecuteResponse,
  ExecutionResult,
} from "./types";

export function auditItemToExecuteResponse(item: AuditLogItem): ExecuteResponse {
  const decisionChain = normalizeDecisionChain(item);

  return {
    txId: item.txId,
    timestamp: item.timestamp,
    intent: item.intent,
    status: item.status,
    reason: item.reason,
    decisionChain,
    attempts: item.attempts ?? [fallbackAttempt(item, decisionChain)],
    execution: item.execution ?? fallbackExecution(item),
    toolCalls: item.toolCalls ?? [],
    memoryAnomalies: item.memoryAnomalies ?? [],
  };
}

function normalizeDecisionChain(item: AuditLogItem): DecisionChain {
  if (item.decisionChain) {
    return {
      ...item.decisionChain,
      finalDecision: item.decisionChain.finalDecision ?? item.status,
      decisionReason: item.decisionChain.decisionReason || item.reason,
      txHash: item.decisionChain.txHash ?? item.txHash,
    };
  }

  return {
    agentProposal: {
      agent: "Agent A",
      proposal: {
        action: "unknown",
        amount: "N/A",
        targetContract: "Audit record",
      },
      reasoning: "Audit detail did not include the original proposal payload.",
    },
    hardRules: [],
    agentReviews: [],
    finalDecision: item.status,
    decisionReason: item.reason,
    simulation: null,
    txHash: item.txHash,
  };
}

function fallbackAttempt(item: AuditLogItem, decisionChain: DecisionChain): AttemptRecord {
  return {
    attemptIndex: 1,
    proposal: decisionChain.agentProposal.proposal,
    hardRules: decisionChain.hardRules,
    agentReviews: decisionChain.agentReviews,
    decision: statusToBackendDecision(item.status),
    decisionReason: item.reason,
    suggestions: [],
    rejectionSource: item.status === "rejected" ? "sentinel" : "none",
  };
}

function fallbackExecution(item: AuditLogItem): ExecutionResult {
  return {
    backend: "mock",
    status: statusToExecutionStatus(item.status, item.txHash),
    requestId: null,
    txHash: item.txHash,
    reason: item.reason,
  };
}

function statusToBackendDecision(status: AuditLogItem["status"]): BackendDecision {
  if (status === "confirm_needed") {
    return "confirm";
  }

  if (status === "executed") {
    return "execute";
  }

  return "reject";
}

function statusToExecutionStatus(status: AuditLogItem["status"], txHash: string | null): ExecutionResult["status"] {
  if (status === "executed") {
    return txHash ? "succeeded" : "not_submitted";
  }

  if (status === "confirm_needed") {
    return "dry_run";
  }

  if (status === "failed") {
    return "failed";
  }

  return "policy_denied";
}
