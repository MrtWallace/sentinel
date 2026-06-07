import { auditItemToExecuteResponse } from "./auditViewModel";
import type { AuditLogItem, ExecuteResponse } from "./types";

const detailedAuditItem: AuditLogItem = {
  txId: "audit-retry",
  timestamp: "2026-06-05T13:35:00.000Z",
  intent: "Swap 0.2 ETH to USDC",
  status: "executed",
  reason: "Revised proposal executed.",
  txHash: null,
  decisionChain: {
    agentProposal: {
      agent: "Agent A",
      proposal: {
        action: "swap",
        amount: "0.01",
        fromToken: "ETH",
        toToken: "USDC",
        targetContract: "Uniswap V3 Router",
      },
      reasoning: "Reduced amount after retry suggestion.",
    },
    hardRules: [],
    agentReviews: [],
    finalDecision: "executed",
    decisionReason: "Revised proposal executed.",
    simulation: null,
    txHash: null,
  },
  attempts: [
    {
      attemptIndex: 1,
      proposal: {
        action: "swap",
        amount: "0.2",
        fromToken: "ETH",
        toToken: "USDC",
        targetContract: "Uniswap V3 Router",
      },
      hardRules: [],
      agentReviews: [],
      decision: "reject",
      decisionReason: "Risk exposure too high.",
      suggestions: [
        {
          field: "amount",
          suggestedValue: "0.01",
          reason: "Reduce amount before retry.",
        },
      ],
      rejectionSource: "sentinel",
    },
    {
      attemptIndex: 2,
      proposal: {
        action: "swap",
        amount: "0.01",
        fromToken: "ETH",
        toToken: "USDC",
        targetContract: "Uniswap V3 Router",
      },
      hardRules: [],
      agentReviews: [],
      decision: "execute",
      decisionReason: "Revised proposal executed.",
      suggestions: [],
      rejectionSource: "none",
    },
  ],
  execution: {
    backend: "mock",
    status: "not_submitted",
    requestId: "audit-request",
    txHash: null,
    reason: "Audit replay uses mock execution evidence.",
  },
};

const expandedResponse: ExecuteResponse = auditItemToExecuteResponse(detailedAuditItem);

if (expandedResponse.attempts.length !== 2) {
  throw new Error("Expected audit detail conversion to preserve attempts.");
}

if (expandedResponse.execution.requestId !== "audit-request") {
  throw new Error("Expected audit detail conversion to preserve execution evidence.");
}
