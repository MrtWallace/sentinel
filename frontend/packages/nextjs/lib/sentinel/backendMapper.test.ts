import { mapBackendExecuteResponse } from "./backendMapper";
import type { BackendExecuteResponse, ExecuteResponse } from "./types";

const backendRetryResponse: BackendExecuteResponse = {
  tx_id: "demo-retry",
  status: "executed",
  decision: "execute",
  decision_reason: "Transaction meets all criteria for execution.",
  attempts: [
    {
      attempt_index: 1,
      proposal: {
        action: "swap",
        amount: "0.2",
        from_token: "ETH",
        to_token: "USDC",
        to_contract: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
        slippage: 0.03,
        expected_output: null,
        deadline: 300,
        reasoning: "Initial proposal.",
        recipient: null,
      },
      hard_rules: [
        {
          rule_name: "AmountRule",
          status: "confirm",
          reason: "Swap amount requires confirmation",
          severity: "warning",
        },
      ],
      security_audit: null,
      risk_analysis: {
        agent_name: "RiskAnalyst",
        passed: false,
        risk_level: "high",
        findings: ["Transaction amount creates high exposure"],
        reasoning: "Amount is too high for autonomous execution.",
        suggestions: [
          {
            field: "amount",
            suggested_value: "0.01",
            reason: "Reduce amount to lower exposure.",
            rejection_code: "amount_too_high",
          },
        ],
      },
      decision: {
        decision: "reject",
        reason: "Agents flagged the transaction: RiskAnalyst",
        suggestions: [
          {
            field: "amount",
            suggested_value: "0.01",
            reason: "Reduce amount to lower exposure.",
            rejection_code: "amount_too_high",
          },
        ],
      },
      rejection_source: "sentinel",
    },
    {
      attempt_index: 2,
      proposal: {
        action: "swap",
        amount: "0.01",
        from_token: "ETH",
        to_token: "USDC",
        to_contract: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
        slippage: 0.03,
        expected_output: null,
        deadline: 300,
        reasoning: "Revised proposal.",
        recipient: null,
      },
      hard_rules: [],
      security_audit: null,
      risk_analysis: null,
      decision: {
        decision: "execute",
        reason: "Transaction meets all criteria for execution.",
        suggestions: [],
      },
      rejection_source: "none",
    },
  ],
  decision_chain: null,
  execution: {
    backend: "mock",
    status: "not_submitted",
    request_id: null,
    tx_hash: null,
    reason: "CP5 minimal API does not submit CAW transactions yet.",
  },
};

const mappedRetryResponse: ExecuteResponse = mapBackendExecuteResponse(backendRetryResponse, "Swap 0.2 ETH to USDC");

if (mappedRetryResponse.attempts.length !== 2) {
  throw new Error("Expected mapper to preserve backend attempts.");
}

if (mappedRetryResponse.attempts[0]?.agentReviews[0]?.suggestions[0]?.suggestedValue !== "0.01") {
  throw new Error("Expected mapper to expose reviewer suggestions in camelCase.");
}

if (mappedRetryResponse.execution.status !== "not_submitted") {
  throw new Error("Expected mapper to expose execution status.");
}
