from dataclasses import dataclass
from typing import Literal

from models import AgentResult, DecisionResult, RuleResult, TxProposal
from reproposal import MockReproposalAgent, MutationGuard, MutationGuardResult
from risk.decision import DecisionEngine


@dataclass
class AttemptRecord:
    attempt_index: int
    tx_proposal: TxProposal
    hard_rules: list[RuleResult]
    security_audit: AgentResult | None
    risk_analysis: AgentResult | None
    decision: DecisionResult
    rejection_source: Literal["sentinel", "caw", "none"] = "none"


@dataclass
class AgenticLoopResult:
    final_decision: DecisionResult
    attempts: list[AttemptRecord]
    guard_result: MutationGuardResult | None = None


class AgenticLoop:
    def __init__(
        self,
        risk_pipeline,
        security_auditor,
        risk_analyst,
        decision_engine: DecisionEngine | None = None,
        reproposal_agent: MockReproposalAgent | None = None,
        mutation_guard: MutationGuard | None = None,
        max_retries: int = 2,
    ):
        self.risk_pipeline = risk_pipeline
        self.security_auditor = security_auditor
        self.risk_analyst = risk_analyst
        self.decision_engine = decision_engine or DecisionEngine()
        self.reproposal_agent = reproposal_agent or MockReproposalAgent()
        self.mutation_guard = mutation_guard or MutationGuard()
        self.max_retries = max_retries

    def run(self, tx: TxProposal) -> AgenticLoopResult:
        attempts = []
        current_tx = tx

        for retry_index in range(self.max_retries + 1):
            hard_rules = self.risk_pipeline.run(current_tx)
            security_audit = None
            risk_analysis = None

            if not self._has_hard_rejection(hard_rules):
                security_audit = self.security_auditor.review(current_tx)
                risk_analysis = self.risk_analyst.review(current_tx)

            decision = self.decision_engine.decide(
                hard_rules=hard_rules,
                security_audit=security_audit,
                risk_analysis=risk_analysis,
            )
            attempts.append(
                AttemptRecord(
                    attempt_index=retry_index + 1,
                    tx_proposal=current_tx,
                    hard_rules=hard_rules,
                    security_audit=security_audit,
                    risk_analysis=risk_analysis,
                    decision=decision,
                    rejection_source=(
                        "sentinel" if decision.decision == "reject" else "none"
                    ),
                )
            )

            if decision.decision != "reject" or not decision.suggestions:
                return AgenticLoopResult(final_decision=decision, attempts=attempts)

            if retry_index == self.max_retries:
                return AgenticLoopResult(final_decision=decision, attempts=attempts)

            revised_tx = self.reproposal_agent.revise(
                current_tx,
                decision.suggestions,
            )
            guard_result = self.mutation_guard.validate(
                current_tx,
                revised_tx,
                decision.suggestions,
            )
            if not guard_result.passed:
                return AgenticLoopResult(
                    final_decision=DecisionResult(
                        decision="reject",
                        reason=f"MutationGuard rejected reproposal: {guard_result.reason}",
                        suggestions=[],
                    ),
                    attempts=attempts,
                    guard_result=guard_result,
                )

            current_tx = revised_tx

        return AgenticLoopResult(
            final_decision=DecisionResult(
                decision="reject",
                reason="AgenticLoop exhausted retry budget.",
                suggestions=[],
            ),
            attempts=attempts,
        )

    def _has_hard_rejection(self, hard_rules: list[RuleResult]) -> bool:
        return any(rule.status == "rejected" for rule in hard_rules)
