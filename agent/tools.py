from dataclasses import asdict

from models import ToolCallEvidence, TxProposal


DEFAULT_VERIFIED_CONTRACTS = {
    "0x3bfa4769fb09eefc5a80d6e87c3b9c650f7ae48e": {
        "label": "Uniswap V3 SwapRouter",
        "verified": True,
    },
    "0xfff9976782d46cc05630d1f6ebab18b2324d6b14": {
        "label": "Sepolia WETH",
        "verified": True,
    },
}


class AgentToolRegistry:
    def __init__(
        self,
        verified_contracts: dict[str, dict] | None = None,
        gas_price_gwei: str = "12.4",
        token_prices: dict[str, str] | None = None,
    ):
        self.verified_contracts = verified_contracts or DEFAULT_VERIFIED_CONTRACTS
        self.gas_price_gwei = gas_price_gwei
        self.token_prices = token_prices or {"ETH/USDC": "10999.336"}

    @classmethod
    def default(cls):
        return cls()

    def run_for_review(self, agent_name: str, tx: TxProposal) -> list[ToolCallEvidence]:
        if agent_name == "SecurityAuditor":
            return [self.check_contract_verified(agent_name, tx)]
        if agent_name == "RiskAnalyst":
            return [
                self.check_gas_price(agent_name),
                self.get_token_price(agent_name, tx),
            ]
        return []

    def check_contract_verified(self, agent_name: str, tx: TxProposal) -> ToolCallEvidence:
        address = tx.to_contract or tx.recipient
        if not address:
            return ToolCallEvidence(
                agent=agent_name,
                tool="check_contract_verified",
                status="skipped",
                result={"address": None, "verified": None},
                reason="No contract or recipient address was present.",
            )

        metadata = self.verified_contracts.get(address.lower())
        verified = bool(metadata and metadata.get("verified"))
        return ToolCallEvidence(
            agent=agent_name,
            tool="check_contract_verified",
            status="succeeded",
            result={
                "address": address,
                "verified": verified,
                "label": metadata.get("label") if metadata else "unknown",
            },
            reason=None if verified else "Address is not in Sentinel's verified demo registry.",
        )

    def check_gas_price(self, agent_name: str) -> ToolCallEvidence:
        return ToolCallEvidence(
            agent=agent_name,
            tool="check_gas_price",
            status="succeeded",
            result={"gas_price_gwei": self.gas_price_gwei, "source": "static_demo_provider"},
        )

    def get_token_price(self, agent_name: str, tx: TxProposal) -> ToolCallEvidence:
        pair = f"{tx.from_token}/{tx.to_token}" if tx.from_token and tx.to_token else "N/A"
        price = self.token_prices.get(pair)
        if price is None:
            return ToolCallEvidence(
                agent=agent_name,
                tool="get_token_price",
                status="skipped",
                result={"pair": pair, "price": None},
                reason="No static price configured for token pair.",
            )

        return ToolCallEvidence(
            agent=agent_name,
            tool="get_token_price",
            status="succeeded",
            result={"pair": pair, "price": price, "source": "static_demo_provider"},
        )


def tool_calls_to_dicts(tool_calls: list[ToolCallEvidence]) -> list[dict]:
    return [asdict(call) for call in tool_calls]
