import {
  connectExistingCawWallet,
  createCawWallet,
  getRiskConfig,
  getWalletStatus,
  refreshWalletStatus,
  updateRiskConfig,
} from "./api";
import { DEMO_USER_ADDRESS, MOCK_RISK_CONFIG, MOCK_WALLET_BINDINGS } from "./mockData";
import type {
  CawWalletBinding,
  ConfigStatus,
  PactStatus,
  PairingStatus,
  RiskConfigResponse,
  WalletStatus,
} from "./types";

const walletStatuses: WalletStatus[] = ["none", "pairing_pending", "paired", "active", "revoked", "expired"];
const pairingStatuses: PairingStatus[] = ["none", "pending", "paired", "failed"];
const pactStatuses: PactStatus[] = ["none", "pending_approval", "active", "expired", "revoked"];
const configStatuses: ConfigStatus[] = ["synced", "needs_pact_update"];

if (walletStatuses.length !== 6 || pairingStatuses.length !== 4 || pactStatuses.length !== 5) {
  throw new Error("Expected wallet lifecycle status unions to match shared-api-contract.md.");
}

if (configStatuses.length !== 2) {
  throw new Error("Expected config sync status union to match shared-api-contract.md.");
}

const activeWallet = MOCK_WALLET_BINDINGS.active satisfies CawWalletBinding;
const unboundWallet = MOCK_WALLET_BINDINGS.none satisfies CawWalletBinding;
const riskConfig = MOCK_RISK_CONFIG satisfies RiskConfigResponse;

if (activeWallet.walletStatus !== "active" || activeWallet.pairingStatus !== "paired") {
  throw new Error("Expected active CAW mock to expose paired active status.");
}

if (unboundWallet.walletStatus !== "none" || unboundWallet.pactStatus !== "none") {
  throw new Error("Expected unbound CAW mock to expose none statuses.");
}

if (riskConfig.configStatus !== "synced" || riskConfig.config.frequencyLimit !== 3) {
  throw new Error("Expected risk config mock to mirror shared-api-contract.md.");
}

expectPromise<CawWalletBinding>(getWalletStatus(DEMO_USER_ADDRESS));
expectPromise<CawWalletBinding>(
  connectExistingCawWallet({ userAddress: DEMO_USER_ADDRESS, cawWalletId: "wallet_123" }),
);
expectPromise<CawWalletBinding>(createCawWallet({ userAddress: DEMO_USER_ADDRESS }));
expectPromise<CawWalletBinding>(refreshWalletStatus({ userAddress: DEMO_USER_ADDRESS }));
expectPromise<RiskConfigResponse>(getRiskConfig(DEMO_USER_ADDRESS));
expectPromise<RiskConfigResponse>(updateRiskConfig({ userAddress: DEMO_USER_ADDRESS, config: { frequencyLimit: 2 } }));

function expectPromise<T>(value: Promise<T>): void {
  void value;
}
