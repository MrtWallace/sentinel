import { Fragment } from "react";
import type { NextPage } from "next";
import { ChevronDownIcon, ChevronRightIcon, FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { DecisionChainPreview } from "~~/components/sentinel/DecisionChainPreview";
import { SentinelShell } from "~~/components/sentinel/SentinelShell";
import { StatusBadge } from "~~/components/sentinel/StatusBadge";

const auditRows = [
  {
    id: "SNT-2048",
    time: "2026-05-28 09:42:18",
    intent: "Swap 0.01 ETH to USDC",
    status: "executed",
    reason: "All checks passed",
    txHash: "0xabcd...7890",
  },
  {
    id: "SNT-2047",
    time: "2026-05-28 09:37:04",
    intent: "Swap 1 ETH to USDC",
    status: "rejected",
    reason: "AmountRule exceeded daily policy",
    txHash: "None",
  },
  {
    id: "SNT-2046",
    time: "2026-05-28 09:31:55",
    intent: "Send 0.08 ETH to 0x742d...",
    status: "confirm_needed",
    reason: "Manual approval required",
    txHash: "Audit only",
  },
  {
    id: "SNT-2045",
    time: "2026-05-28 09:22:11",
    intent: "Quote WETH to USDC",
    status: "failed",
    reason: "Request timed out",
    txHash: "None",
  },
] as const;

const AuditPage: NextPage = () => {
  return (
    <SentinelShell active="audit">
      <div className="min-h-[calc(100vh-48px)] overflow-y-auto bg-[#0c0e12] p-4">
        <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="m-0 text-2xl font-semibold text-[#e2e2e8]">Audit Logs</h1>
            <p className="m-0 mt-1 text-sm text-[#bec9c2]">Decision records for natural-language DeFi intents.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89938d]" />
              <input
                className="h-10 w-full rounded-lg border border-[#3f4944] bg-[#111318] pl-9 pr-3 font-mono text-xs text-[#e2e2e8] outline-none placeholder:text-[#89938d] focus:border-[#88d6b6] sm:w-72"
                placeholder="Search hash or intent"
              />
            </div>
            <button
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#3f4944] bg-[#111318] px-3 text-sm text-[#e2e2e8] hover:border-[#88d6b6]/60"
              type="button"
            >
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#111318]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="border-b border-white/10 bg-[#0c0e12]">
                <tr className="font-mono text-[11px] uppercase text-[#89938d]">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Intent</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">TX Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditRows.map((row, index) => (
                  <Fragment key={row.id}>
                    <tr
                      className={`group cursor-pointer font-mono text-xs text-[#e2e2e8] transition hover:bg-[#1a1c20] ${
                        index === 0 ? "bg-[#15191d]" : ""
                      }`}
                    >
                      <td
                        className={`px-4 py-3 text-[#89938d] ${index === 0 ? "border-l-2 border-[#88d6b6]" : "border-l-2 border-transparent"}`}
                      >
                        <div className="flex items-center gap-2">
                          {index === 0 ? (
                            <ChevronDownIcon className="h-4 w-4 text-[#88d6b6]" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-[#68726d] transition group-hover:text-[#88d6b6]" />
                          )}
                          <span>{row.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#bec9c2]">{row.time}</td>
                      <td className="px-4 py-3 font-sans text-sm">{row.intent}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-[#bec9c2]">{row.reason}</td>
                      <td className="px-4 py-3 text-[#88d6b6]">{row.txHash}</td>
                    </tr>
                    {index === 0 && (
                      <tr className="bg-[#0c0e12]">
                        <td className="px-4 py-4" colSpan={6}>
                          <div className="border-l-2 border-[#88d6b6] pl-3">
                            <div className="rounded-lg border border-[#3f4944] bg-[#111318]">
                              <DecisionChainPreview compact variant="executed" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SentinelShell>
  );
};

export default AuditPage;
