import type { CawWalletBinding, ConfigStatus, PactStatus, PairingStatus, WalletStatus } from "./types";

export type CawLifecycleStage =
  | "none"
  | "pairing_pending"
  | "paired"
  | "pact_pending"
  | "active"
  | "revoked"
  | "expired"
  | "completed";

export type CawStatusSummary = {
  primary: string;
  detail: string;
  tone: "ready" | "pending" | "blocked" | "neutral";
  statusItems: {
    wallet_status: WalletStatus;
    pairing_status: PairingStatus;
    pact_status: PactStatus;
    config_status: ConfigStatus;
    caw_healthy: string;
    wallet_paired: string;
    pending_txs_count: string;
  };
};

export type CawSetupAvailability = {
  canConnectExisting: boolean;
  canCreateWallet: boolean;
  canRefresh: boolean;
};

export type CawHeaderStatusItem = {
  label: "PACT" | "KEY" | "PAIR";
  value: string;
};

export function getCawLifecycleStage(binding: CawWalletBinding | null | undefined): CawLifecycleStage {
  if (!binding || binding.walletStatus === "none") {
    return "none";
  }

  if (binding.walletStatus === "revoked" || binding.pactStatus === "revoked") {
    return "revoked";
  }

  if (binding.pactStatus === "completed") {
    return "completed";
  }

  if (binding.walletStatus === "expired" || binding.pactStatus === "expired") {
    return "expired";
  }

  if (binding.walletStatus === "pairing_pending" || binding.pairingStatus === "pending") {
    return "pairing_pending";
  }

  if (binding.walletPaired === false) {
    return "pairing_pending";
  }

  if (binding.walletStatus === "active" && binding.pactStatus === "active") {
    return "active";
  }

  if (binding.pactStatus === "pending_approval") {
    return "pact_pending";
  }

  if (binding.walletStatus === "paired" || binding.pairingStatus === "paired") {
    return "paired";
  }

  return "none";
}

export function getCawSetupAvailability(binding: CawWalletBinding | null | undefined): CawSetupAvailability {
  const stage = getCawLifecycleStage(binding);
  const canStartSetup = stage === "none" || stage === "revoked" || stage === "expired";

  return {
    canConnectExisting: canStartSetup,
    canCreateWallet: canStartSetup,
    canRefresh: stage !== "none",
  };
}

export function getCawMenuButtonLabel(binding: CawWalletBinding | null | undefined): string {
  switch (getCawLifecycleStage(binding)) {
    case "active":
      return "CAW active";
    case "pairing_pending":
      return "Pairing pending";
    case "paired":
      return "CAW paired";
    case "pact_pending":
      return "Pact pending";
    case "revoked":
    case "expired":
    case "none":
    default:
      return "Connect CAW";
  }
}

export function getCawHeaderStatusItems(binding: CawWalletBinding | null | undefined): CawHeaderStatusItem[] {
  const summary = getCawStatusSummary(binding);

  return [
    {
      label: "PACT",
      value: summary.statusItems.pact_status,
    },
    {
      label: "KEY",
      value: binding?.hasPactApiKey ? "configured" : "missing",
    },
    {
      label: "PAIR",
      value:
        binding?.walletPaired === undefined || binding?.walletPaired === null
          ? "unknown"
          : String(binding.walletPaired),
    },
  ];
}

export function getCawStatusSummary(binding: CawWalletBinding | null | undefined): CawStatusSummary {
  const statusItems = {
    wallet_status: binding?.walletStatus ?? "none",
    pairing_status: binding?.pairingStatus ?? "none",
    pact_status: binding?.pactStatus ?? "none",
    config_status: binding?.configStatus ?? "synced",
    caw_healthy: formatNullableBoolean(binding?.cawHealthy),
    wallet_paired: formatNullableBoolean(binding?.walletPaired),
    pending_txs_count:
      binding?.pendingTxsCount === undefined || binding?.pendingTxsCount === null
        ? "unknown"
        : String(binding.pendingTxsCount),
  };

  switch (getCawLifecycleStage(binding)) {
    case "active":
      return {
        primary: "CAW active",
        detail: "User CAW wallet and Pact are active for CAW-primary execution.",
        tone: "ready",
        statusItems,
      };
    case "pairing_pending":
      return {
        primary: "Pairing pending",
        detail:
          binding?.walletPaired === false
            ? "CAW wallet exists, but CAW owner pairing is not complete."
            : "CAW wallet exists, but pairing still needs approval.",
        tone: "pending",
        statusItems,
      };
    case "paired":
      return {
        primary: "CAW paired",
        detail: "Wallet is paired; Pact approval is not active yet.",
        tone: "pending",
        statusItems,
      };
    case "pact_pending":
      return {
        primary: "Pact approval pending",
        detail: "Sentinel config exists, but CAW Pact approval is still pending.",
        tone: "pending",
        statusItems,
      };
    case "revoked":
      return {
        primary: "CAW revoked",
        detail: "CAW or Pact access was revoked. Reconnect or create a new wallet.",
        tone: "blocked",
        statusItems,
      };
    case "expired":
      return {
        primary: "CAW expired",
        detail: "Pairing or Pact expired. Refresh status or restart setup.",
        tone: "blocked",
        statusItems,
      };
    case "completed":
      return {
        primary: "Pact completed",
        detail: "CAW Pact reached a terminal state. Create a new Pact before execution.",
        tone: "blocked",
        statusItems,
      };
    case "none":
    default:
      return {
        primary: "CAW not connected",
        detail: "Connect an existing CAW wallet or create a persisted user CAW wallet.",
        tone: "neutral",
        statusItems,
      };
  }
}

function formatNullableBoolean(value: boolean | null | undefined): string {
  if (value === undefined || value === null) {
    return "unknown";
  }
  return value ? "true" : "false";
}
