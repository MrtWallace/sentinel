"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, KeyIcon } from "@heroicons/react/24/outline";
import { useCawWallet } from "~~/components/sentinel/CawWalletContext";
import { ConfigSyncWarning } from "~~/components/sentinel/ConfigSyncWarning";
import { SentinelShell } from "~~/components/sentinel/SentinelShell";
import { createPairingCode, getRiskConfig, submitPact, updateRiskConfig } from "~~/lib/sentinel/api";
import { draftToRiskConfig, getPactSyncMessage, riskConfigToDraft } from "~~/lib/sentinel/configViewModel";
import type { RiskConfigDraft } from "~~/lib/sentinel/configViewModel";
import type { ConfigStatus, RiskConfigResponse } from "~~/lib/sentinel/types";

const emptyDraft = riskConfigToDraft({});

const SettingsPage: NextPage = () => {
  return (
    <SentinelShell active="settings">
      <SettingsContent />
    </SentinelShell>
  );
};

export default SettingsPage;

const SettingsContent = () => {
  const { refreshStatus, setConfigStatus, userAddress, walletBinding } = useCawWallet();
  const [draft, setDraft] = useState<RiskConfigDraft>(emptyDraft);
  const [configResponse, setConfigResponse] = useState<RiskConfigResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<ConfigStatus | null>(null);
  const [isSubmittingPact, setIsSubmittingPact] = useState(false);
  const [isGeneratingPairCode, setIsGeneratingPairCode] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pactMessage, setPactMessage] = useState<string | null>(null);
  const visibleConfigStatus = configResponse?.configStatus ?? walletBinding?.configStatus ?? "synced";

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setErrorMessage(null);

    getRiskConfig(userAddress)
      .then(response => {
        if (!isActive) {
          return;
        }

        setConfigResponse(response);
        setDraft(riskConfigToDraft(response.config));
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage("Risk config is unavailable. Try again.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [userAddress]);

  const updateDraft = <Field extends keyof RiskConfigDraft>(field: Field, value: RiskConfigDraft[Field]) => {
    setDraft(current => ({
      ...current,
      [field]: value,
    }));
    setSaveStatus(null);
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveStatus(null);

    try {
      const response = await updateRiskConfig({
        userAddress,
        config: draftToRiskConfig(draft),
      });

      setConfigResponse(response);
      setDraft(riskConfigToDraft(response.config));
      setSaveStatus(response.configStatus);
      setConfigStatus(response.configStatus);
    } catch {
      setErrorMessage("Could not update Sentinel config.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveMessage = saveStatus ? getPactSyncMessage(saveStatus) : null;

  const handleSubmitPact = async () => {
    setIsSubmittingPact(true);
    setErrorMessage(null);
    setPactMessage(null);

    try {
      const limits = {
        max_transfer_eth: draft.transferAmountThresholdConfirm,
        max_swap_eth: draft.swapAmountThresholdConfirm,
        daily_limit_eth: draft.transferAmountThresholdConfirm,
      };

      const result = await submitPact(userAddress, limits);

      setPactMessage(`Pact submitted. Status: ${result.pactStatus}`);
    } catch {
      setErrorMessage("Could not submit Pact to CAW. Try again.");
    } finally {
      setIsSubmittingPact(false);
    }
  };

  const handleGeneratePairingCode = async () => {
    setIsGeneratingPairCode(true);
    setErrorMessage(null);
    setPairingCode(null);

    try {
      const result = await createPairingCode({ userAddress });
      setPairingCode(result.pairingCode);
    } catch {
      setErrorMessage("Could not generate CAW pairing code.");
    } finally {
      setIsGeneratingPairCode(false);
    }
  };

  const walletStatus = walletBinding?.walletStatus ?? "none";
  const pactStatus = walletBinding?.pactStatus ?? "none";
  const canSubmitPact = walletStatus === "paired" && pactStatus === "none" && !isSubmittingPact;
  const canGeneratePairingCode = walletStatus !== "none" && !isGeneratingPairCode;

  return (
    <div className="min-h-[calc(100vh-48px)] overflow-y-auto bg-[#0c0e12] p-4">
      <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-semibold text-[#e2e2e8]">Settings</h1>
          <p className="m-0 mt-1 text-sm text-[#bec9c2]">
            Sentinel risk config and CAW Pact sync status for the scoped demo user.
          </p>
        </div>
        <div className="grid gap-2 font-mono text-xs text-[#89938d] sm:grid-cols-3">
          <HeaderMetric label="user" value={shortAddress(userAddress)} />
          <HeaderMetric label="config_version" value={configResponse ? String(configResponse.configVersion) : "N/A"} />
          <HeaderMetric
            label="pact_version"
            value={configResponse ? String(configResponse.pactConfigVersion) : "N/A"}
          />
        </div>
      </div>

      <ConfigSyncWarning className="mb-4" configStatus={visibleConfigStatus} showWhenSynced />

      {saveMessage && (
        <div
          className={`mb-4 rounded-lg border p-3 text-sm ${
            saveMessage.tone === "warning"
              ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
              : "border-[#88d6b6]/25 bg-[#88d6b6]/10 text-[#d8f8e8]"
          }`}
        >
          <div className="flex items-start gap-2">
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="m-0 font-semibold">Sentinel config updated</p>
              <p className="m-0 mt-1 text-xs leading-5 opacity-80">
                {saveMessage.title}. {saveMessage.body}
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-rose-300/25 bg-rose-300/10 p-3 text-sm text-rose-100">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-lg border border-white/10 bg-[#111318]">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="m-0 text-base font-semibold text-[#e2e2e8]">Risk Parameters</h2>
            <p className="m-0 mt-1 text-xs text-[#bec9c2]">
              These thresholds update Sentinel config. CAW Pact sync is tracked separately.
            </p>
          </div>

          <div className="grid gap-4 p-4">
            <ConfigSection title="Swap thresholds">
              <TextField
                disabled={isLoading || isSaving}
                label="swap pass threshold"
                onChange={value => updateDraft("swapAmountThresholdPass", value)}
                value={draft.swapAmountThresholdPass}
              />
              <TextField
                disabled={isLoading || isSaving}
                label="swap confirm threshold"
                onChange={value => updateDraft("swapAmountThresholdConfirm", value)}
                value={draft.swapAmountThresholdConfirm}
              />
            </ConfigSection>

            <ConfigSection title="Transfer thresholds">
              <TextField
                disabled={isLoading || isSaving}
                label="transfer pass threshold"
                onChange={value => updateDraft("transferAmountThresholdPass", value)}
                value={draft.transferAmountThresholdPass}
              />
              <TextField
                disabled={isLoading || isSaving}
                label="transfer confirm threshold"
                onChange={value => updateDraft("transferAmountThresholdConfirm", value)}
                value={draft.transferAmountThresholdConfirm}
              />
            </ConfigSection>

            <ConfigSection title="Slippage and frequency">
              <TextField
                disabled={isLoading || isSaving}
                label="slippage pass threshold"
                onChange={value => updateDraft("slippageThresholdPass", value)}
                value={draft.slippageThresholdPass}
              />
              <TextField
                disabled={isLoading || isSaving}
                label="slippage confirm threshold"
                onChange={value => updateDraft("slippageThresholdConfirm", value)}
                value={draft.slippageThresholdConfirm}
              />
              <TextField
                disabled={isLoading || isSaving}
                label="frequency limit"
                onChange={value => updateDraft("frequencyLimit", value)}
                value={draft.frequencyLimit}
              />
            </ConfigSection>

            <ConfigSection title="Whitelist and automation">
              <label className="grid gap-1.5">
                <span className="font-mono text-[11px] uppercase text-[#89938d]">whitelist mode</span>
                <select
                  className="h-10 rounded-md border border-[#3f4944] bg-[#0c0e12] px-3 font-mono text-xs text-[#e2e2e8] outline-none focus:border-[#88d6b6] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading || isSaving}
                  onChange={event =>
                    updateDraft("whitelistMode", event.target.value as RiskConfigDraft["whitelistMode"])
                  }
                  value={draft.whitelistMode}
                >
                  <option value="strict">strict</option>
                  <option value="open">open</option>
                </select>
              </label>
              <label className="grid gap-1.5 md:col-span-2">
                <span className="font-mono text-[11px] uppercase text-[#89938d]">custom whitelist</span>
                <textarea
                  className="min-h-24 resize-none rounded-md border border-[#3f4944] bg-[#0c0e12] px-3 py-2 font-mono text-xs leading-5 text-[#e2e2e8] outline-none placeholder:text-[#89938d] focus:border-[#88d6b6] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading || isSaving}
                  onChange={event => updateDraft("customWhitelist", event.target.value)}
                  placeholder="0x... per line or comma-separated"
                  value={draft.customWhitelist}
                />
              </label>
              <label className="flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-[#0c0e12] px-3">
                <input
                  checked={draft.autoApproveLowRisk}
                  className="h-4 w-4 accent-[#88d6b6]"
                  disabled={isLoading || isSaving}
                  onChange={event => updateDraft("autoApproveLowRisk", event.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm text-[#e2e2e8]">Auto approve low risk</span>
              </label>
            </ConfigSection>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-xs leading-5 text-[#89938d]">
              Browser validation is only UX. Backend validation and CAW Pact remain the security boundary.
            </p>
            <button
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#88d6b6] bg-[#88d6b6] px-4 text-sm font-semibold text-[#003828] transition hover:bg-[#a4f3d1] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-[#89938d]"
              disabled={isLoading || isSaving}
              onClick={saveConfig}
              type="button"
            >
              {isSaving && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
              {isSaving ? "Saving" : "Save config"}
            </button>
          </div>
        </section>

        <aside className="rounded-lg border border-white/10 bg-[#111318]">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="m-0 text-base font-semibold text-[#e2e2e8]">Pact Sync</h2>
            <p className="m-0 mt-1 text-xs text-[#bec9c2]">Sentinel config and CAW policy are separate controls.</p>
          </div>
          <div className="grid gap-2 p-4">
            <StatusCell label="config_status" value={visibleConfigStatus} />
            <StatusCell label="wallet_status" value={walletBinding?.walletStatus ?? "unknown"} />
            <StatusCell label="pairing_status" value={walletBinding?.pairingStatus ?? "unknown"} />
            <StatusCell label="wallet_paired" value={formatNullableBoolean(walletBinding?.walletPaired)} />
            <StatusCell label="caw_healthy" value={formatNullableBoolean(walletBinding?.cawHealthy)} />
            <StatusCell
              label="pending_txs"
              value={
                walletBinding?.pendingTxsCount === undefined || walletBinding?.pendingTxsCount === null
                  ? "unknown"
                  : String(walletBinding.pendingTxsCount)
              }
            />
            <StatusCell label="pact_status" value={walletBinding?.pactStatus ?? "unknown"} />
            <StatusCell label="pact_id" value={walletBinding?.pactId ?? "N/A"} />
            <StatusCell
              label="caw_wallet"
              value={walletBinding?.cawWalletAddress ?? walletBinding?.cawWalletId ?? "N/A"}
            />
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-lg border border-white/10 bg-[#0c0e12] p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#e2e2e8]">
                <KeyIcon className="h-4 w-4 text-[#88d6b6]" />
                CAW wallet pairing
              </div>
              <p className="m-0 mt-1 text-xs leading-5 text-[#bec9c2]">
                Generate a one-time CAW pairing code, enter it in Cobo Agentic Wallet, then refresh status.
              </p>
              {pairingCode && (
                <div className="mt-3 rounded-md border border-[#88d6b6]/25 bg-[#88d6b6]/10 px-3 py-2">
                  <div className="font-mono text-[10px] uppercase text-[#89938d]">pairing_code</div>
                  <div className="mt-1 font-mono text-lg font-semibold tracking-normal text-[#d8f8e8]">
                    {pairingCode}
                  </div>
                </div>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#88d6b6]/35 bg-[#88d6b6]/10 text-sm font-semibold text-[#a4f3d1] transition hover:border-[#88d6b6] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-[#89938d]"
                  disabled={!canGeneratePairingCode}
                  onClick={handleGeneratePairingCode}
                  type="button"
                >
                  {isGeneratingPairCode && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  {isGeneratingPairCode ? "Generating..." : "Generate code"}
                </button>
                <button
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#3f4944] bg-[#111318] text-sm font-semibold text-[#e2e2e8] transition hover:border-[#88d6b6]/60"
                  onClick={refreshStatus}
                  type="button"
                >
                  Refresh status
                </button>
              </div>
            </div>
          </div>

          {pactMessage && (
            <div className="border-t border-white/10 px-4 py-3">
              <p className="m-0 text-xs text-[#88d6b6]">{pactMessage}</p>
            </div>
          )}

          <div className="border-t border-white/10 p-4">
            <button
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#88d6b6] bg-[#88d6b6] text-sm font-semibold text-[#003828] transition hover:bg-[#a4f3d1] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-[#89938d]"
              disabled={!canSubmitPact}
              onClick={handleSubmitPact}
              type="button"
            >
              {isSubmittingPact && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
              {isSubmittingPact ? "Submitting..." : "Submit Pact to CAW"}
            </button>
            {!canSubmitPact && walletStatus === "paired" && pactStatus !== "none" && (
              <p className="m-0 mt-2 text-center text-[10px] text-[#89938d]">Pact already submitted ({pactStatus})</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

const ConfigSection = ({ children, title }: { children: React.ReactNode; title: string }) => {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0c0e12] p-3">
      <h3 className="m-0 text-sm font-semibold text-[#e2e2e8]">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
};

const TextField = ({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) => {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[11px] uppercase text-[#89938d]">{label}</span>
      <input
        className="h-10 rounded-md border border-[#3f4944] bg-[#0c0e12] px-3 font-mono text-xs text-[#e2e2e8] outline-none placeholder:text-[#89938d] focus:border-[#88d6b6] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
};

const HeaderMetric = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-md border border-white/10 bg-[#111318] px-3 py-2">
      <div className="font-mono text-[10px] uppercase text-[#89938d]">{label}</div>
      <div className="mt-1 truncate text-[#e2e2e8]">{value}</div>
    </div>
  );
};

const StatusCell = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-md border border-white/10 bg-[#0c0e12] px-3 py-2">
      <div className="font-mono text-[10px] uppercase text-[#89938d]">{label}</div>
      <div className="mt-1 truncate font-mono text-xs text-[#e2e2e8]">{value}</div>
    </div>
  );
};

function shortAddress(address: string): string {
  if (address.length <= 14) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNullableBoolean(value: boolean | null | undefined): string {
  if (value === undefined || value === null) {
    return "unknown";
  }
  return value ? "true" : "false";
}
