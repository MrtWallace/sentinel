import type {
  AttemptRecord,
  AuditLogItem,
  CawWalletBinding,
  DecisionChain,
  ExecuteResponse,
  ExecutionResult,
  IntentScenario,
  RiskConfigResponse,
} from "~~/lib/sentinel/types";

export const DEMO_USER_ADDRESS = "0x1111111111111111111111111111111111111111";

export const MOCK_WALLET_BINDINGS = {
  none: {
    userAddress: DEMO_USER_ADDRESS,
    walletStatus: "none",
    pairingStatus: "none",
    pactStatus: "none",
    configStatus: "synced",
  },
  pairingPending: {
    userAddress: DEMO_USER_ADDRESS,
    walletStatus: "pairing_pending",
    pairingStatus: "pending",
    pactStatus: "none",
    configStatus: "synced",
    cawWalletId: "wallet_pairing_demo",
    pairingUrl: "cobo://pair/sentinel-demo",
    expiresAt: "2026-06-07T04:30:00Z",
  },
  paired: {
    userAddress: DEMO_USER_ADDRESS,
    walletStatus: "paired",
    pairingStatus: "paired",
    pactStatus: "none",
    configStatus: "synced",
    cawWalletId: "wallet_paired_demo",
    cawWalletAddress: "0xCAFE00000000000000000000000000000000CAFE",
  },
  pactPending: {
    userAddress: DEMO_USER_ADDRESS,
    walletStatus: "paired",
    pairingStatus: "paired",
    pactStatus: "pending_approval",
    configStatus: "needs_pact_update",
    cawWalletId: "wallet_pact_demo",
    cawWalletAddress: "0xCAFE00000000000000000000000000000000CAFE",
    pactId: "pact_pending_demo",
  },
  active: {
    userAddress: DEMO_USER_ADDRESS,
    walletStatus: "active",
    pairingStatus: "paired",
    pactStatus: "active",
    configStatus: "synced",
    cawWalletId: "wallet_active_demo",
    cawWalletAddress: "0xCAFE00000000000000000000000000000000CAFE",
    pactId: "pact_active_demo",
    pactLimits: {
      transferAmountThresholdConfirm: "0.1",
      swapAmountThresholdConfirm: "0.2",
      frequencyLimit: 3,
    },
  },
  revoked: {
    userAddress: DEMO_USER_ADDRESS,
    walletStatus: "revoked",
    pairingStatus: "paired",
    pactStatus: "revoked",
    configStatus: "needs_pact_update",
    cawWalletId: "wallet_revoked_demo",
    cawWalletAddress: "0xCAFE00000000000000000000000000000000CAFE",
    pactId: "pact_revoked_demo",
  },
  expired: {
    userAddress: DEMO_USER_ADDRESS,
    walletStatus: "expired",
    pairingStatus: "failed",
    pactStatus: "expired",
    configStatus: "needs_pact_update",
    cawWalletId: "wallet_expired_demo",
    cawWalletAddress: "0xCAFE00000000000000000000000000000000CAFE",
    pactId: "pact_expired_demo",
  },
} as const satisfies Record<string, CawWalletBinding>;

export const MOCK_RISK_CONFIG: RiskConfigResponse = {
  userAddress: DEMO_USER_ADDRESS,
  configStatus: "synced",
  configVersion: 3,
  pactConfigVersion: 3,
  config: {
    swapAmountThresholdPass: "0.05",
    swapAmountThresholdConfirm: "0.2",
    transferAmountThresholdPass: "0.02",
    transferAmountThresholdConfirm: "0.1",
    slippageThresholdPass: 0.03,
    slippageThresholdConfirm: 0.05,
    frequencyLimit: 3,
    whitelistMode: "strict",
    customWhitelist: [],
    autoApproveLowRisk: true,
  },
};

export const DEMO_INTENTS: Record<IntentScenario, string> = {
  safe_swap: "Swap 0.01 ETH to USDC",
  agent_retry_swap: "Swap 0.2 ETH to USDC",
  blocked_swap: "Swap 1 ETH to USDC",
  confirm_transfer: "Send 0.03 ETH to 0x742d...",
};

