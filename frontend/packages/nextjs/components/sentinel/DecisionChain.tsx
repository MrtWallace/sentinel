"use client";

import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import { StatusBadge } from "~~/components/sentinel/StatusBadge";
import type { AgentReview, ExecuteResponse, ExecutionStatus, RuleCheck, TxProposal } from "~~/lib/sentinel/types";

type DecisionChainProps = {
  isLoading: boolean;
  response: ExecuteResponse | null;
};

const STEP_COUNT = 6;

export const DecisionChain = ({ isLoading, response }: DecisionChainProps) => {
  const [visibleSteps, setVisibleSteps] = useState(response ? STEP_COUNT : 0);

  useEffect(() => {
    if (isLoading || !response) {
      setVisibleSteps(0);
      return;
    }

    setVisibleSteps(0);
    const timers = Array.from({ length: STEP_COUNT }, (_, index) =>
      globalThis.setTimeout(() => setVisibleSteps(index + 1), 110 + index * 140),
    );

    return () => {
      timers.forEach(timer => globalThis.clearTimeout(timer));
    };
  }, [isLoading, response?.txId, response]);

  if (isLoading) {
    return <DecisionChainSkeleton />;
  }

  if (!response) {
    return <DecisionChainEmpty />;
  }

  const chain = response.decisionChain;
  const proposal = chain.agentProposal.proposal;
  const agentB = chain.agentReviews.find(review => review.agent === "Agent B");
  const agentC = chain.agentReviews.find(review => review.agent === "Agent C");

  return (
    <div className="flex h-full flex-col">
      <DecisionHeader response={response} />
      <DecisionSummary response={response} />

      <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-white/5">
        {visibleSteps >= 1 && (
          <StepBlock index="01" status="passed" title="Agent A Proposal">
            <ProposalGrid proposal={proposal} />
            <p className="m-0 mt-3 text-xs leading-5 text-[#bec9c2]">{chain.agentProposal.reasoning}</p>
          </StepBlock>
        )}

        {visibleSteps >= 2 && (
          <StepBlock index="02" status={rulesStepStatus(chain.hardRules)} title="Hard Rules">
            <div className="grid gap-2">
              {chain.hardRules.map(rule => (
                <RuleRow key={rule.rule} rule={rule} />
              ))}
            </div>
          </StepBlock>
        )}

        {visibleSteps >= 3 && (
          <StepBlock index="03" status={agentStepStatus(agentB)} title="Agent B Security Review">
            <AgentReviewPanel fallback="Skipped after hard-rule rejection." review={agentB} />
          </StepBlock>
        )}

        {visibleSteps >= 4 && (
          <StepBlock index="04" status={agentStepStatus(agentC)} title="Agent C Risk Review">
            <AgentReviewPanel fallback="Skipped after hard-rule rejection." review={agentC} />
          </StepBlock>
        )}

        {visibleSteps >= 5 && (
          <StepBlock index="05" status={chain.finalDecision} title="Final Decision">
            <div className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)]">
              <StatusBadge status={chain.finalDecision} />
              <p className="m-0 text-sm leading-6 text-[#e2e2e8]">{chain.decisionReason}</p>
            </div>
          </StepBlock>
        )}

        {visibleSteps >= 6 && (
          <StepBlock index="06" status={chain.finalDecision} title="Transaction / Audit Result">
            <AuditResult response={response} />
          </StepBlock>
        )}
      </div>

      <DecisionActionBar status={response.status} />
    </div>
  );
};

const DecisionHeader = ({ response }: { response: ExecuteResponse }) => {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
      <div>
        <div className="flex items-center gap-2 text-[#88d6b6]">
          <ShieldCheckIcon className="h-4 w-4" />
          <h2 className="m-0 text-base font-semibold">Decision Chain</h2>
        </div>
        <p className="m-0 mt-1 text-xs text-[#bec9c2]">Proposal, rule checks, agent review, and final audit record.</p>
      </div>
      <StatusBadge status={response.status} />
    </div>
  );
};

