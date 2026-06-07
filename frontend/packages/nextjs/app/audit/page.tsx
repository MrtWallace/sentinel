"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import { ArrowPathIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { AuditTable } from "~~/components/sentinel/AuditTable";
import { SentinelShell } from "~~/components/sentinel/SentinelShell";
import { getAuditLog, getAuditLogItem } from "~~/lib/sentinel/api";
import { auditItemToExecuteResponse } from "~~/lib/sentinel/auditViewModel";
import type { AuditLogItem, ExecuteResponse } from "~~/lib/sentinel/types";

const AuditPage: NextPage = () => {
  const [auditItems, setAuditItems] = useState<AuditLogItem[]>([]);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [expandedResponse, setExpandedResponse] = useState<ExecuteResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const loadAuditLog = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const items = await getAuditLog();

      setAuditItems(items);
      setSelectedTxId(currentTxId => {
        if (currentTxId && items.some(item => item.txId === currentTxId)) {
          return currentTxId;
        }

        return items[0]?.txId ?? null;
      });
    } catch {
      setListError("Audit log is unavailable. Try again.");
      setAuditItems([]);
      setSelectedTxId(null);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadAuditLog();
  }, [loadAuditLog]);

  useEffect(() => {
    if (!selectedTxId) {
      setExpandedResponse(null);
      setDetailError(null);
      return;
    }

    let isActive = true;

    setIsLoadingDetail(true);
    setDetailError(null);
    setExpandedResponse(null);

    getAuditLogItem(selectedTxId)
      .then(item => {
        if (!isActive) {
          return;
        }

        setExpandedResponse(auditItemToExecuteResponse(item));
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setExpandedResponse(null);
        setDetailError("Audit detail is unavailable for this record.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingDetail(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedTxId]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return auditItems;
    }

    return auditItems.filter(item => {
      const txHash = item.txHash ?? "";

      return (
        item.txId.toLowerCase().includes(normalizedQuery) ||
        item.intent.toLowerCase().includes(normalizedQuery) ||
        item.status.toLowerCase().includes(normalizedQuery) ||
        item.reason.toLowerCase().includes(normalizedQuery) ||
        txHash.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [auditItems, query]);

  const expandedTxId = visibleItems.some(item => item.txId === selectedTxId) ? selectedTxId : null;
  const visibleExpandedResponse = expandedResponse?.txId === expandedTxId ? expandedResponse : null;
  const isExpandedDetailLoading =
    Boolean(expandedTxId) && (isLoadingDetail || (!detailError && expandedResponse?.txId !== expandedTxId));

  return (
    <SentinelShell active="audit">
      <div className="min-h-[calc(100vh-48px)] overflow-y-auto bg-[#0c0e12] p-4">
        <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="m-0 text-2xl font-semibold text-[#e2e2e8]">Audit Logs</h1>
            <p className="m-0 mt-1 text-sm text-[#bec9c2]">
              Decision records for natural-language DeFi intents and CAW execution evidence.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89938d]" />
              <input
                className="h-10 w-full rounded-lg border border-[#3f4944] bg-[#111318] pl-9 pr-3 font-mono text-xs text-[#e2e2e8] outline-none placeholder:text-[#89938d] focus:border-[#88d6b6] sm:w-80"
                onChange={event => setQuery(event.target.value)}
                placeholder="Search hash, status, or intent"
                value={query}
              />
            </div>
            <button
              aria-label="Refresh audit log"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#3f4944] bg-[#111318] text-[#e2e2e8] transition hover:border-[#88d6b6]/60 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoadingList}
              onClick={loadAuditLog}
              type="button"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoadingList ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {listError && (
          <div className="mb-4 rounded-lg border border-rose-300/25 bg-rose-300/10 p-3 text-sm text-rose-100">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{listError}</span>
            </div>
          </div>
        )}

        <AuditTable
          detailError={detailError}
          expandedResponse={visibleExpandedResponse}
          expandedTxId={expandedTxId}
          isLoadingDetail={isExpandedDetailLoading}
          isLoadingList={isLoadingList}
          items={visibleItems}
          onSelect={txId => setSelectedTxId(current => (current === txId ? null : txId))}
        />
      </div>
    </SentinelShell>
  );
};

export default AuditPage;
