"use client";

import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useCawWallet } from "~~/components/sentinel/CawWalletContext";
import { getPactSyncMessage } from "~~/lib/sentinel/configViewModel";
import type { ConfigStatus } from "~~/lib/sentinel/types";

type ConfigSyncWarningProps = {
  className?: string;
  configStatus?: ConfigStatus;
  showWhenSynced?: boolean;
};

export const ConfigSyncWarning = ({ className = "", configStatus, showWhenSynced = false }: ConfigSyncWarningProps) => {
  const { walletBinding } = useCawWallet();
  const status = configStatus ?? walletBinding?.configStatus ?? "synced";

  if (status === "synced" && !showWhenSynced) {
    return null;
  }

  const message = getPactSyncMessage(status);
  const isWarning = message.tone === "warning";

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs leading-5 ${
        isWarning
          ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
          : "border-[#88d6b6]/25 bg-[#88d6b6]/10 text-[#d8f8e8]"
      } ${className}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <ExclamationTriangleIcon
            className={`mt-0.5 h-4 w-4 shrink-0 ${isWarning ? "text-amber-200" : "text-[#88d6b6]"}`}
          />
          <div className="min-w-0">
            <p className="m-0 font-semibold">{message.title}</p>
            <p className="m-0 opacity-80">{message.body}</p>
          </div>
        </div>
        {isWarning && (
          <Link
            className="shrink-0 rounded-md border border-amber-300/30 px-2 py-1 font-mono text-[11px] text-amber-100 transition hover:border-amber-200"
            href="/settings"
          >
            Open Settings
          </Link>
        )}
      </div>
    </div>
  );
};