const mockExecutionNotSubmitted: ExecutionResult = {
  backend: "mock",
  status: "not_submitted",
  requestId: null,
  txHash: null,
  reason: "CP4.5 mock mirrors the backend minimal API before CAW submission is enabled.",
};

const emptyEvidence = {
  toolCalls: [],
  memoryAnomalies: [],
} satisfies Pick<ExecuteResponse, "toolCalls" | "memoryAnomalies">;

const safeSwapChain: DecisionChain = {
  agentProposal: {
    agent: "Agent A",
    proposal: {
      action: "swap",
      amount: "0.01 ETH",
      fromToken: "ETH",
      toToken: "USDC",
      tokenPair: "ETH / USDC",
      targetContract: "Uniswap V3 SwapRouter",
      slippage: "3%",
      expectedOutput: "24.69 USDC",
    },
    reasoning: "The user requested a small ETH to USDC swap. The target router is allowlisted for the Sepolia demo.",
  },
  hardRules: [
    {
      rule: "SlippageRule",
      passed: true,
      severity: "pass",
      reason: "3% slippage is below the 5% rejection threshold.",
    },
    {
      rule: "AmountRule",
      passed: true,
      severity: "pass",
      reason: "0.01 ETH is below the daily execution policy.",
    },
    {
      rule: "TargetRule",
      passed: true,
      severity: "pass",
      reason: "Uniswap V3 SwapRouter is allowlisted for this demo.",
    },
  ],
  agentReviews: [
    {
      agent: "Agent B",
      role: "Security Auditor",
      passed: true,
      riskLevel: "low",
      findings: ["No prompt-injection pattern detected", "Target contract matches the allowlist"],
      reasoning: "Security review found no suspicious authorization or contract-routing pattern.",
      suggestions: [],
    },
    {
      agent: "Agent C",
      role: "Risk Analyst",
      passed: true,
      riskLevel: "low",
      findings: ["Trade size is small", "Expected output is within tolerance"],
      reasoning: "The proposed swap is inside the demo risk budget and market assumptions.",
      suggestions: [],
    },
  ],
  finalDecision: "executed",
  decisionReason: "All hard rules and both agent reviews passed.",
  simulation: {
    success: true,
    gasEstimate: 152340,
  },
  txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
};

const agentRetryChain: DecisionChain = {
  agentProposal: {
    agent: "Agent A",
    proposal: {
      action: "swap",
      amount: "0.01",
      fromToken: "ETH",
      toToken: "USDC",
      tokenPair: "ETH / USDC",
      targetContract: "Uniswap V3 SwapRouter",
      slippage: "3%",
      expectedOutput: "After reproposal",
      deadline: "300s",
    },
    reasoning: "AgenticLoop revised the original 0.2 ETH proposal down to 0.01 ETH after risk review.",
  },
  hardRules: [
    {
      rule: "AmountRule",
      passed: true,
      severity: "pass",
      reason: "Revised swap amount is within the autonomous execution limit.",
    },
    {
      rule: "SlippageRule",
      passed: true,
      severity: "pass",
      reason: "3% slippage is within the acceptable range.",
    },
    {
      rule: "WhitelistRule",
      passed: true,
      severity: "pass",
      reason: "Uniswap V3 SwapRouter is allowlisted.",
    },
  ],
  agentReviews: [
    {
      agent: "Agent B",
      role: "Security Auditor",
      passed: true,
      riskLevel: "low",
      findings: [],
      reasoning: "Mock security auditor found no issues.",
      suggestions: [],
    },
    {
      agent: "Agent C",
      role: "Risk Analyst",
      passed: true,
      riskLevel: "low",
      findings: [],
      reasoning: "Amount is within autonomous execution limits after reproposal.",
      suggestions: [],
    },
  ],
  finalDecision: "executed",
  decisionReason: "Transaction meets all criteria for execution after one bounded reproposal.",
  simulation: {
    success: true,
  },
  txHash: null,
};

