import argparse
import asyncio
import os
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv

from execution import CawConfig


load_dotenv(Path(__file__).resolve().parent / ".env")


async def main():
    parser = argparse.ArgumentParser(
        description="Run a single CAW transfer smoke test using the Python SDK."
    )
    parser.add_argument("--amount", required=True, help="Transfer amount, e.g. 0.001")
    parser.add_argument(
        "--dst-address",
        default=os.getenv(
            "CAW_DESTINATION",
            "0x1111111111111111111111111111111111111111",
        ),
        help="Destination address for the smoke transfer.",
    )
    parser.add_argument(
        "--request-id",
        default=None,
        help="Optional idempotency key. Defaults to caw-smoke-<uuid>.",
    )
    args = parser.parse_args()

    config = CawConfig.from_env()
    request_id = args.request_id or f"caw-smoke-{uuid4()}"
    _require_config(config)

    from cobo_agentic_wallet.client import WalletAPIClient
    from cobo_agentic_wallet.errors import PolicyDeniedError

    async with WalletAPIClient(
        base_url=config.api_url,
        api_key=config.api_key,
    ) as client:
        pact = await client.get_pact(config.pact_id)

    pact_api_key = pact.get("api_key") or config.api_key
    print(f"pact_id={config.pact_id} status={pact.get('status')}")
    print(f"request_id={request_id}")

    try:
        async with WalletAPIClient(
            base_url=config.api_url,
            api_key=pact_api_key,
        ) as pact_client:
            kwargs = {
                "wallet_uuid": config.wallet_id,
                "chain_id": config.chain_id,
                "dst_addr": args.dst_address,
                "token_id": config.token_id,
                "amount": args.amount,
                "request_id": request_id,
            }
            if config.src_address:
                kwargs["src_addr"] = config.src_address

            try:
                result = await pact_client.transfer_tokens(**kwargs)
            except TypeError:
                kwargs.pop("src_addr", None)
                result = await pact_client.transfer_tokens(**kwargs)

        print("status=allowed")
        print(f"tx_id={result.get('id') or result.get('cobo_transaction_id')}")
        print(f"caw_status={result.get('status')}")
        print(f"caw_status_display={result.get('status_display')}")
        print(f"tx_hash={result.get('transaction_hash')}")
        print(f"raw={result}")
    except PolicyDeniedError as exc:
        denial = exc.denial
        print("status=policy_denied")
        print(f"http_status={exc.status_code}")
        print(f"code={denial.code}")
        print(f"reason={denial.reason}")
        print(f"details={denial.details}")
        print(f"suggestion={denial.suggestion}")


def _require_config(config: CawConfig):
    missing = []
    for field_name in ["api_url", "api_key", "wallet_id", "pact_id", "src_address"]:
        if not getattr(config, field_name):
            missing.append(field_name)

    if missing:
        raise SystemExit(f"Missing CAW config: {', '.join(missing)}")


if __name__ == "__main__":
    asyncio.run(main())
