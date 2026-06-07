from models import RuleResult, TxProposal


class RiskPipeline:
    def __init__(self, rules):
        self.rules = rules

    def run(self, tx: TxProposal) -> list[RuleResult]:
        results = []

        for rule in self.rules:
            result = rule.check(tx)
            results.append(result)

            if result.status == "rejected":
                break

        return results