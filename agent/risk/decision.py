from models import AgentResult, DecisionResult, RuleResult


class DecisionEngine:
    def decide(
        self,
        hard_rules: list[RuleResult],
        security_audit: AgentResult | None = None,
        risk_analysis: AgentResult | None = None,
    ) -> DecisionResult:

        # 1. hard rule rejected -> reject
        for rule in hard_rules:
            if rule.status == "rejected":
                return DecisionResult(
                    decision="reject",
                    reason=f"Hard rule '{rule.rule_name}' rejected the transaction: {rule.reason}",
                    suggestions=[],
                )
        # 2. agent failed/high -> reject with suggestions
        failed_agents = [
            agent for agent in [security_audit, risk_analysis]
            if agent and (not agent.passed or agent.risk_level == "high")
        ]

        if failed_agents:
            suggestions = []
            agent_names = []
            for agent in failed_agents:
                suggestions.extend(agent.suggestions)
                agent_names.append(agent.agent_name)

            return DecisionResult(
                decision="reject",
                reason=f"Agents flagged the transaction: {', '.join(agent_names)}",
                suggestions=suggestions,
            )
        # 3. hard rule confirm or agent medium -> confirm
        for rule in hard_rules:
            if rule.status == "confirm":
                return DecisionResult(
                    decision="confirm",
                    reason=f"Hard rule '{rule.rule_name}' requires confirmation: {rule.reason}",
                    suggestions=[],
                )
        for agent_result in [security_audit, risk_analysis]:
            if agent_result and agent_result.risk_level == "medium":
                return DecisionResult(
                    decision="confirm",
                    reason=f"Agent '{agent_result.agent_name}' flagged the transaction as medium risk: {agent_result.reasoning}",
                    suggestions=agent_result.suggestions,
                )
        # 4. otherwise -> execute
        return DecisionResult(
            decision="execute",
            reason="Transaction meets all criteria for execution.",
            suggestions=[],
        )