const blockedSwapChain: DecisionChain = {
  agentProposal: {
    agent: "Agent A",
    proposal: {
      action: "swap",
      amount: "1 ETH",
      fromToken: "ETH",
      toToken: "USDC",
      tokenPair: "ETH / USDC",
      targetContract: "Uniswap V3 SwapRouter",
      slippage: "8%",
      expectedOutput: "2469.00 USDC",
    },
    reasoning: "The user requested a large ETH to USDC swap, which must be checked against hard policy limits.",
  },
  hardRules: [
    {
      rule: "SlippageRule",
      passed: false,
      severity: "reject",
      reason: "8% slippage is above the 5% rejection threshold.",
    },
    {
      rule: "AmountRule",
      passed: false,
      severity: "reject",
      reason: "1 ETH exceeds the demo daily swap policy.",
    },
  ],
  agentReviews: [],
  finalDecision: "rejected",
  decisionReason: "Hard rules rejected the intent before agent review or execution.",
  simulation: null,
  txHash: null,
};

const confirmTransferChain: DecisionChain = {
  agentProposal: {
    agent: "Agent A",
    proposal: {
      action: "transfer",
      amount: "0.08 ETH",
      tokenPair: "ETH transfer",
      targetContract: "SmartAccount.execute",
      recipient: "0x742d...f44e",
      expectedOutput: "Audit-only transfer proposal",
    },
    reasoning: "The user requested an ETH transfer. Recipient context is incomplete, so the intent needs review.",
  },
  hardRules: [
    {
      rule: "AmountRule",
      passed: true,
      severity: "confirm",
      reason: "0.08 ETH is under the rejection limit but requires operator confirmation.",
    },
    {
      rule: "TargetRule",
      passed: true,
      severity: "pass",
      reason: "Recipient is not on the local deny list.",
    },
    {
      rule: "PolicyRule",
      passed: true,
      severity: "confirm",
      reason: "Recipient context requires explicit operator approval.",
    },
  ],
  agentReviews: [
    {
      agent: "Agent B",
      role: "Security Auditor",
      passed: true,
      riskLevel: "low",
      findings: ["No prompt-injection pattern detected", "No suspicious approval request"],
      reasoning: "Security review found no exploit pattern, but the recipient has limited context.",
      suggestions: [],
    },
    {
      agent: "Agent C",
      role: "Risk Analyst",
      passed: false,
      riskLevel: "medium",
      findings: ["Transfer amount is near confirmation threshold", "Recipient context needs operator approval"],
      reasoning: "Risk review requests human confirmation before finalizing the audit state.",
      suggestions: [],
    },
  ],
  finalDecision: "confirm_needed",
  decisionReason: "Risk review requires operator confirmation.",
  simulation: {
    success: true,
    gasEstimate: 61120,
  },
  txHash: null,
  confirmation: {
    required: true,
    reason: "Recipient context requires operator approval.",
    riskNote:
      "MVP confirmation records the operator decision in audit state and does not imply real on-chain execution.",
  },
};

const cawPolicyDenyChain: DecisionChain = {
  agentProposal: {
    agent: "Agent A",
    proposal: {
      action: "transfer",
      amount: "0.005 ETH",
      tokenPair: "ETH transfer",
      targetContract: "CAW transfer",
      recipient: "0x1111111111111111111111111111111111111111",
      expectedOutput: "CAW transfer request",
    },
    reasoning: "Sentinel allowed a small transfer proposal and submitted it to the CAW execution backend.",
  },
  hardRules: [
    {
      rule: "AmountRule",
      passed: true,
      severity: "pass",
      reason: "0.005 ETH is inside the Sentinel autonomous transfer limit.",
    },
    {
      rule: "WhitelistRule",
      passed: true,
      severity: "pass",
      reason: "Recipient is valid for Sentinel risk evaluation.",
    },
  ],
  agentReviews: [
    {
      agent: "Agent B",
      role: "Security Auditor",
      passed: true,
      riskLevel: "low",
      findings: ["No malicious calldata detected"],
      reasoning: "Security review found no browser-side or contract-routing anomaly.",
      suggestions: [],
    },
    {
      agent: "Agent C",
      role: "Risk Analyst",
      passed: true,
      riskLevel: "low",
      findings: ["Amount is low"],
      reasoning: "Risk review allowed submission to CAW, where Pact policy remains the final enforcement layer.",
      suggestions: [],
    },
  ],
  finalDecision: "rejected",
  decisionReason: "CAW policy denied execution: matched_pact_transfer_deny_if",
  simulation: {
    success: true,
  },
  txHash: null,
};

