import { MOCK_WALLET_BINDINGS } from "./mockData";
import {
  getCawHeaderStatusItems,
  getCawLifecycleStage,
  getCawMenuButtonLabel,
  getCawSetupAvailability,
  getCawStatusSummary,
} from "./walletViewModel";

if (getCawLifecycleStage(MOCK_WALLET_BINDINGS.none) !== "none") {
  throw new Error("Expected unbound wallet to stay in the none lifecycle stage.");
}

if (getCawLifecycleStage(MOCK_WALLET_BINDINGS.pairingPending) !== "pairing_pending") {
  throw new Error("Expected pending pairing to be visible as its own lifecycle stage.");
}

if (getCawLifecycleStage(MOCK_WALLET_BINDINGS.pactPending) !== "pact_pending") {
  throw new Error("Expected pending Pact approval to be visible as pact_pending.");
}

if (getCawLifecycleStage(MOCK_WALLET_BINDINGS.active) !== "active") {
  throw new Error("Expected active wallet and Pact to be visible as active.");
}

const emptySetup = getCawSetupAvailability(MOCK_WALLET_BINDINGS.none);
const activeSetup = getCawSetupAvailability(MOCK_WALLET_BINDINGS.active);

if (!emptySetup.canConnectExisting || !emptySetup.canCreateWallet) {
  throw new Error("Expected unbound users to see both CAW setup paths.");
}

if (activeSetup.canConnectExisting || activeSetup.canCreateWallet) {
  throw new Error("Expected active CAW users to avoid duplicate setup actions.");
}

const activeSummary = getCawStatusSummary(MOCK_WALLET_BINDINGS.active);

if (activeSummary.primary !== "CAW active" || activeSummary.statusItems.wallet_status !== "active") {
  throw new Error("Expected active summary to expose shared contract wallet_status.");
}

if (activeSummary.statusItems.pairing_status !== "paired" || activeSummary.statusItems.config_status !== "synced") {
  throw new Error("Expected active summary to expose pairing and config status.");
}

if (activeSummary.statusItems.wallet_paired !== "true" || activeSummary.statusItems.pending_txs_count !== "0") {
  throw new Error("Expected active summary to expose realtime CAW pairing and pending tx status.");
}

const unpairedActive = {
  ...MOCK_WALLET_BINDINGS.active,
  walletPaired: false,
};

if (getCawLifecycleStage(unpairedActive) !== "pairing_pending") {
  throw new Error("Expected CAW wallet_paired=false to require pairing before execution.");
}

if (getCawMenuButtonLabel(MOCK_WALLET_BINDINGS.none) !== "Connect CAW") {
  throw new Error("Expected empty wallet state to invite CAW connection.");
}

if (getCawMenuButtonLabel(MOCK_WALLET_BINDINGS.active) !== "CAW active") {
  throw new Error("Expected active wallet state to keep the menu button compact.");
}

const headerItems = getCawHeaderStatusItems(MOCK_WALLET_BINDINGS.active);
const headerLabels = headerItems.map(item => item.label);

if (headerLabels.join(",") !== "PACT,KEY,PAIR") {
  throw new Error("Expected header CAW items to stay compact and leave lifecycle details inside the menu.");
}

if (headerItems[0]?.value !== "active") {
  throw new Error("Expected header Pact item to expose only the short active state.");
}

if (headerItems[2]?.value !== "true") {
  throw new Error("Expected header CAW pairing item to expose realtime wallet_paired status.");
}
