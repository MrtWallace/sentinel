import { mapBackendAuditRecord, mapBackendAuditSummary } from "./backendMapper";
import type { AuditLogItem, BackendAuditLogRecord, BackendAuditLogSummary, ExecuteResponse } from "./types";

const backendSummary: BackendAuditLogSummary = {
  tx_id: "audit-001",
  timestamp: "2026-06-05T14:42:42.314776+00:00",
  intent: "Send 0.03 ETH to 0x742d...",
  status: "confirm_needed",
  decision: "confirm",
  sentinel_decision: "confirm",
  execution_status: "skipped",
  tx_hash: null,
};

const mappedSummary: AuditLogItem = mapBackendAuditSummary(backendSummary);

if (mappedSummary.reason !== "Decision: confirm; execution: skipped") {
  throw new Error("Expected audit summary mapper to synthesize a stable reason label.");
}

const backendRecord: BackendAuditLogRecord = {
  ...backendSummary,
  decision_reason: "Hard rule 'AmountRule' requires confirmation: Transfer amount requires confirmation",
  sentinel_decision_reason: "Hard rule 'AmountRule' requires confirmation: Transfer amount requires confirmation",
  input_proposal: null,
  attempts: [
    {
      attempt_index: 1,
      proposal: {
        action: "transfer",
        amount: "0.03",
        from_token: null,
        to_token: null,
        to_contract: null,
        slippage: null,
        expected_output: null,
        deadline: null,
        reasoning: "Deterministic demo parser generated a transfer proposal.",
        recipient: "0x1111111111111111111111111111111111111111",
      },
      hard_rules: [
        {
          rule_name: "AmountRule",
          status: "confirm",
          reason: "Transfer amount requires confirmation",
          severity: "warning",
        },
      ],
      security_audit: null,
      risk_analysis: null,
      decision: {
        decision: "confirm",
        reason: "Hard rule 'AmountRule' requires confirmation: Transfer amount requires confirmation",
        suggestions: [],
      },
      rejection_source: "none",
    },
  ],
  decision_chain: null,
  execution: {
    backend: "caw",
    status: "skipped",
    request_id: null,
    tx_id: null,
    tx_hash: null,
    reason: "CAW executor only handles transfer, got unknown.",
    policy_reason: null,
    raw: {},
  },
};

const mappedRecord: ExecuteResponse = mapBackendAuditRecord(backendRecord);

if (mappedRecord.timestamp !== backendRecord.timestamp) {
  throw new Error("Expected audit detail mapper to preserve backend timestamp.");
}

if (mappedRecord.decisionChain.confirmation?.required !== true) {
  throw new Error("Expected audit detail mapper to preserve confirm_needed semantics.");
}

if (mappedRecord.execution.status !== "skipped") {
  throw new Error("Expected audit detail mapper to preserve backend execution status.");
}