const safeSwapAttempts: AttemptRecord[] = [
  {
    attemptIndex: 1,
    proposal: safeSwapChain.agentProposal.proposal,
    hardRules: safeSwapChain.hardRules,
    agentReviews: safeSwapChain.agentReviews,
    decision: "execute",
    decisionReason: safeSwapChain.decisionReason,
    suggestions: [],
    rejectionSource: "none",
  },
];

const agentRetryAttempts: AttemptRecord[] = [
  {
    attemptIndex: 1,
    proposal: {
      action: "swap",
      amount: "0.2",
      fromToken: "ETH",
      toToken: "USDC",
      tokenPair: "ETH / USDC",
      targetContract: "Uniswap V3 SwapRouter",
      slippage: "3%",
      deadline: "300s",
      reasoning: "Initial proposal from deterministic parser.",
    },
    hardRules: [
      {
        rule: "AmountRule",
        passed: true,
        severity: "confirm",
        reason: "Swap amount requires confirmation.",
      },
      {
        rule: "SlippageRule",
        passed: true,
        severity: "pass",
        reason: "Slippage within acceptable range.",
      },
    ],
    agentReviews: [
      {
        agent: "Agent B",
        role: "Security Auditor",
        passed: true,
        riskLevel: "low",
        findings: [],
        reasoning: "Mock security auditor found no issues.",
        suggestions: [],
      },
      {
        agent: "Agent C",
        role: "Risk Analyst",
        passed: false,
        riskLevel: "high",
        findings: ["Transaction amount creates high exposure"],
        reasoning: "Amount is too high for autonomous execution.",
        suggestions: [
          {
            field: "amount",
            suggestedValue: "0.01",
            reason: "Reduce amount to lower exposure.",
            rejectionCode: "amount_too_high",
          },
        ],
      },
    ],
    decision: "reject",
    decisionReason: "Agents flagged the transaction: RiskAnalyst",
    suggestions: [
      {
        field: "amount",
        suggestedValue: "0.01",
        reason: "Reduce amount to lower exposure.",
        rejectionCode: "amount_too_high",
      },
    ],
    rejectionSource: "sentinel",
  },
  {
    attemptIndex: 2,
    proposal: agentRetryChain.agentProposal.proposal,
    hardRules: agentRetryChain.hardRules,
    agentReviews: agentRetryChain.agentReviews,
    decision: "execute",
    decisionReason: agentRetryChain.decisionReason,
    suggestions: [],
    rejectionSource: "none",
  },
];

const blockedSwapAttempts: AttemptRecord[] = [
  {
    attemptIndex: 1,
    proposal: blockedSwapChain.agentProposal.proposal,
    hardRules: blockedSwapChain.hardRules,
    agentReviews: [],
    decision: "reject",
    decisionReason: blockedSwapChain.decisionReason,
    suggestions: [],
    rejectionSource: "sentinel",
  },
];

const confirmTransferAttempts: AttemptRecord[] = [
  {
    attemptIndex: 1,
    proposal: confirmTransferChain.agentProposal.proposal,
    hardRules: confirmTransferChain.hardRules,
    agentReviews: confirmTransferChain.agentReviews,
    decision: "confirm",
    decisionReason: confirmTransferChain.decisionReason,
    suggestions: [],
    rejectionSource: "none",
  },
];

const cawPolicyDenyAttempts: AttemptRecord[] = [
  {
    attemptIndex: 1,
    proposal: cawPolicyDenyChain.agentProposal.proposal,
    hardRules: cawPolicyDenyChain.hardRules,
    agentReviews: cawPolicyDenyChain.agentReviews,
    decision: "execute",
    decisionReason: "Sentinel allowed submission to CAW.",
    suggestions: [],
    rejectionSource: "caw",
  },
];

