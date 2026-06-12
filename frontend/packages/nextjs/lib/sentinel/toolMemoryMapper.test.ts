import { mapBackendExecuteResponse } from "./backendMapper";
import type { BackendExecuteResponse, MemoryAnomaly, ToolCallEvidence } from "./types";

const backendResponseWithEvidence: BackendExecuteResponse = {
  tx_id: "demo-tools",
  status: "executed",
  decision: "execute",
  decision_reason: "All Sentinel checks passed.",
  attempts: [],
  decision_chain: null,
  execution: {
    backend: "caw",
    status: "dry_run",
    request_id: "sentinel-demo-tools",
    tx_hash: null,
    wallet_id: "wallet_123",
    wallet_address: "0x1111111111111111111111111111111111111111",
    pact_id: "pact_123",
  },
  tool_calls: [
    {
      agent: "SecurityAuditor",
      tool: "check_contract_verified",
      status: "succeeded",
      result: {
        address: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
        verified: true,
      },
    },
  ],
  memory_anomalies: [
    {
      kind: "amount_above_average",
      severity: "warning",
      reason: "Current amount is 6.2x the user's average transfer amount.",
    },
  ],
};

const mappedResponse = mapBackendExecuteResponse(backendResponseWithEvidence, "Send 0.001 ETH");
const toolCall = mappedResponse.toolCalls[0] satisfies ToolCallEvidence | undefined;
const memoryAnomaly = mappedResponse.memoryAnomalies[0] satisfies MemoryAnomaly | undefined;

if (toolCall?.tool !== "check_contract_verified" || toolCall.status !== "succeeded") {
  throw new Error("Expected mapper to preserve backend tool call evidence.");
}

if (memoryAnomaly?.kind !== "amount_above_average" || memoryAnomaly.severity !== "warning") {
  throw new Error("Expected mapper to preserve backend memory anomaly evidence.");
}

const backendResponseWithAgentToolCalls: BackendExecuteResponse = {
  ...backendResponseWithEvidence,
  tx_id: "demo-agent-tools",
  attempts: [
    {
      attempt_index: 1,
      proposal: {
        action: "swap",
        amount: "0.0005",
        from_token: "ETH",
        to_token: "USDC",
        to_contract: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
      },
      hard_rules: [],
      security_audit: {
        agent_name: "SecurityAuditor",
        passed: true,
        risk_level: "low",
        findings: ["Contract registry check passed."],
        reasoning: "Security tools found the router verified.",
        suggestions: [],
        tool_calls: [
          {
            agent: "SecurityAuditor",
            tool: "check_contract_verified",
            status: "succeeded",
            result: { verified: true },
          },
        ],
      },
      risk_analysis: {
        agent_name: "RiskAnalyst",
        passed: true,
        risk_level: "low",
        findings: ["Gas and price context checked."],
        reasoning: "Risk tools found normal execution context.",
        suggestions: [],
        tool_calls: [
          {
            agent: "RiskAnalyst",
            tool: "check_gas_price",
            status: "succeeded",
            result: { gas_price_gwei: "12.4" },
          },
        ],
      },
      decision: {
        decision: "execute",
        reason: "Transaction meets all criteria for execution.",
        suggestions: [],
      },
      rejection_source: "none",
    },
  ],
};

const mappedAgentTools = mapBackendExecuteResponse(backendResponseWithAgentToolCalls, "Swap 0.0005 ETH to USDC");

if (mappedAgentTools.decisionChain.agentReviews[0]?.toolCalls?.[0]?.name !== "check_contract_verified") {
  throw new Error("Expected mapper to expose SecurityAuditor tool calls inside Agent B details.");
}

if (mappedAgentTools.decisionChain.agentReviews[1]?.toolCalls?.[0]?.name !== "check_gas_price") {
  throw new Error("Expected mapper to expose RiskAnalyst tool calls inside Agent C details.");
}
