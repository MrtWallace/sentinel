import type { ConfigStatus, RiskConfig } from "./types";

export type RiskConfigDraft = {
  swapAmountThresholdPass: string;
  swapAmountThresholdConfirm: string;
  transferAmountThresholdPass: string;
  transferAmountThresholdConfirm: string;
  slippageThresholdPass: string;
  slippageThresholdConfirm: string;
  frequencyLimit: string;
  whitelistMode: "strict" | "open";
  customWhitelist: string;
  autoApproveLowRisk: boolean;
};

export function riskConfigToDraft(config: RiskConfig): RiskConfigDraft {
  return {
    swapAmountThresholdPass: config.swapAmountThresholdPass ?? "",
    swapAmountThresholdConfirm: config.swapAmountThresholdConfirm ?? "",
    transferAmountThresholdPass: config.transferAmountThresholdPass ?? "",
    transferAmountThresholdConfirm: config.transferAmountThresholdConfirm ?? "",
    slippageThresholdPass: numberToInput(config.slippageThresholdPass),
    slippageThresholdConfirm: numberToInput(config.slippageThresholdConfirm),
    frequencyLimit: numberToInput(config.frequencyLimit),
    whitelistMode: config.whitelistMode === "open" ? "open" : "strict",
    customWhitelist: (config.customWhitelist ?? []).join("\n"),
    autoApproveLowRisk: config.autoApproveLowRisk ?? true,
  };
}

export function draftToRiskConfig(draft: RiskConfigDraft): RiskConfig {
  return {
    swapAmountThresholdPass: draft.swapAmountThresholdPass.trim(),
    swapAmountThresholdConfirm: draft.swapAmountThresholdConfirm.trim(),
    transferAmountThresholdPass: draft.transferAmountThresholdPass.trim(),
    transferAmountThresholdConfirm: draft.transferAmountThresholdConfirm.trim(),
    slippageThresholdPass: parseNumberDraft(draft.slippageThresholdPass),
    slippageThresholdConfirm: parseNumberDraft(draft.slippageThresholdConfirm),
    frequencyLimit: parseNumberDraft(draft.frequencyLimit),
    whitelistMode: draft.whitelistMode,
    customWhitelist: parseWhitelistDraft(draft.customWhitelist),
    autoApproveLowRisk: draft.autoApproveLowRisk,
  };
}

export function getPactSyncMessage(status: ConfigStatus): { title: string; body: string; tone: "synced" | "warning" } {
  if (status === "needs_pact_update") {
    return {
      title: "CAW Pact update required",
      body: "Sentinel config was updated. CAW Pact policy must be synced before infrastructure enforcement matches it.",
      tone: "warning",
    };
  }

  return {
    title: "CAW Pact synced",
    body: "Sentinel config and CAW Pact policy versions are aligned.",
    tone: "synced",
  };
}

function numberToInput(value: number | undefined): string {
  return typeof value === "number" ? String(value) : "";
}

function parseNumberDraft(value: string): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseWhitelistDraft(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
}