export const MOCK_EXECUTE_RESPONSES: Record<IntentScenario, ExecuteResponse> = {
  safe_swap: {
    txId: "demo-001",
    timestamp: "2026-05-28T09:42:18.000Z",
    intent: DEMO_INTENTS.safe_swap,
    status: "executed",
    reason: "All checks passed.",
    decisionChain: safeSwapChain,
    attempts: safeSwapAttempts,
    execution: {
      ...mockExecutionNotSubmitted,
      txHash: safeSwapChain.txHash,
    },
    ...emptyEvidence,
  },
  agent_retry_swap: {
    txId: "demo-002",
    timestamp: "2026-05-28T09:39:10.000Z",
    intent: DEMO_INTENTS.agent_retry_swap,
    status: "executed",
    reason: "AgenticLoop revised the risky proposal and then executed.",
    decisionChain: agentRetryChain,
    attempts: agentRetryAttempts,
    execution: mockExecutionNotSubmitted,
    ...emptyEvidence,
  },
  blocked_swap: {
    txId: "demo-003",
    timestamp: "2026-05-28T09:37:04.000Z",
    intent: DEMO_INTENTS.blocked_swap,
    status: "rejected",
    reason: "Hard rule violation: SlippageRule and AmountRule.",
    decisionChain: blockedSwapChain,
    attempts: blockedSwapAttempts,
    execution: mockExecutionNotSubmitted,
    ...emptyEvidence,
  },
  confirm_transfer: {
    txId: "demo-004",
    timestamp: "2026-05-28T09:31:55.000Z",
    intent: DEMO_INTENTS.confirm_transfer,
    status: "confirm_needed",
    reason: "Manual approval required.",
    decisionChain: confirmTransferChain,
    attempts: confirmTransferAttempts,
    execution: mockExecutionNotSubmitted,
    ...emptyEvidence,
  },
};

export const MOCK_AUDIT_LOG: AuditLogItem[] = [
  responseToAuditItem(MOCK_EXECUTE_RESPONSES.safe_swap),
  responseToAuditItem(MOCK_EXECUTE_RESPONSES.agent_retry_swap),
  responseToAuditItem(MOCK_EXECUTE_RESPONSES.blocked_swap),
  responseToAuditItem(MOCK_EXECUTE_RESPONSES.confirm_transfer),
  {
    txId: "demo-005",
    timestamp: "2026-05-28T09:27:33.000Z",
    intent: "Send 0.005 ETH to 0x1111111111111111111111111111111111111111",
    status: "rejected",
    reason: "CAW policy denied execution: matched_pact_transfer_deny_if",
    txHash: null,
    executionBackend: "caw",
    executionStatus: "policy_denied",
    decisionChain: cawPolicyDenyChain,
    attempts: cawPolicyDenyAttempts,
    execution: {
      backend: "caw",
      status: "policy_denied",
      requestId: "sentinel-demo-request-005",
      txId: null,
      txHash: null,
      reason: "matched_pact_transfer_deny_if",
      walletId: "wallet_active_demo",
      walletAddress: "0xCAFE00000000000000000000000000000000CAFE",
      pactId: "pact_active_demo",
      policyReason: "TRANSFER_LIMIT_EXCEEDED",
      raw: {
        user_address: DEMO_USER_ADDRESS,
        pact_status: "active",
      },
    },
    ...emptyEvidence,
  },
  {
    txId: "demo-006",
    timestamp: "2026-05-28T09:22:11.000Z",
    intent: "Quote WETH to USDC",
    status: "failed",
    reason: "Request timed out.",
    txHash: null,
    decisionChain: {
      ...blockedSwapChain,
      finalDecision: "failed",
      decisionReason: "Request timed out before risk pipeline completion.",
      simulation: {
        success: false,
        parsedReason: "Request timed out.",
      },
    },
    attempts: blockedSwapAttempts,
    execution: {
      ...mockExecutionNotSubmitted,
      status: "failed",
      reason: "Request timed out before CAW submission.",
    },
    ...emptyEvidence,
  },
];

export function responseToAuditItem(response: ExecuteResponse): AuditLogItem {
  return {
    txId: response.txId,
    timestamp: response.timestamp,
    intent: response.intent,
    status: response.status,
    reason: response.reason,
    txHash: response.decisionChain.txHash,
    executionBackend: response.execution.backend,
    executionStatus: response.execution.status,
    decisionChain: response.decisionChain,
    attempts: response.attempts,
    execution: response.execution,
    toolCalls: response.toolCalls,
    memoryAnomalies: response.memoryAnomalies,
  };
}
