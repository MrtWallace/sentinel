import { draftToRiskConfig, getPactSyncMessage, riskConfigToDraft } from "./configViewModel";
import type { RiskConfig } from "./types";

const config: RiskConfig = {
  swapAmountThresholdPass: "0.05",
  swapAmountThresholdConfirm: "0.2",
  transferAmountThresholdPass: "0.02",
  transferAmountThresholdConfirm: "0.1",
  slippageThresholdPass: 0.03,
  slippageThresholdConfirm: 0.05,
  frequencyLimit: 3,
  whitelistMode: "open",
  customWhitelist: ["0x1111111111111111111111111111111111111111", "0x2222222222222222222222222222222222222222"],
  autoApproveLowRisk: false,
};

const draft = riskConfigToDraft(config);

if (draft.whitelistMode !== "open" || draft.frequencyLimit !== "3") {
  throw new Error("Expected risk config draft to preserve editable Settings values.");
}

const mappedConfig = draftToRiskConfig({
  ...draft,
  customWhitelist: "0x3333333333333333333333333333333333333333, 0x4444444444444444444444444444444444444444",
});

if (mappedConfig.customWhitelist?.length !== 2) {
  throw new Error("Expected Settings whitelist draft to parse comma-separated addresses.");
}

if (getPactSyncMessage("synced").title !== "CAW Pact synced") {
  throw new Error("Expected synced config status to show CAW Pact synced.");
}

if (getPactSyncMessage("needs_pact_update").title !== "CAW Pact update required") {
  throw new Error("Expected dirty config status to show CAW Pact update required.");
}
