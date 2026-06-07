"use client";

import { Fragment } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { DecisionChain } from "~~/components/sentinel/DecisionChain";
import { StatusBadge } from "~~/components/sentinel/StatusBadge";
import { getAuditEvidenceLabel } from "~~/lib/sentinel/auditEvidenceViewModel";
import type { AuditLogItem, ExecuteResponse } from "~~/lib/sentinel/types";

type AuditTableProps = {
  detailError: string | null;
  expandedResponse: ExecuteResponse | null;
  expandedTxId: string | null;
  isLoadingDetail: boolean;
  isLoadingList: boolean;
  items: AuditLogItem[];
  onSelect: (txId: string) => void;
  userAddress: string;
};

export const AuditTable = ({
  detailError,
  expandedResponse,
  expandedTxId,
  isLoadingDetail,
  isLoadingList,
  items,
  onSelect,
  userAddress,
}: AuditTableProps) => {
  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#111318]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left lg:min-w-[940px]">
          <thead className="border-b border-white/10 bg-[#0c0e12]">
            <tr className="font-mono text-[11px] uppercase text-[#89938d]">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Intent</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoadingList && <AuditSkeletonRows />}

            {!isLoadingList && items.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-[#89938d]" colSpan={6}>
                  No audit records found.
                </td>
              </tr>
            )}

            {!isLoadingList &&
              items.map(row => {
                const isExpanded = row.txId === expandedTxId;

                return (
                  <Fragment key={row.txId}>
                    <tr
                      aria-expanded={isExpanded}
                      className={`group cursor-pointer font-mono text-xs text-[#e2e2e8] transition hover:bg-[#1a1c20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#88d6b6] ${
                        isExpanded ? "bg-[#15191d]" : ""
                      }`}
                      onClick={() => onSelect(row.txId)}
                      onKeyDown={event => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelect(row.txId);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <td
                        className={`px-4 py-3 text-[#89938d] ${
                          isExpanded ? "border-l-2 border-[#88d6b6]" : "border-l-2 border-transparent"
                        }`}
                      >
                        <div className="flex w-full items-center gap-2 text-left transition group-hover:text-[#e2e2e8]">
                          {isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4 shrink-0 text-[#88d6b6]" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#68726d] transition group-hover:text-[#88d6b6]" />
                          )}
                          <span>{row.txId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#bec9c2]">{formatAuditTimestamp(row.timestamp)}</td>
                      <td className="px-4 py-3 font-sans text-sm">{row.intent}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-[#bec9c2]">{row.reason}</td>
                      <td className="px-4 py-3 text-[#88d6b6]">{getAuditEvidenceLabel(row)}</td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-[#0c0e12]">
                        <td className="px-4 py-4" colSpan={6}>
                          <div className="border-l-2 border-[#88d6b6] pl-3">
                            {detailError ? (
                              <div className="rounded-lg border border-rose-300/25 bg-rose-300/10 p-4 text-sm text-rose-100">
                                {detailError}
                              </div>
                            ) : (
                              <div className="h-[640px] overflow-hidden rounded-lg border border-[#3f4944] bg-[#111318]">
                                <DecisionChain
                                  auditUserAddress={userAddress}
                                  isLoading={isLoadingDetail}
                                  response={isLoadingDetail ? null : expandedResponse}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const AuditSkeletonRows = () => {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <tr className="animate-pulse" key={index}>
          {Array.from({ length: 6 }, (_unused, cellIndex) => (
            <td className="px-4 py-4" key={cellIndex}>
              <div className="h-3 rounded bg-white/10" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

function formatAuditTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toISOString().slice(0, 19).replace("T", " ");
}
