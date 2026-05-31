import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import { StatusBadge } from "~~/components/sentinel/StatusBadge";

type DecisionChainPreviewProps = {
  compact?: boolean;
  variant?: "executed" | "confirm_needed" | "rejected";
};

const ruleRows = [
  ["AmountRule", "passed", "0.08 ETH is under the configured daily limit"],
  ["TargetRule", "passed", "Recipient is not on the local deny list"],
  ["PolicyRule", "review", "Amount requires explicit operator confirmation"],
] as const;

const executedRuleRows = [
  ["SlippageRule", "passed", "3% slippage is below the 5% threshold"],
  ["AmountRule", "passed", "0.01 ETH is within daily spend policy"],
  ["TargetRule", "passed", "Uniswap V3 router is allowlisted"],
] as const;

export const DecisionChainPreview = ({ compact = false, variant = "confirm_needed" }: DecisionChainPreviewProps) => {
  const isExecuted = variant === "executed";
  const isRejected = variant === "rejected";
  const rules = isExecuted ? executedRuleRows : ruleRows;
  const finalStatus: "executed" | "rejected" | "confirm_needed" = isRejected
    ? "rejected"
    : isExecuted
      ? "executed"
      : "confirm_needed";
  const summary = isExecuted
    ? {
        risk: "Low",
        reason: "All checks passed",
        nextAction: "View transaction links",
      }
    : isRejected
      ? {
          risk: "High",
          reason: "Hard policy rejected the intent",
          nextAction: "Review audit reason",
        }
      : {
          risk: "Medium",
          reason: "Recipient context requires operator approval",
          nextAction: "Approve / Reject",
        };

  return (
    <div className={compact ? "text-sm" : "flex h-full flex-col"}>
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-[#88d6b6]">
            <ShieldCheckIcon className="h-4 w-4" />
            <h2 className="m-0 text-base font-semibold">Decision Chain</h2>
          </div>
          <p className="m-0 mt-1 text-xs text-[#bec9c2]">
            Proposal, rule checks, agent review, and final audit record.
          </p>
        </div>
        <StatusBadge status={finalStatus} />
      </div>

      {!compact && (
        <DecisionSummary
          reason={summary.reason}
          risk={summary.risk}
          status={finalStatus}
          nextAction={summary.nextAction}
        />
      )}

      <div className={`${compact ? "" : "min-h-0 flex-1 overflow-y-auto"} divide-y divide-white/5`}>
        <StepBlock compact={compact} index="01" status="passed" title="Agent A Proposal">
          <div className={`grid gap-2 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
            <DataPoint compact={compact} label="Action" value={isExecuted ? "swap" : "transfer"} />
            <DataPoint compact={compact} label="Amount" value={isExecuted ? "0.01 ETH" : "0.08 ETH"} />
            <DataPoint compact={compact} label="Token Pair" value={isExecuted ? "ETH / USDC" : "ETH transfer"} />
            <DataPoint compact={compact} label="Target" value={isExecuted ? "Uniswap V3 Router" : "0x742d...f44e"} />
            <DataPoint compact={compact} label="Slippage" value={isExecuted ? "3%" : "N/A"} />
            <DataPoint
              compact={compact}
              label="Expected Output"
              value={isExecuted ? "24.69 USDC" : "Audit-only transfer proposal"}
            />
          </div>
        </StepBlock>

        <StepBlock compact={compact} index="02" status={isRejected ? "rejected" : "review"} title="Hard Rules">
          <div className="grid gap-2">
            {rules.map(([name, status, reason]) => (
              <div
                className={`grid gap-2 rounded-md border border-white/10 bg-[#0c0e12] ${
                  compact
                    ? "p-2 md:grid-cols-[140px_130px_minmax(0,1fr)]"
                    : "p-2.5 md:grid-cols-[140px_130px_minmax(0,1fr)]"
                }`}
                key={name}
              >
                <span className="font-mono text-xs text-[#e2e2e8]">{name}</span>
                <StatusBadge status={status === "passed" ? "passed" : "review"} />
                <span className="text-xs leading-5 text-[#bec9c2]">{reason}</span>
              </div>
            ))}
          </div>
        </StepBlock>

        <StepBlock compact={compact} index="03" status="passed" title="Agent B Security Review">
          <AgentReview
            compact={compact}
            findings={[
              "No prompt-injection pattern detected",
              "No suspicious approval request",
              "Target format is valid",
            ]}
            reason="Security agent sees no contract-level exploit pattern in the proposed execution path."
            risk="low"
          />
        </StepBlock>

        <StepBlock compact={compact} index="04" status={isExecuted ? "passed" : "review"} title="Agent C Risk Review">
          <AgentReview
            compact={compact}
            findings={
              isExecuted
                ? ["Market conditions normal", "Spend is below policy", "Expected output is within tolerance"]
                : ["Transfer amount is near confirmation threshold", "Recipient context needs operator approval"]
            }
            reason={
              isExecuted
                ? "Risk agent approves the swap because market and policy checks are aligned."
                : "Risk agent requests human confirmation before recording the final audit state."
            }
            risk={isExecuted ? "low" : "medium"}
          />
        </StepBlock>

        <StepBlock compact={compact} index="05" status={finalStatus} title="Final Decision">
          <div className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)]">
            <StatusBadge status={finalStatus} />
            <p className="m-0 text-sm leading-6 text-[#e2e2e8]">
              {isExecuted
                ? "All checks passed. Execution result can expose transaction links."
                : isRejected
                  ? "Hard policy rejected the intent before execution."
                  : "Manual confirmation is required before the audit state is finalized."}
            </p>
          </div>
        </StepBlock>

        <StepBlock compact={compact} index="06" status={finalStatus} title="Transaction / Audit Result">
          {isExecuted ? (
            <div className={`grid gap-2 ${compact ? "md:grid-cols-4" : "md:grid-cols-2"}`}>
              <DataPoint compact={compact} label="Simulation" value="success, gas 152,340" />
              <DataPoint compact={compact} label="TX Hash" value="0xabcdef...7890" />
              <DataPoint compact={compact} label="Explorer" value="Etherscan + Blockscout" />
              <DataPoint compact={compact} label="Audit State" value="Recorded" />
            </div>
          ) : isRejected ? (
            <div className="rounded-lg border border-[#ffb4ab]/25 bg-[#ffb4ab]/10 p-3 text-sm text-[#ffdad6]">
              Execution skipped. The rejected decision and rule reason remain available in the audit log.
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-3">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 text-amber-200" />
                  <p className="m-0 text-sm leading-6 text-amber-100">
                    Operator approval is required. No transaction hash is recorded until the confirmation decision is
                    captured.
                  </p>
                </div>
              </div>
            </div>
          )}
        </StepBlock>
      </div>

      {!compact && <DecisionActionBar status={finalStatus} />}
    </div>
  );
};

const DecisionSummary = ({
  nextAction,
  reason,
  risk,
  status,
}: {
  nextAction: string;
  reason: string;
  risk: string;
  status: "executed" | "rejected" | "confirm_needed";
}) => {
  return (
    <div className="border-b border-white/10 bg-[#0c0e12] px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <SummaryItem label="Status">
          <StatusBadge status={status} />
        </SummaryItem>
        <SummaryItem label="Risk" value={risk} />
        <SummaryItem className="min-w-[260px] flex-1" label="Reason" value={reason} />
        <SummaryItem label="Next action" value={nextAction} />
      </div>
    </div>
  );
};

const SummaryItem = ({
  children,
  className = "",
  label,
  value,
}: {
  children?: React.ReactNode;
  className?: string;
  label: string;
  value?: string;
}) => {
  return (
    <div
      className={`flex min-h-9 items-center gap-2 rounded-md border border-white/10 bg-[#111318] px-2.5 py-1.5 ${className}`}
    >
      <span className="font-mono text-[10px] uppercase text-[#89938d]">{label}</span>
      <span className="text-sm font-semibold text-[#e2e2e8]">{children ?? value}</span>
    </div>
  );
};

const DecisionActionBar = ({ status }: { status: "executed" | "rejected" | "confirm_needed" }) => {
  if (status === "confirm_needed") {
    return (
      <div className="border-t border-amber-300/20 bg-[#0c0e12]/95 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusBadge status="confirm_needed" />
              <span className="text-sm font-semibold text-amber-100">Operator confirmation required</span>
            </div>
            <p className="m-0 mt-1 text-xs leading-5 text-amber-100/75">
              Review is complete. Choose an audit outcome without scrolling through the full chain.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              className="h-10 rounded-lg border border-[#88d6b6] bg-[#88d6b6] px-4 text-sm font-semibold text-[#003828] transition hover:bg-[#a4f3d1]"
              type="button"
            >
              Approve
            </button>
            <button
              className="h-10 rounded-lg border border-[#ffb4ab]/40 bg-[#1a1c20] px-4 text-sm font-semibold text-[#ffdad6] transition hover:border-[#ffb4ab]/70"
              type="button"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 bg-[#0c0e12]/95 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-sm text-[#bec9c2]">
            {status === "executed"
              ? "Transaction and audit links are ready."
              : "Execution skipped and audit reason recorded."}
          </span>
        </div>
      </div>
    </div>
  );
};

const StepBlock = ({
  children,
  compact = false,
  index,
  status,
  title,
}: {
  children: React.ReactNode;
  compact?: boolean;
  index: string;
  status: "passed" | "review" | "executed" | "rejected" | "confirm_needed";
  title: string;
}) => {
  const iconClass =
    status === "rejected"
      ? "text-[#ffb4ab]"
      : status === "confirm_needed" || status === "review"
        ? "text-amber-200"
        : "text-[#88d6b6]";
  const Icon =
    status === "rejected"
      ? ShieldExclamationIcon
      : status === "confirm_needed" || status === "review"
        ? ExclamationTriangleIcon
        : CheckCircleIcon;

  return (
    <section
      className={`grid gap-3 ${compact ? "px-3 py-2.5 xl:grid-cols-[76px_minmax(0,1fr)]" : "px-4 py-2.5 xl:grid-cols-[86px_minmax(0,1fr)]"}`}
    >
      <div className="flex items-center gap-2 xl:block">
        <span className="font-mono text-[11px] text-[#89938d]">STEP {index}</span>
        <Icon className={`h-5 w-5 ${iconClass} xl:mt-2`} />
      </div>
      <div>
        <h3 className="m-0 text-sm font-semibold text-[#e2e2e8]">{title}</h3>
        <div className={compact ? "mt-2" : "mt-2.5"}>{children}</div>
      </div>
    </section>
  );
};

const DataPoint = ({ compact = false, label, value }: { compact?: boolean; label: string; value: string }) => {
  return (
    <div className={`rounded-md border border-white/10 bg-[#0c0e12] ${compact ? "p-2" : "p-2.5"}`}>
      <div className="font-mono text-[11px] uppercase text-[#89938d]">{label}</div>
      <div className="mt-1 break-words font-mono text-xs text-[#e2e2e8]">{value}</div>
    </div>
  );
};

const AgentReview = ({
  compact = false,
  findings,
  reason,
  risk,
}: {
  compact?: boolean;
  findings: string[];
  reason: string;
  risk: "low" | "medium";
}) => {
  return (
    <div
      className={`grid gap-3 ${compact ? "md:grid-cols-[110px_minmax(0,1fr)]" : "md:grid-cols-[120px_minmax(0,1fr)]"}`}
    >
      <div>
        <div className="font-mono text-[11px] uppercase text-[#89938d]">Risk Level</div>
        <StatusBadge label={risk.toUpperCase()} status={risk === "low" ? "passed" : "review"} />
      </div>
      <div>
        <ul className={`m-0 grid gap-1 p-0 ${compact ? "text-xs" : "text-sm"} text-[#bec9c2]`}>
          {findings.map(finding => (
            <li className="flex gap-2" key={finding}>
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#88d6b6]" />
              <span>{finding}</span>
            </li>
          ))}
        </ul>
        <p className={`m-0 ${compact ? "mt-2 text-xs leading-5" : "mt-3 text-sm leading-6"} text-[#e2e2e8]`}>
          {reason}
        </p>
      </div>
    </div>
  );
};