const DecisionSummary = ({ response }: { response: ExecuteResponse }) => {
  const risk = getRiskLabel(response);
  const nextAction = getNextAction(response.status);

  return (
    <div className="border-b border-white/10 bg-[#0c0e12] px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <SummaryItem label="Status">
          <StatusBadge status={response.status} />
        </SummaryItem>
        <SummaryItem label="Risk" value={risk} />
        <SummaryItem className="min-w-[260px] flex-1" label="Reason" value={response.reason} />
        <SummaryItem label="Next action" value={nextAction} />
      </div>
    </div>
  );
};

const ProposalGrid = ({ proposal }: { proposal: TxProposal }) => {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      <DataPoint label="Action" value={proposal.action} />
      <DataPoint label="Amount" value={proposal.amount} />
      <DataPoint label="Token Pair" value={proposal.tokenPair ?? tokenPairFromProposal(proposal)} />
      <DataPoint label="Target" value={proposal.targetContract} />
      <DataPoint label="Slippage" value={proposal.slippage ?? "N/A"} />
      <DataPoint label="Expected Output" value={proposal.expectedOutput ?? "N/A"} />
    </div>
  );
};

const RuleRow = ({ rule }: { rule: RuleCheck }) => {
  const status = rule.passed ? (rule.severity === "confirm" ? "review" : "passed") : "rejected";

  return (
    <div className="grid gap-2 rounded-md border border-white/10 bg-[#0c0e12] p-2.5 md:grid-cols-[140px_130px_minmax(0,1fr)]">
      <span className="font-mono text-xs text-[#e2e2e8]">{rule.rule}</span>
      <StatusBadge status={status} />
      <span className="text-xs leading-5 text-[#bec9c2]">{rule.reason}</span>
    </div>
  );
};

