"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PlusCircleIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { useCawWallet } from "~~/components/sentinel/CawWalletContext";
import { getCawMenuButtonLabel, getCawSetupAvailability, getCawStatusSummary } from "~~/lib/sentinel/walletViewModel";

const DEFAULT_EXISTING_WALLET_ID = "wallet_existing_demo";

export const CawWalletMenu = () => {
  const { action, connectExisting, createWallet, error, isLoading, refreshStatus, userAddress, walletBinding } =
    useCawWallet();
  const [existingWalletId, setExistingWalletId] = useState(DEFAULT_EXISTING_WALLET_ID);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const summary = getCawStatusSummary(walletBinding);
  const setupAvailability = getCawSetupAvailability(walletBinding);
  const isBusy = isLoading || action !== null;
  const trimmedWalletId = existingWalletId.trim();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        className={`flex h-9 items-center justify-center gap-2 rounded-md border px-2.5 font-mono text-xs transition ${summaryToneClass(
          summary.tone,
        )}`}
        onClick={() => setIsOpen(current => !current)}
        type="button"
      >
        <WalletIcon className="h-4 w-4 shrink-0" />
        <span className="hidden max-w-28 truncate sm:block">
          {isLoading ? "Loading" : getCawMenuButtonLabel(walletBinding)}
        </span>
        <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-lg border border-[#3f4944] bg-[#0c0e12] shadow-2xl shadow-black/50">
          <div className="border-b border-white/10 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[#88d6b6]">
                  <WalletIcon className="h-4 w-4" />
                  <h2 className="m-0 text-sm font-semibold">CAW Account</h2>
                </div>
                <p className="m-0 mt-1 truncate text-xs text-[#bec9c2]">{summary.detail}</p>
              </div>
              <span
                className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] ${summaryToneClass(summary.tone)}`}
              >
                {isLoading ? "LOADING" : summary.primary.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid max-h-[calc(100vh-96px)] gap-2 overflow-y-auto p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <StatusCell label="connected_user" value={shortValue(userAddress)} />
              <StatusCell
                label="caw_wallet"
                value={shortValue(walletBinding?.cawWalletAddress ?? walletBinding?.cawWalletId)}
              />
              <StatusCell label="wallet_status" value={isLoading ? "Loading" : summary.statusItems.wallet_status} />
              <StatusCell label="pairing_status" value={isLoading ? "Loading" : summary.statusItems.pairing_status} />
              <StatusCell label="wallet_paired" value={isLoading ? "Loading" : summary.statusItems.wallet_paired} />
              <StatusCell label="caw_healthy" value={isLoading ? "Loading" : summary.statusItems.caw_healthy} />
              <StatusCell label="pact_status" value={isLoading ? "Loading" : summary.statusItems.pact_status} />
              <StatusCell label="config_status" value={isLoading ? "Loading" : summary.statusItems.config_status} />
              <StatusCell label="pending_txs" value={isLoading ? "Loading" : summary.statusItems.pending_txs_count} />
              <StatusCell label="pact_id" value={shortValue(walletBinding?.pactId)} />
              <StatusCell label="wallet_id" value={shortValue(walletBinding?.cawWalletId)} />
            </div>

            {walletBinding?.walletPaired === false && (
              <div className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">
                CAW wallet_paired is false. Generate a pairing code in Settings, complete pairing in Cobo Agentic
                Wallet, then refresh status.
              </div>
            )}

            {summary.statusItems.config_status === "needs_pact_update" && (
              <div className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">
                CAW Pact update required before config and infrastructure policy are fully synced.
              </div>
            )}

            {error && (
              <div className="rounded-md border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-xs leading-5 text-rose-100">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="rounded-md border border-white/10 bg-[#111318] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#e2e2e8]">
                <LinkIcon className="h-4 w-4 text-[#88d6b6]" />
                Connect existing CAW
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="h-10 min-w-0 flex-1 rounded-md border border-[#3f4944] bg-[#0c0e12] px-3 font-mono text-xs text-[#e2e2e8] outline-none placeholder:text-[#89938d] focus:border-[#88d6b6]"
                  disabled={isBusy || !setupAvailability.canConnectExisting}
                  onChange={event => setExistingWalletId(event.target.value)}
                  placeholder="caw_wallet_id"
                  value={existingWalletId}
                />
                <button
                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#88d6b6]/35 bg-[#88d6b6]/10 px-3 text-sm font-semibold text-[#a4f3d1] transition hover:border-[#88d6b6] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-[#89938d]"
                  disabled={isBusy || !setupAvailability.canConnectExisting || !trimmedWalletId}
                  onClick={() => connectExisting(trimmedWalletId)}
                  type="button"
                >
                  {action === "connect" && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  Connect
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="rounded-md border border-white/10 bg-[#111318] p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#e2e2e8]">
                  <PlusCircleIcon className="h-4 w-4 text-[#88d6b6]" />
                  Create CAW wallet
                </div>
                <p className="m-0 mt-1 text-xs leading-5 text-[#bec9c2]">
                  Creates a persisted user CAW wallet; pairing and Pact approval remain separate status steps.
                </p>
              </div>
              <button
                className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#88d6b6] bg-[#88d6b6] px-3 text-sm font-semibold text-[#003828] transition hover:bg-[#a4f3d1] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-[#89938d]"
                disabled={isBusy || !setupAvailability.canCreateWallet}
                onClick={createWallet}
                type="button"
              >
                {action === "create" && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>

            <button
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#3f4944] bg-[#111318] px-3 text-sm font-semibold text-[#e2e2e8] transition hover:border-[#88d6b6]/60 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isBusy || !setupAvailability.canRefresh}
              onClick={refreshStatus}
              type="button"
            >
              <ArrowPathIcon
                className={`h-4 w-4 text-[#88d6b6] ${action === "refresh" || isLoading ? "animate-spin" : ""}`}
              />
              Refresh status
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusCell = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-[#111318] px-2.5 py-2">
      <div className="font-mono text-[10px] uppercase text-[#89938d]">{label}</div>
      <div className="mt-1 truncate font-mono text-xs text-[#e2e2e8]">{value}</div>
    </div>
  );
};

function shortValue(value: string | null | undefined): string {
  if (!value) {
    return "N/A";
  }

  if (value.startsWith("0x") && value.length > 12) {
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  if (value.length > 20) {
    return `${value.slice(0, 12)}...${value.slice(-6)}`;
  }

  return value;
}

function summaryToneClass(tone: ReturnType<typeof getCawStatusSummary>["tone"]): string {
  if (tone === "ready") {
    return "border-[#88d6b6]/30 bg-[#88d6b6]/10 text-[#a4f3d1]";
  }

  if (tone === "blocked") {
    return "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffdad6]";
  }

  return "border-amber-300/30 bg-amber-300/10 text-amber-100";
}
