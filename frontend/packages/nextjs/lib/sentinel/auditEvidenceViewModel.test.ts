import { getAuditEvidenceLabel, getCawAuditEvidence, isCawPolicyDenied } from "./auditEvidenceViewModel";
import type { AuditLogItem, ExecuteResponse } from "./types";

const policyDeniedResponse: ExecuteResponse = {
  txId: "audit-policy-deny",
  timestamp: "2026-06-07T00:45:00.000Z",
  intent: "Send 0.005 ETH to 0x1111111111111111111111111111111111111111",
  status: "rejected",
  reason: "CAW policy denied execution.",
  decisionChain: {
    agentProposal: {
      agent: "Agent A",
      proposal: {
        action: "transfer",
        amount: "0.005",
        targetContract: "CAW transfer",
        recipient: "0x1111111111111111111111111111111111111111",
      },
      reasoning: "Sentinel allowed a small transfer proposal.",
    },
    hardRules: [],
    agentReviews: [],
    finalDecision: "rejected",
    decisionReason: "CAW policy denied execution: matched_pact_transfer_deny_if",
    simulation: null,
    txHash: null,
  },
  attempts: [],
  execution: {
    backend: "caw",
    status: "policy_denied",
    requestId: "sentinel-request-001",
    txId: null,
    txHash: null,
    reason: "matched_pact_transfer_deny_if",
    walletId: "wallet_123",
    walletAddress: "0xCAW000000000000000000000000000000000000",
    pactId: "pact_123",
    policyReason: "TRANSFER_LIMIT_EXCEEDED",
    raw: {
      user_address: "0x1111111111111111111111111111111111111111",
      pact_status: "active",
    },
  },
  toolCalls: [],
  memoryAnomalies: [],
};

if (!isCawPolicyDenied(policyDeniedResponse.execution)) {
  throw new Error("Expected CAW policy_denied execution to be detected distinctly.");
}

const policyEvidence = getCawAuditEvidence(policyDeniedResponse);
const policyPointLabels = policyEvidence.points.map(point => point.label);

if (!policyEvidence.isPolicyDenied || policyEvidence.title !== "Sentinel allowed, CAW Pact blocked execution") {
  throw new Error("Expected CAW policy deny copy to stay distinct from Sentinel rejection.");
}

for (const expectedLabel of ["User Address", "CAW Wallet ID", "Pact ID", "Request ID", "Transaction ID"]) {
  if (!policyPointLabels.includes(expectedLabel)) {
    throw new Error(`Expected CAW evidence to include ${expectedLabel}.`);
  }
}

if (policyEvidence.explorerLinks.length !== 0) {
  throw new Error("Expected CAW request evidence to avoid fake explorer links when no tx hash exists.");
}

const summaryItem: AuditLogItem = {
  txId: "audit-policy-deny",
  timestamp: "2026-06-07T00:45:00.000Z",
  intent: policyDeniedResponse.intent,
  status: "rejected",
  reason: policyDeniedResponse.reason,
  txHash: null,
  executionBackend: "caw",
  executionStatus: "policy_denied",
};

if (getAuditEvidenceLabel(summaryItem) !== "CAW policy denied") {
  throw new Error("Expected audit table evidence label to expose policy_denied rows.");
}
