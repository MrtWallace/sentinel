from models import AgentResult, Suggestion, TxProposal


class MockSecurityAuditor:
    def __init__(self, mode="safe"):
        self.mode = mode

    def review(self, tx: TxProposal) -> AgentResult:
        if self.mode == "high_risk":
            return AgentResult(
                agent_name="SecurityAuditor",
                passed=False,
                risk_level="high",
                findings=["Potentially unsafe contract interaction"],
                reasoning="Mock security auditor flagged the contract interaction as risky.",
                suggestions=[
                    Suggestion(
                        field="slippage",
                        suggested_value=0.01,
                        reason="Reduce slippage to lower execution risk.",
                    )
                ],
            )

        return AgentResult(
            agent_name="SecurityAuditor",
            passed=True,
            risk_level="low",
            findings=[],
            reasoning="Mock security auditor found no issues.",
        )


class MockRiskAnalyst:
    def __init__(self, mode="safe"):
        self.mode = mode

    def review(self, tx: TxProposal) -> AgentResult:
        if self.mode == "high_risk":
            return AgentResult(
                agent_name="RiskAnalyst",
                passed=False,
                risk_level="high",
                findings=["Transaction amount creates high exposure"],
                reasoning="Mock risk analyst flagged the transaction as too exposed.",
                suggestions=[
                    Suggestion(
                        field="amount",
                        suggested_value="0.01",
                        reason="Reduce amount to lower exposure.",
                    )
                ],
            )

        return AgentResult(
            agent_name="RiskAnalyst",
            passed=True,
            risk_level="low",
            findings=[],
            reasoning="Mock risk analyst found low exposure.",
        )