const AgentReviewPanel = ({ fallback, review }: { fallback: string; review?: AgentReview }) => {
  if (!review) {
    return <div className="rounded-lg border border-white/10 bg-[#0c0e12] p-3 text-sm text-[#89938d]">{fallback}</div>;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
      <div className="rounded-lg border border-white/10 bg-[#0c0e12] p-3">
        <div className="font-mono text-[10px] uppercase text-[#89938d]">Risk Level</div>
        <div className="mt-1 text-sm font-semibold capitalize text-[#e2e2e8]">{review.riskLevel}</div>
        <div className="mt-3 font-mono text-[10px] uppercase text-[#89938d]">Role</div>
        <div className="mt-1 text-sm text-[#bec9c2]">{review.role}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-[#0c0e12] p-3">
        <div className="grid gap-1">
          {review.findings.map(finding => (
            <div className="flex items-start gap-2 text-xs leading-5 text-[#bec9c2]" key={finding}>
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#88d6b6]" />
              <span>{finding}</span>
            </div>
          ))}
        </div>
        <p className="m-0 mt-3 text-sm leading-6 text-[#e2e2e8]">{review.reasoning}</p>
      </div>
    </div>
  );
};

const AuditResult = ({ response }: { response: ExecuteResponse }) => {
  const { decisionChain } = response;

  if (decisionChain.txHash) {
    const etherscanUrl = `https://sepolia.etherscan.io/tx/${decisionChain.txHash}`;
    const blockscoutUrl = `https://eth-sepolia.blockscout.com/tx/${decisionChain.txHash}`;

    return (
      <div className="grid gap-2 md:grid-cols-2">
        <DataPoint label="Simulation" value={simulationLabel(decisionChain.simulation)} />
        <DataPoint label="TX Hash" value={shortHash(decisionChain.txHash)} />
        <a
          className="rounded-md border border-[#88d6b6]/30 bg-[#88d6b6]/10 px-3 py-2 font-mono text-xs text-[#a4f3d1] transition hover:border-[#88d6b6]"
          href={etherscanUrl}
          rel="noreferrer"
          target="_blank"
        >
          Sepolia Etherscan
        </a>
        <a
          className="rounded-md border border-[#88d6b6]/30 bg-[#88d6b6]/10 px-3 py-2 font-mono text-xs text-[#a4f3d1] transition hover:border-[#88d6b6]"
          href={blockscoutUrl}
          rel="noreferrer"
          target="_blank"
        >
          Blockscout backup
        </a>
      </div>
    );
  }

  if (response.status === "confirm_needed") {
    return (
      <div className="grid gap-3">
        <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-3">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 text-amber-200" />
            <div>
              <p className="m-0 text-sm font-semibold text-amber-100">
                {decisionChain.confirmation?.reason ?? "Operator confirmation required."}
              </p>
              <p className="m-0 mt-1 text-xs leading-5 text-amber-100/75">
                {decisionChain.confirmation?.riskNote ?? "Confirmation handling is implemented in Checkpoint 4."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (response.status === "failed") {
    return (
      <div className="rounded-lg border border-rose-300/25 bg-rose-300/10 p-3 text-sm text-rose-100">
        {response.error?.parsedReason ?? response.error?.message ?? decisionChain.decisionReason}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#ffb4ab]/25 bg-[#ffb4ab]/10 p-3 text-sm text-[#ffdad6]">
      Execution skipped. The rejected decision and rule reason remain available in the audit log.
    </div>
  );
};

const DecisionActionBar = ({ status }: { status: ExecutionStatus }) => {
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
              Confirmation action wiring is handled in Checkpoint 4.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              className="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-[#89938d]"
              disabled
            >
              Approve
            </button>
            <button
              className="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-[#89938d]"
              disabled
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
      <div className="flex items-center gap-2">
        <StatusBadge status={status} />
        <span className="text-sm text-[#bec9c2]">{getActionBarText(status)}</span>
      </div>
    </div>
  );
};

const StepBlock = ({
  children,
  index,
  status,
  title,
}: {
  children: React.ReactNode;
  index: string;
  status: "passed" | "review" | ExecutionStatus;
  title: string;
}) => {
  const Icon = statusIcon(status);

  return (
    <section className="grid gap-3 px-4 py-2.5 transition duration-300 xl:grid-cols-[86px_minmax(0,1fr)]">
      <div className="flex items-center gap-2 xl:block">
        <span className="font-mono text-[11px] text-[#89938d]">STEP {index}</span>
        <Icon className={`h-5 w-5 ${statusIconClass(status)} xl:mt-2`} />
      </div>
      <div>
        <h3 className="m-0 text-sm font-semibold text-[#e2e2e8]">{title}</h3>
        <div className="mt-2.5">{children}</div>
      </div>
    </section>
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
      <span className="truncate text-sm font-semibold text-[#e2e2e8]">{children ?? value}</span>
    </div>
  );
};

const DataPoint = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-md border border-white/10 bg-[#0c0e12] px-3 py-2">
      <div className="font-mono text-[10px] uppercase text-[#89938d]">{label}</div>
      <div className="mt-1 truncate text-sm text-[#e2e2e8]">{value}</div>
    </div>
  );
};

const DecisionChainSkeleton = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="h-5 w-40 rounded bg-white/10" />
        <div className="mt-2 h-3 w-72 rounded bg-white/5" />
      </div>
      <div className="grid gap-2 border-b border-white/10 bg-[#0c0e12] px-4 py-3 sm:grid-cols-4">
        {["Status", "Risk", "Reason", "Next action"].map(label => (
          <div className="rounded-md border border-white/10 bg-[#111318] px-2.5 py-2" key={label}>
            <div className="font-mono text-[10px] uppercase text-[#89938d]">{label}</div>
            <div className="mt-2 h-3 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto">
        {Array.from({ length: STEP_COUNT }, (_, index) => (
          <div className="grid gap-3 px-4 py-3 xl:grid-cols-[86px_minmax(0,1fr)]" key={index}>
            <div className="h-4 w-14 rounded bg-white/10" />
            <div>
              <div className="h-4 w-44 rounded bg-white/10" />
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="h-12 rounded-md bg-white/5" />
                <div className="h-12 rounded-md bg-white/5" />
                <div className="h-12 rounded-md bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 bg-[#0c0e12]/95 px-4 py-3">
        <div className="h-4 w-64 rounded bg-white/10" />
      </div>
    </div>
  );
};

const DecisionChainEmpty = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-[#88d6b6]">
            <ClockIcon className="h-4 w-4" />
            <h2 className="m-0 text-base font-semibold">Decision Chain</h2>
          </div>
          <p className="m-0 mt-1 text-xs text-[#bec9c2]">Run a demo intent to inspect the AI risk pipeline.</p>
        </div>
        <StatusBadge label="READY" status="review" />
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md rounded-lg border border-white/10 bg-[#0c0e12] p-5 text-center">
          <ShieldCheckIcon className="mx-auto h-8 w-8 text-[#88d6b6]" />
          <h3 className="m-0 mt-3 text-base font-semibold text-[#e2e2e8]">Awaiting intent</h3>
          <p className="m-0 mt-2 text-sm leading-6 text-[#bec9c2]">
            Choose a preset or run the current text input. The chain will reveal proposal, rules, agent reviews, and
            final decision.
          </p>
        </div>
      </div>
    </div>
  );
};

function rulesStepStatus(rules: RuleCheck[]): "passed" | "review" | "rejected" {
  if (rules.some(rule => !rule.passed && rule.severity === "reject")) {
    return "rejected";
  }

  if (rules.some(rule => rule.severity === "confirm")) {
    return "review";
  }

  return "passed";
}

function agentStepStatus(review?: AgentReview): "passed" | "review" | "rejected" {
  if (!review) {
    return "review";
  }

  if (review.passed) {
    return "passed";
  }

  return review.riskLevel === "medium" ? "review" : "rejected";
}

function tokenPairFromProposal(proposal: TxProposal): string {
  if (proposal.fromToken && proposal.toToken) {
    return `${proposal.fromToken} / ${proposal.toToken}`;
  }

  return proposal.recipient ? "ETH transfer" : "N/A";
}

function getRiskLabel(response: ExecuteResponse): string {
  if (response.status === "executed") {
    return "Low";
  }

  if (response.status === "confirm_needed") {
    return "Medium";
  }

  return response.status === "failed" ? "Unknown" : "High";
}

function getNextAction(status: ExecutionStatus): string {
  if (status === "executed") {
    return "View transaction links";
  }

  if (status === "confirm_needed") {
    return "Checkpoint 4 confirmation";
  }

  if (status === "failed") {
    return "Retry request";
  }

  return "Review audit reason";
}

function getActionBarText(status: ExecutionStatus): string {
  if (status === "executed") {
    return "Transaction and audit links are ready.";
  }

  if (status === "failed") {
    return "The failed request can be retried after reviewing the error.";
  }

  return "Execution skipped and audit reason recorded.";
}

function simulationLabel(simulation: ExecuteResponse["decisionChain"]["simulation"]): string {
  if (!simulation) {
    return "Skipped";
  }

  if (!simulation.success) {
    return simulation.parsedReason ?? "Failed";
  }

  return simulation.gasEstimate ? `success, gas ${simulation.gasEstimate.toLocaleString()}` : "success";
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function statusIcon(status: "passed" | "review" | ExecutionStatus) {
  if (status === "rejected" || status === "failed") {
    return ShieldExclamationIcon;
  }

  if (status === "confirm_needed" || status === "review") {
    return ExclamationTriangleIcon;
  }

  return CheckCircleIcon;
}

function statusIconClass(status: "passed" | "review" | ExecutionStatus): string {
  if (status === "rejected" || status === "failed") {
    return "text-[#ffb4ab]";
  }

  if (status === "confirm_needed" || status === "review") {
    return "text-amber-200";
  }

  return "text-[#88d6b6]";
}
