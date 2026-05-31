import type { NextPage } from "next";
import {
  ArrowPathIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { DecisionChainPreview } from "~~/components/sentinel/DecisionChainPreview";
import { SentinelShell } from "~~/components/sentinel/SentinelShell";
import { StatusBadge } from "~~/components/sentinel/StatusBadge";

const presets = [
  {
    label: "Safe swap",
    intent: "Swap 0.01 ETH to USDC",
    tone: "executed",
  },
  {
    label: "Blocked swap",
    intent: "Swap 1 ETH to USDC",
    tone: "rejected",
  },
  {
    label: "Manual review",
    intent: "Send 0.08 ETH to 0x742d...",
    tone: "confirm_needed",
  },
] as const;

const recentDecisions = [
  {
    id: "SNT-2048",
    intent: "Swap 0.01 ETH to USDC",
    status: "executed",
    reason: "All checks passed",
    time: "09:42:18",
  },
  {
    id: "SNT-2047",
    intent: "Swap 1 ETH to USDC",
    status: "rejected",
    reason: "AmountRule exceeded",
    time: "09:37:04",
  },
  {
    id: "SNT-2046",
    intent: "Quote WETH to USDC",
    status: "failed",
    reason: "RPC timeout",
    time: "09:31:55",
  },
] as const;

const Home: NextPage = () => {
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
                defaultValue="Send 0.08 ETH to 0x742d... after AI risk review"
              />
            </label>

            <div className="grid gap-2">
              {presets.map(preset => (
                <button
                  className="group flex items-center justify-between rounded-lg border border-white/10 bg-[#1a1c20] px-3 py-3 text-left transition hover:border-[#88d6b6]/50 hover:bg-[#1e2024]"
                  key={preset.intent}
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

            <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 text-amber-200" />
                <div>
                  <p className="m-0 text-sm font-medium text-amber-100">Manual confirmation slot</p>
                  <p className="m-0 mt-1 text-xs leading-5 text-amber-100/75">
                    Recipient context is incomplete. Operator approval is required before audit finalization.
                  </p>
                </div>
              </div>
            </div>

            <button
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#88d6b6] bg-[#88d6b6] px-4 text-sm font-semibold text-[#003828] transition hover:bg-[#a4f3d1]"
              type="button"
            >
              <PlayIcon className="h-4 w-4" />
              Run risk pipeline
            </button>
          </div>
        </section>

        <section className="h-[calc(100vh-80px)] min-h-[560px] overflow-hidden rounded-lg border border-white/10 bg-[#111318]">
          <DecisionChainPreview variant="confirm_needed" />
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
            {recentDecisions.map(item => (
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
