"use client";

import { useState } from "react";
import type { NextPage } from "next";
import {
  ArrowPathIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { DecisionChain } from "~~/components/sentinel/DecisionChain";
import { SentinelShell } from "~~/components/sentinel/SentinelShell";
import { StatusBadge } from "~~/components/sentinel/StatusBadge";
import { executeIntent } from "~~/lib/sentinel/api";
import type { ExecuteResponse, ExecutionStatus } from "~~/lib/sentinel/types";

const presets = [
  {
    label: "Safe swap",
    intent: "Swap 0.01 ETH to USDC",
    tone: "executed" as const,
  },
  {
    label: "Blocked swap",
    intent: "Swap 1 ETH to USDC",
    tone: "rejected" as const,
  },
  {
    label: "Manual review",
    intent: "Send 0.08 ETH to 0x742d...",
    tone: "confirm_needed" as const,
  },
] as const;

const recentDecisions = [
  {
    id: "SNT-2048",
    intent: "Swap 0.01 ETH to USDC",
    status: "executed" as const,
    reason: "All checks passed",
    time: "09:42:18",
  },
  {
    id: "SNT-2047",
    intent: "Swap 1 ETH to USDC",
    status: "rejected" as const,
    reason: "AmountRule exceeded",
    time: "09:37:04",
  },
  {
    id: "SNT-2046",
    intent: "Quote WETH to USDC",
    status: "failed" as const,
    reason: "RPC timeout",
    time: "09:31:55",
  },
] as const;

type RecentDecision = {
  id: string;
  intent: string;
  reason: string;
  status: ExecutionStatus;
  time: string;
};

const Home: NextPage = () => {
  const [intent, setIntent] = useState("Send 0.08 ETH to 0x742d... after AI risk review");
  const [execution, setExecution] = useState<ExecuteResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [decisionItems, setDecisionItems] = useState<RecentDecision[]>([...recentDecisions]);

  const runIntent = async (nextIntent = intent) => {
    const trimmedIntent = nextIntent.trim();

    if (!trimmedIntent || isExecuting) {
      return;
    }

    setIntent(trimmedIntent);
    setIsExecuting(true);
    setErrorMessage(null);

    try {
      const result = await executeIntent(trimmedIntent);

      setExecution(result);
      setDecisionItems(currentItems => [responseToRecentDecision(result), ...currentItems].slice(0, 5));
    } catch {
      setErrorMessage("Connection failed. Try again.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <SentinelShell active="execute">
      <div className="grid min-h-[calc(100vh-48px)] gap-4 overflow-y-auto bg-[#0c0e12] p-4 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)_300px]">
        <section className="flex min-h-[560px] flex-col rounded-lg border border-white/10 bg-[#111318]">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-[#88d6b6]">
              <BoltIcon className="h-4 w-4" />
              <h1 className="m-0 text-base font-semibold">Intent Workbench</h1>
            </div>
            <p className="m-0 mt-1 text-xs text-[#bec9c2]">
              Natural language command intake for the guarded SmartAccount.
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-4">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[11px] uppercase text-[#89938d]">Intent</span>
              <textarea
                className="h-44 resize-none rounded-lg border border-[#3f4944] bg-[#0c0e12] p-3 font-mono text-sm leading-6 text-[#e2e2e8] outline-none placeholder:text-[#89938d] focus:border-[#88d6b6]"
                onChange={event => setIntent(event.target.value)}
                value={intent}
              />
            </label>

            <div className="grid gap-2">
              {presets.map(preset => (
                <button
                  className={`group flex items-center justify-between rounded-lg border px-3 py-3 text-left transition ${
                    execution?.intent === preset.intent
                      ? "border-[#88d6b6]/70 bg-[#88d6b6]/10"
                      : "border-white/10 bg-[#1a1c20] hover:border-[#88d6b6]/50 hover:bg-[#1e2024]"
                  }`}
                  disabled={isExecuting}
                  key={preset.intent}
                  onClick={() => runIntent(preset.intent)}
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-medium text-[#e2e2e8]">{preset.label}</span>
                    <span className="mt-1 block font-mono text-xs text-[#bec9c2]">{preset.intent}</span>
                  </span>
                  <StatusBadge status={preset.tone} />
                </button>
              ))}
            </div>

            <div className={infoPanelClass(execution?.status)}>
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 text-amber-200" />
                <div>
                  <p className="m-0 text-sm font-medium text-amber-100">{infoPanelTitle(execution)}</p>
                  <p className="m-0 mt-1 text-xs leading-5 text-amber-100/75">{infoPanelBody(execution)}</p>
                </div>
              </div>
            </div>

            <button
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#88d6b6] bg-[#88d6b6] px-4 text-sm font-semibold text-[#003828] transition hover:bg-[#a4f3d1]"
              disabled={isExecuting || !intent.trim()}
              onClick={() => runIntent()}
              type="button"
            >
              {isExecuting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PlayIcon className="h-4 w-4" />}
              {isExecuting ? "Running risk pipeline" : "Run risk pipeline"}
            </button>

            {errorMessage && (
              <div className="rounded-lg border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-100">
                {errorMessage}
              </div>
            )}
          </div>
        </section>

        <section className="h-[calc(100vh-80px)] min-h-[560px] overflow-hidden rounded-lg border border-white/10 bg-[#111318]">
          <DecisionChain isLoading={isExecuting} response={execution} />
        </section>

        <aside className="flex min-h-[560px] flex-col rounded-lg border border-white/10 bg-[#111318] lg:col-span-2 xl:col-span-1">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-[#88d6b6]">
              <ShieldCheckIcon className="h-4 w-4" />
              <h2 className="m-0 text-base font-semibold">Recent Decisions</h2>
            </div>
            <p className="m-0 mt-1 text-xs text-[#bec9c2]">Lightweight audit trail preview.</p>
          </div>

          <div className="flex flex-1 flex-col divide-y divide-white/5">
            {decisionItems.map(item => (
              <div className="px-4 py-3" key={item.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-[#89938d]">{item.id}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="m-0 mt-3 text-sm text-[#e2e2e8]">{item.intent}</p>
                <div className="mt-2 flex items-center justify-between gap-3 font-mono text-xs text-[#89938d]">
                  <span>{item.reason}</span>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-2 rounded-lg border border-[#3f4944] bg-[#0c0e12] px-3 py-2 font-mono text-xs text-[#bec9c2]">
              <ArrowPathIcon className="h-4 w-4 text-[#88d6b6]" />
              Audit log available
            </div>
          </div>
        </aside>
      </div>
    </SentinelShell>
  );
};

export default Home;

function responseToRecentDecision(response: ExecuteResponse): RecentDecision {
  return {
    id: response.txId.toUpperCase(),
    intent: response.intent,
    reason: response.reason,
    status: response.status,
    time: response.timestamp.slice(11, 19),
  };
}

function infoPanelClass(status?: ExecutionStatus): string {
  if (status === "executed") {
    return "rounded-lg border border-[#88d6b6]/20 bg-[#88d6b6]/10 p-3";
  }

  if (status === "rejected" || status === "failed") {
    return "rounded-lg border border-[#ffb4ab]/20 bg-[#ffb4ab]/10 p-3";
  }

  return "rounded-lg border border-amber-300/20 bg-amber-300/10 p-3";
}

function infoPanelTitle(response: ExecuteResponse | null): string {
  if (!response) {
    return "Manual confirmation slot";
  }

  if (response.status === "executed") {
    return "Execution path completed";
  }

  if (response.status === "rejected") {
    return "Execution blocked by policy";
  }

  if (response.status === "failed") {
    return "Execution failed";
  }

  return "Manual confirmation slot";
}

function infoPanelBody(response: ExecuteResponse | null): string {
  if (!response) {
    return "Recipient context is incomplete. Operator approval is required before audit finalization.";
  }

  if (response.status === "confirm_needed") {
    return response.decisionChain.confirmation?.riskNote ?? response.reason;
  }

  return response.reason;
}
