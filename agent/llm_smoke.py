import argparse
from dataclasses import asdict

from dotenv import load_dotenv

from llm import build_default_llm_client
from models import TxProposal
from reviewers import LLMSecurityAuditor, LLMRiskAnalyst


load_dotenv()


def main():
    parser = argparse.ArgumentParser(
        description="Run one provider-agnostic LLM reviewer smoke test."
    )
    parser.add_argument(
        "--amount",
        default="0.001",
        help="Transfer amount for the smoke TxProposal.",
    )
    args = parser.parse_args()

    llm = build_default_llm_client()
    tx = TxProposal(
        action="transfer",
        amount=args.amount,
        recipient="0x1111111111111111111111111111111111111111",
        reasoning="LLM smoke test proposal.",
    )

    security = LLMSecurityAuditor(llm).review(tx)
    risk = LLMRiskAnalyst(llm).review(tx)

    print("security_audit=", asdict(security))
    print("risk_analysis=", asdict(risk))


if __name__ == "__main__":
    main()
