import type { AuditLogItem, ExecuteResponse, ExecutionResult } from "./types";

export type EvidenceTone = "neutral" | "success" | "warning" | "danger";

export type EvidencePoint = {
  label: string;
  value: string;
  tone?: EvidenceTone;
};

export type ExplorerLink = {
  label: string;
  href: string;
};

export type CawAuditEvidence = {
  title: string;
  body: string;
  isPolicyDenied: boolean;
  points: EvidencePoint[];
  explorerLinks: ExplorerLink[];
};

export function getAuditEvidenceLabel(item: AuditLogItem): string {
  if (item.txHash) {
    return shortHash(item.txHash);
  }

  if (item.executionStatus === "policy_denied") {
    return "CAW policy denied";
  }

  if (item.executionBackend) {
    return `${item.executionBackend}:${item.executionStatus ?? "pending"}`;
  }

  if (item.status === "executed") {
    return "CAW/mock evidence";
  }

  if (item.status === "confirm_needed") {
    return "Audit only";
  }

  return "None";
}

export function getCawAuditEvidence(response: ExecuteResponse, userAddress?: string): CawAuditEvidence {
  const execution = response.execution;
  const isPolicyDenied = isCawPolicyDenied(execution);
  const txHash = execution.txHash ?? response.decisionChain.txHash;
  const policyReason = execution.policyReason ?? execution.reason ?? response.reason;

  return {
    title: isPolicyDenied ? "Sentinel allowed, CAW Pact blocked execution" : "CAW execution evidence",
    body: isPolicyDenied
      ? "CAW returned policy_denied. Sentinel records the rejected execution without SmartAccount fallback."
      : "Execution evidence returned by the backend for audit replay.",
    isPolicyDenied,
    points: [
      point("User Address", userAddress ?? rawString(execution, "user_address") ?? "N/A"),
      point("Execution Backend", execution.backend),
      point("Execution Status", execution.status, isPolicyDenied ? "danger" : "neutral"),
      point("CAW Wallet ID", execution.walletId ?? "N/A"),
      point("CAW Wallet Address", execution.walletAddress ?? "N/A"),
      point("Pact ID", execution.pactId ?? "N/A"),
      point("Pact Status", rawString(execution, "pact_status") ?? "N/A"),
      point("Request ID", execution.requestId ?? "N/A"),
      point("Transaction ID", execution.txId ?? "N/A"),
      point("TX Hash", txHash ? shortHash(txHash) : "No tx hash returned"),
      point("Policy Reason", policyReason),
    ],
    explorerLinks: txHash
      ? [
          { label: "Sepolia Etherscan", href: `https://sepolia.etherscan.io/tx/${txHash}` },
          { label: "Blockscout backup", href: `https://eth-sepolia.blockscout.com/tx/${txHash}` },
        ]
      : [],
  };
}

export function isCawPolicyDenied(execution: ExecutionResult): boolean {
  return execution.backend === "caw" && execution.status === "policy_denied";
}

function point(label: string, value: string, tone?: EvidenceTone): EvidencePoint {
  return { label, value, tone };
}

function rawString(execution: ExecutionResult, key: string): string | null {
  const value = execution.raw?.[key];

  return typeof value === "string" && value.trim() ? value : null;
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}
