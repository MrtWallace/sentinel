import json, os
from web3 import Web3


def execute_via_contract(w3, to, amount_eth, agent_private_key):
    abi_path = os.path.join(os.path.dirname(__file__),
                 "../contracts/out/SmartAccount.sol/SmartAccount.json")
    with open(abi_path) as f:
        abi = json.load(f)["abi"]

    contract_address = Web3.to_checksum_address(os.getenv("CONTRACT_ADDRESS"))
    contract = w3.eth.contract(address=contract_address, abi=abi)
    agent_address = w3.eth.account.from_key(agent_private_key).address

    tx = contract.functions.execute(
        to,
        w3.to_wei(amount_eth, "ether"),
        b""
    ).build_transaction({
        "from": agent_address,
        "nonce": w3.eth.get_transaction_count(agent_address),
        "maxFeePerGas": w3.to_wei(50, "gwei"),
        "maxPriorityFeePerGas": w3.to_wei(2, "gwei"),
    })

    try:
        signed = w3.eth.account.sign_transaction(tx, agent_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        return tx_hash.hex()
    except Exception as e:
        raise RuntimeError(f"Transaction failed: {e}")


SWAP_ROUTER = Web3.to_checksum_address("0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E")
WETH        = Web3.to_checksum_address("0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14")
USDC        = Web3.to_checksum_address("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238")

ROUTER_ABI = [{
    "name": "exactInputSingle",
    "type": "function",
    "inputs": [{"name": "params", "type": "tuple", "components": [
        {"name": "tokenIn",           "type": "address"},
        {"name": "tokenOut",          "type": "address"},
        {"name": "fee",               "type": "uint24"},
        {"name": "recipient",         "type": "address"},
        {"name": "amountIn",          "type": "uint256"},
        {"name": "amountOutMinimum",  "type": "uint256"},
        {"name": "sqrtPriceLimitX96", "type": "uint160"},
    ]}],
    "outputs": [{"name": "amountOut", "type": "uint256"}]
}]


def execute_swap(w3, from_token, to_token, amount_eth, agent_private_key):
    contract_address = Web3.to_checksum_address(os.getenv("CONTRACT_ADDRESS"))

    router = w3.eth.contract(address=SWAP_ROUTER, abi=ROUTER_ABI)
    calldata = router.encode_abi("exactInputSingle", args=[(
        WETH,
        USDC,
        3000,
        contract_address,
        w3.to_wei(amount_eth, "ether"),
        0,
        0
    )])

    abi_path = os.path.join(os.path.dirname(__file__),
                 "../contracts/out/SmartAccount.sol/SmartAccount.json")
    with open(abi_path) as f:
        abi = json.load(f)["abi"]
    contract = w3.eth.contract(address=contract_address, abi=abi)

    agent_address = w3.eth.account.from_key(agent_private_key).address
    tx = contract.functions.execute(
        SWAP_ROUTER,
        w3.to_wei(amount_eth, "ether"),
        calldata
    ).build_transaction({
        "from": agent_address,
        "nonce": w3.eth.get_transaction_count(agent_address),
        "maxFeePerGas": w3.to_wei(5, "gwei"),
        "maxPriorityFeePerGas": w3.to_wei(1, "gwei"),
        "gas": 300000,
        "value": 0,
    })

    try:
        signed = w3.eth.account.sign_transaction(tx, agent_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        return tx_hash.hex()
    except Exception as e:
        raise RuntimeError(f"Transaction failed: {e}")
