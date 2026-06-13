"use client";

import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import { StatusBadge } from "~~/components/sentinel/StatusBadge";
import { getCawAuditEvidence, isCawPolicyDenied } from "~~/lib/sentinel/auditEvidenceViewModel";
import type {
  AgentReview,
  AttemptRecord,
  ExecuteResponse,
  ExecutionStatus,
  MemoryAnomaly,
  RuleCheck,
  ToolCall,
  ToolCallEvidence,
  TxProposal,
} from "~~/lib/sentinel/types";

type DecisionChainProps = {
  actionError?: string | null;
  auditUserAddress?: string;
  isLoading: boolean;
  onConfirm?: (approved: boolean) => void;
  pendingConfirmationAction?: ConfirmationAction | null;
  response: ExecuteResponse | null;
};

type ConfirmationAction = "approve" | "reject";

const STEP_COUNT = 6;

export const DecisionChain = ({
  actionError,
  auditUserAddress,
  isLoading,
  onConfirm,
  pendingConfirmationAction,
  response,
}: DecisionChainProps) => {
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
  const shouldShowAttempts = response.attempts.length > 1;

  return (
    <div className="flex h-full flex-col">
      <DecisionHeader response={response} />
      <DecisionSummary response={response} />
      {shouldShowAttempts && <AttemptsTimeline response={response} />}

      <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-white/5">
        {visibleSteps >= 1 && (
          <StepBlock index="01" status="passed" summary={proposalSummary(proposal)} title="Agent A Proposal">
            <ProposalGrid proposal={proposal} />
            <p className="m-0 mt-3 text-xs leading-5 text-[#bec9c2]">{chain.agentProposal.reasoning}</p>
            <ToolCallList calls={stepToolCalls(response, "Agent A", chain.agentProposal.toolCalls)} />
          </StepBlock>
        )}

        {visibleSteps >= 2 && (
          <StepBlock
            index="02"
            status={rulesStepStatus(chain.hardRules)}
            summary={rulesSummary(chain.hardRules)}
            title="Hard Rules"
          >
            <div className="grid gap-2">
              {chain.hardRules.map(rule => (
                <RuleRow key={rule.rule} rule={rule} />
              ))}
            </div>
          </StepBlock>
        )}

        {visibleSteps >= 3 && (
          <StepBlock
            index="03"
            status={agentStepStatus(agentB)}
            summary={agentSummary(agentB)}
            title="Agent B Security Review"
          >
            <AgentReviewPanel fallback="Skipped after hard-rule rejection." review={agentB} />
            <ToolCallList calls={stepToolCalls(response, "Agent B", agentB?.toolCalls)} />
          </StepBlock>
        )}

        {visibleSteps >= 4 && (
          <StepBlock
            index="04"
            status={agentStepStatus(agentC)}
            summary={agentSummary(agentC)}
            title="Agent C Risk Review"
          >
            <AgentReviewPanel fallback="Skipped after hard-rule rejection." review={agentC} />
            <MemoryAnomalyPanel anomalies={response.memoryAnomalies} />
            <ToolCallList calls={stepToolCalls(response, "Agent C", agentC?.toolCalls)} />
          </StepBlock>
        )}

        {visibleSteps >= 5 && (
          <StepBlock
            index="05"
            status={chain.finalDecision}
            summary={executionSummary(response)}
            title="Execution Decision"
          >
            <div className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)]">
              <StatusBadge status={chain.finalDecision} />
              <p className="m-0 text-sm leading-6 text-[#e2e2e8]">{chain.decisionReason}</p>
            </div>
            <ExecutionDetailGrid response={response} />
            <ToolCallList calls={executionToolCalls(response)} />
            {isSecurityRejection(response) && (
              <div className="mt-2 rounded-md border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs leading-5 text-rose-100">
                Security rejection: {response.reason}
              </div>
            )}
            {isCawPolicyDenied(response.execution) && (
              <div className="mt-2 rounded-md border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-xs leading-5 text-rose-100">
                Sentinel allowed, CAW Pact blocked execution.
              </div>
            )}
          </StepBlock>
        )}

        {visibleSteps >= 6 && (
          <StepBlock
            index="06"
            status={chain.finalDecision}
            summary={resultSummary(response)}
            title="Transaction / Audit Result"
          >
            <AuditResult response={response} userAddress={auditUserAddress} />
          </StepBlock>
        )}
      </div>

      <DecisionActionBar
        actionError={actionError}
        onConfirm={onConfirm}
        pendingConfirmationAction={pendingConfirmationAction}
        response={response}
      />
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
  const nextAction = getNextAction(response);

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
      <DataPoint className="sm:col-span-2 xl:col-span-2" label="Target" value={proposal.targetContract} />
      <DataPoint label="Slippage" value={proposal.slippage ?? "N/A"} />
      <DataPoint label="Expected Output" value={proposal.expectedOutput ?? "N/A"} />
      <DataPoint label="Deadline" value={proposal.deadline ?? "N/A"} />
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
        {review.suggestions.length > 0 && (
          <div className="mt-3 grid gap-2">
            {review.suggestions.map(suggestion => (
              <div
                className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100"
                key={`${suggestion.field}-${suggestion.suggestedValue}`}
              >
                <span className="font-semibold">{suggestion.field}</span>
                {" -> "}
                {suggestion.suggestedValue}: {suggestion.reason}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AttemptsTimeline = ({ response }: { response: ExecuteResponse }) => {
  return (
    <div className="border-b border-white/10 bg-[#0c0e12] px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase text-[#89938d]">Agentic Attempts</div>
          <p className="m-0 mt-1 text-xs text-[#bec9c2]">Bounded reproposal history returned by the backend.</p>
        </div>
        <span className="font-mono text-xs text-[#88d6b6]">{response.attempts.length} attempts</span>
      </div>
      <div className="grid gap-2">
        {response.attempts.map(attempt => (
          <AttemptCard attempt={attempt} key={attempt.attemptIndex} />
        ))}
      </div>
    </div>
  );
};

const AttemptCard = ({ attempt }: { attempt: AttemptRecord }) => {
  const agentB = attempt.agentReviews.find(review => review.agent === "Agent B");
  const agentC = attempt.agentReviews.find(review => review.agent === "Agent C");
  const summary =
    attempt.suggestions.length > 0
      ? attempt.suggestions.map(suggestion => `${suggestion.field} -> ${suggestion.suggestedValue}`).join(", ")
      : attempt.decisionReason;

  return (
    <details className="group rounded-md border border-white/10 bg-[#111318]">
      <summary className="grid cursor-pointer list-none gap-2 p-2.5 [&::-webkit-details-marker]:hidden lg:grid-cols-[88px_120px_minmax(0,1fr)_minmax(0,1fr)_28px]">
        <div className="font-mono text-xs text-[#89938d]">ATTEMPT {attempt.attemptIndex}</div>
        <StatusBadge status={decisionToStatus(attempt.decision)} />
        <div className="min-w-0 text-xs leading-5 text-[#bec9c2]">
          <span className="font-semibold text-[#e2e2e8]">{attempt.proposal.amount}</span>{" "}
          {attempt.proposal.tokenPair ?? attempt.proposal.action}
          {attempt.rejectionSource !== "none" && (
            <span className="ml-2 text-[#ffb4ab]">source: {attempt.rejectionSource}</span>
          )}
        </div>
        <div className="min-w-0 text-xs leading-5 text-[#bec9c2]">{summary}</div>
        <ChevronDownIcon className="h-4 w-4 text-[#89938d] transition group-open:rotate-180" />
      </summary>

      <div className="grid gap-3 border-t border-white/10 px-3 pb-3 pt-3">
        <ProposalGrid proposal={attempt.proposal} />

        <div className="rounded-md border border-white/10 bg-[#0c0e12] px-3 py-2">
          <div className="font-mono text-[10px] uppercase text-[#89938d]">Decision Reason</div>
          <p className="m-0 mt-1 text-xs leading-5 text-[#bec9c2]">{attempt.decisionReason}</p>
        </div>

        {attempt.suggestions.length > 0 && (
          <div className="grid gap-2">
            {attempt.suggestions.map(suggestion => (
              <div
                className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100"
                key={`${attempt.attemptIndex}-${suggestion.field}-${suggestion.suggestedValue}`}
              >
                <span className="font-semibold">{suggestion.field}</span>
                {" -> "}
                {suggestion.suggestedValue}: {suggestion.reason}
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-2">
          {attempt.hardRules.map(rule => (
            <RuleRow key={`${attempt.attemptIndex}-${rule.rule}`} rule={rule} />
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <AgentReviewPanel fallback="Agent B was skipped for this attempt." review={agentB} />
          <AgentReviewPanel fallback="Agent C was skipped for this attempt." review={agentC} />
        </div>
      </div>
    </details>
  );
};

const ToolCallList = ({ calls }: { calls: ToolCallView[] }) => {
  if (calls.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2">
      {calls.map(call => (
        <div
          className="grid gap-2 rounded-md border border-white/10 bg-[#0c0e12] px-3 py-2 md:grid-cols-[150px_110px_minmax(0,1fr)]"
          key={`${call.name}-${call.status}-${call.outputSummary ?? "none"}`}
        >
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase text-[#89938d]">Tool</div>
            <div className="mt-1 break-words font-mono text-xs text-[#e2e2e8]">{call.name}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase text-[#89938d]">Status</div>
            <div className={`mt-1 font-mono text-xs ${toolStatusClass(call.status)}`}>
              {call.status}
              {typeof call.durationMs === "number" ? ` / ${call.durationMs}ms` : ""}
            </div>
          </div>
          <div className="min-w-0 text-xs leading-5 text-[#bec9c2]">
            {call.inputSummary && <div className="break-words">Input: {call.inputSummary}</div>}
            {call.outputSummary && <div className="break-words">Output: {call.outputSummary}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

const MemoryAnomalyPanel = ({ anomalies }: { anomalies: MemoryAnomaly[] }) => {
  if (anomalies.length === 0) {
    return (
      <div className="mt-3 rounded-md border border-[#88d6b6]/20 bg-[#88d6b6]/10 px-3 py-2 text-xs leading-5 text-[#d8f8e8]">
        Memory anomaly: no amount spike, no frequency spike, no new-contract anomaly returned for this decision.
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      {anomalies.map(anomaly => (
        <div
          className={`rounded-md border px-3 py-2 text-xs leading-5 ${memoryAnomalyClass(anomaly.severity)}`}
          key={`${anomaly.kind}-${anomaly.reason}`}
        >
          <span className="font-mono uppercase">{anomaly.kind}</span>: {anomaly.reason}
        </div>
      ))}
    </div>
  );
};

const ExecutionDetailGrid = ({ response }: { response: ExecuteResponse }) => {
  const operation =
    response.decisionChain.agentProposal.proposal.action === "swap" ? "contract_call" : "transfer_tokens";

  return (
    <div className="mt-3 grid gap-2 md:grid-cols-2">
      <DataPoint label="Backend" value={response.execution.backend} />
      <DataPoint label="Operation" value={operation} />
      <DataPoint label="Request ID" value={response.execution.requestId ?? "Not submitted"} />
      <DataPoint label="Execution Status" value={response.execution.status} />
      <DataPoint
        className="md:col-span-2"
        label="Target"
        value={response.decisionChain.agentProposal.proposal.targetContract}
      />
    </div>
  );
};

type ToolCallView = {
  name: string;
  status: string;
  durationMs?: number;
  inputSummary?: string;
  outputSummary?: string;
};

const AuditResult = ({ response, userAddress }: { response: ExecuteResponse; userAddress?: string }) => {
  const { decisionChain } = response;

  if (hasCawEvidence(response)) {
    return <CawEvidencePanel response={response} userAddress={userAddress} />;
  }

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

  if (response.status === "executed") {
    return (
      <div className="grid gap-2 md:grid-cols-2">
        <DataPoint label="Simulation" value={simulationLabel(decisionChain.simulation)} />
        <DataPoint label="Execution Backend" value={response.execution.backend} />
        <DataPoint label="Execution Status" value={response.execution.status} />
        <DataPoint
          label="TX Hash"
          value={response.execution.txHash ? shortHash(response.execution.txHash) : "Not submitted"}
        />
        <div className="rounded-lg border border-[#88d6b6]/25 bg-[#88d6b6]/10 p-3 text-sm leading-6 text-[#d8f8e8] md:col-span-2">
          {response.execution.reason ??
            "Execution evidence will show CAW request or transaction details once the backend submits through CAW."}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#ffb4ab]/25 bg-[#ffb4ab]/10 p-3 text-sm text-[#ffdad6]">
      Execution skipped. The rejected decision and rule reason remain available in the audit log.
    </div>
  );
};

const CawEvidencePanel = ({ response, userAddress }: { response: ExecuteResponse; userAddress?: string }) => {
  const evidence = getCawAuditEvidence(response, userAddress);

  return (
    <div className="grid gap-3">
      <div
        className={`rounded-lg border p-3 ${
          evidence.isPolicyDenied
            ? "border-rose-300/25 bg-rose-300/10 text-rose-100"
            : "border-[#88d6b6]/25 bg-[#88d6b6]/10 text-[#d8f8e8]"
        }`}
      >
        <div className="flex items-start gap-2">
          {evidence.isPolicyDenied ? (
            <ShieldExclamationIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-200" />
          ) : (
            <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#88d6b6]" />
          )}
          <div>
            <p className="m-0 text-sm font-semibold">{evidence.title}</p>
            <p className="m-0 mt-1 text-xs leading-5 opacity-80">{evidence.body}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {evidence.points.map(point => (
          <DataPoint
            className={evidencePointClass(point.tone)}
            key={point.label}
            label={point.label}
            value={point.value}
          />
        ))}
      </div>

      {evidence.explorerLinks.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {evidence.explorerLinks.map(link => (
            <a
              className="rounded-md border border-[#88d6b6]/30 bg-[#88d6b6]/10 px-3 py-2 font-mono text-xs text-[#a4f3d1] transition hover:border-[#88d6b6]"
              href={link.href}
              key={link.href}
              rel="noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const DecisionActionBar = ({
  actionError,
  onConfirm,
  pendingConfirmationAction,
  response,
}: {
  actionError?: string | null;
  onConfirm?: (approved: boolean) => void;
  pendingConfirmationAction?: ConfirmationAction | null;
  response: ExecuteResponse;
}) => {
  const status = response.status;

  if (status === "confirm_needed") {
    const isPending = Boolean(pendingConfirmationAction);

    return (
      <div className="border-t border-amber-300/20 bg-[#0c0e12]/95 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusBadge status="confirm_needed" />
              <span className="text-sm font-semibold text-amber-100">Operator confirmation required</span>
            </div>
            <p className="m-0 mt-1 text-xs leading-5 text-amber-100/75">
              Approve or reject records the operator decision in the mock audit state. It does not imply real on-chain
              execution.
            </p>
            {actionError && <p className="m-0 mt-2 text-xs leading-5 text-[#ffb4ab]">{actionError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#88d6b6]/35 bg-[#88d6b6]/10 px-4 text-sm font-semibold text-[#a4f3d1] transition hover:border-[#88d6b6] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-[#89938d]"
              disabled={!onConfirm || isPending}
              onClick={() => onConfirm?.(true)}
            >
              {pendingConfirmationAction === "approve" && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
              {pendingConfirmationAction === "approve" ? "Approving" : "Approve"}
            </button>
            <button
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#ffb4ab]/35 bg-[#ffb4ab]/10 px-4 text-sm font-semibold text-[#ffdad6] transition hover:border-[#ffb4ab] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-[#89938d]"
              disabled={!onConfirm || isPending}
              onClick={() => onConfirm?.(false)}
            >
              {pendingConfirmationAction === "reject" && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
              {pendingConfirmationAction === "reject" ? "Rejecting" : "Reject"}
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
        <span className="text-sm text-[#bec9c2]">{getActionBarText(response)}</span>
      </div>
    </div>
  );
};

const StepBlock = ({
  children,
  index,
  status,
  summary,
  title,
}: {
  children: React.ReactNode;
  index: string;
  status: "passed" | "review" | ExecutionStatus;
  summary: string;
  title: string;
}) => {
  const Icon = statusIcon(status);

  return (
    <section className="grid gap-3 px-4 py-2.5 transition duration-300 xl:grid-cols-[86px_minmax(0,1fr)]">
      <div className="flex items-center gap-2 xl:block">
        <span className="font-mono text-[11px] text-[#89938d]">STEP {index}</span>
        <Icon className={`h-5 w-5 ${statusIconClass(status)} xl:mt-2`} />
      </div>
      <details className="group min-w-0">
        <summary className="grid cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden md:grid-cols-[180px_minmax(0,1fr)_72px] md:items-center">
          <h3 className="m-0 text-sm font-semibold text-[#e2e2e8]">{title}</h3>
          <p className="m-0 min-w-0 text-xs leading-5 text-[#bec9c2]">{summary}</p>
          <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase text-[#89938d]">
            Details
            <ChevronDownIcon className="h-4 w-4 transition group-open:rotate-180" />
          </span>
        </summary>
        <div className="mt-2.5">{children}</div>
      </details>
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

const DataPoint = ({ className = "", label, value }: { className?: string; label: string; value: string }) => {
  return (
    <div className={`rounded-md border border-white/10 bg-[#0c0e12] px-3 py-2 ${className}`}>
      <div className="font-mono text-[10px] uppercase text-[#89938d]">{label}</div>
      <div className="mt-1 break-words text-sm leading-5 text-[#e2e2e8]">{value}</div>
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

function proposalSummary(proposal: TxProposal): string {
  const pair = proposal.tokenPair ?? tokenPairFromProposal(proposal);
  return `${proposal.action.toUpperCase()} ${proposal.amount} ${pair} via ${proposal.targetContract}`;
}

function rulesSummary(rules: RuleCheck[]): string {
  const passed = rules.filter(rule => rule.passed).length;
  const rejected = rules.filter(rule => !rule.passed).length;
  return rejected > 0
    ? `${passed}/${rules.length} passed, ${rejected} blocked`
    : `${passed}/${rules.length} checks passed`;
}

function agentSummary(review?: AgentReview): string {
  if (!review) {
    return "Skipped for this decision";
  }

  return `${review.passed ? "Passed" : "Flagged"} / ${review.riskLevel} risk`;
}

function executionSummary(response: ExecuteResponse): string {
  const operation =
    response.decisionChain.agentProposal.proposal.action === "swap" ? "contract_call" : "transfer_tokens";
  return `${response.execution.backend} ${operation} / ${response.execution.status}`;
}

function resultSummary(response: ExecuteResponse): string {
  if (response.execution.txHash) {
    return `tx ${shortHash(response.execution.txHash)}`;
  }

  if (response.execution.blockNumber || response.execution.usdcReceived) {
    return [
      response.execution.blockNumber && `block ${response.execution.blockNumber}`,
      response.execution.usdcReceived,
    ]
      .filter(Boolean)
      .join(" / ");
  }

  return response.reason;
}

function stepToolCalls(response: ExecuteResponse, agent: string, localCalls: ToolCall[] | undefined): ToolCallView[] {
  const normalizedLocal = (localCalls ?? []).map(normalizeToolCall);
  const globalCalls = response.toolCalls.filter(call => call.agent === agent).map(normalizeToolEvidence);

  return [...normalizedLocal, ...globalCalls];
}

function executionToolCalls(response: ExecuteResponse): ToolCallView[] {
  return response.toolCalls
    .filter(call => call.agent.toLowerCase().includes("execution") || call.tool.toLowerCase().includes("caw"))
    .map(normalizeToolEvidence);
}

function normalizeToolCall(call: ToolCall): ToolCallView {
  return {
    name: call.name,
    status: call.status,
    durationMs: call.durationMs,
    inputSummary: call.inputSummary,
    outputSummary: call.outputSummary,
  };
}

function normalizeToolEvidence(call: ToolCallEvidence): ToolCallView {
  return {
    name: call.tool,
    status: call.status,
    inputSummary: call.reason ?? resultSummaryText(call.result, "input_summary"),
    outputSummary: resultSummaryText(call.result, "output_summary") ?? compactResult(call.result),
  };
}

function resultSummaryText(result: Record<string, unknown>, key: string): string | undefined {
  const value = result[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function compactResult(result: Record<string, unknown>): string {
  const entries = Object.entries(result).slice(0, 4);
  if (entries.length === 0) {
    return "No structured output returned";
  }

  return entries.map(([key, value]) => `${key}: ${String(value)}`).join("; ");
}

function toolStatusClass(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized.includes("fail")) {
    return "text-[#ffb4ab]";
  }

  if (normalized.includes("skip")) {
    return "text-amber-200";
  }

  return "text-[#88d6b6]";
}

function memoryAnomalyClass(severity: string): string {
  if (severity === "critical") {
    return "border-rose-300/20 bg-rose-300/10 text-rose-100";
  }

  if (severity === "warning") {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }

  return "border-[#88d6b6]/20 bg-[#88d6b6]/10 text-[#d8f8e8]";
}

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
    if (!response.decisionChain.txHash) {
      return "Medium";
    }

    return "Low";
  }

  if (response.status === "confirm_needed") {
    return "Medium";
  }

  if (response.status === "pending") {
    return "Low";
  }

  return response.status === "failed" ? "Unknown" : "High";
}

function getNextAction(response: ExecuteResponse): string {
  if (response.status === "executed") {
    if (response.execution.status === "not_submitted") {
      return "Await CAW submission evidence";
    }

    if (!response.decisionChain.txHash) {
      return "Audit state updated";
    }

    return "View transaction links";
  }

  if (response.status === "confirm_needed") {
    return "Await operator decision";
  }

  if (response.status === "failed") {
    return "Retry request";
  }

  if (response.status === "pending") {
    return "Poll CAW transaction status";
  }

  return "Review audit reason";
}

function getActionBarText(response: ExecuteResponse): string {
  if (response.status === "executed") {
    if (response.execution.status === "not_submitted") {
      return "Risk decision is ready. CAW submission evidence is not available yet.";
    }

    if (!response.decisionChain.txHash) {
      return "Operator decision recorded in audit state.";
    }

    return "Transaction and audit links are ready.";
  }

  if (response.status === "failed") {
    return "The failed request can be retried after reviewing the error.";
  }

  if (response.status === "pending") {
    return "CAW accepted the request and is still processing it. Poll the audit trail for final on-chain evidence.";
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

function hasCawEvidence(response: ExecuteResponse): boolean {
  return (
    response.execution.backend === "caw" ||
    Boolean(response.execution.requestId) ||
    Boolean(response.execution.walletId) ||
    Boolean(response.execution.walletAddress) ||
    Boolean(response.execution.pactId)
  );
}

function evidencePointClass(tone: "neutral" | "success" | "warning" | "danger" | undefined): string {
  if (tone === "danger") {
    return "border-rose-300/20 bg-rose-300/10";
  }

  if (tone === "warning") {
    return "border-amber-300/20 bg-amber-300/10";
  }

  if (tone === "success") {
    return "border-[#88d6b6]/20 bg-[#88d6b6]/10";
  }

  return "";
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

function decisionToStatus(decision: "execute" | "reject" | "confirm"): ExecutionStatus {
  if (decision === "execute") {
    return "executed";
  }

  if (decision === "confirm") {
    return "confirm_needed";
  }

  return "rejected";
}

// CP10: Detect backend input guard / security rejections for distinct UI treatment.
function isSecurityRejection(response: ExecuteResponse): boolean {
  if (response.status !== "rejected") {
    return false;
  }

  const reason = (response.reason ?? "").toLowerCase();
  const sentinelReason = (response.decisionChain.decisionReason ?? "").toLowerCase();

  return (
    reason.includes("input guard") ||
    reason.includes("prompt injection") ||
    reason.includes("control character") ||
    sentinelReason.includes("input guard") ||
    sentinelReason.includes("prompt injection")
  );
}
