# Sentinel Agent — main entry point
# Phase 3 will implement the actual agent loop
import json, os
from web3 import Web3

def main():
    print("Sentinel agent starting...")

def execute_transfer(w3, to, amount_eth, private_key):
    sender_address = w3.eth.account.from_key(private_key).address
    # 1. 构建交易
    tx = {
        'to': to,
        'value': w3.to_wei(amount_eth, 'ether'),
        'gas': 21000,          # 普通 ETH 转账固定是 21000
        'maxFeePerGas': w3.to_wei(50, 'gwei'),  # EIP-1559 模式下的 gas price
        'maxPriorityFeePerGas': w3.to_wei(2, 'gwei'),
        'nonce': w3.eth.get_transaction_count(sender_address),
        'chainId': 11155111    # Sepolia 的 chain ID
    }
    # 2. 用私钥签名
    signed = w3.eth.account.sign_transaction(tx, private_key)
    # 3. 广播
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash.hex()


def execute_via_contract(w3, to, amount_eth, agent_private_key):
    # 1. 加载 ABI
    abi_path = os.path.join(os.path.dirname(__file__), 
                 "../contracts/out/SmartAccount.sol/SmartAccount.json")
    with open(abi_path) as f:
        abi = json.load(f)["abi"]
    
    # 2. 创建合约实例
    contract_address = Web3.to_checksum_address(os.getenv("CONTRACT_ADDRESS"))
    contract = w3.eth.contract(address=contract_address, abi=abi)
    
    # 3. agent 地址
    agent_address = w3.eth.account.from_key(agent_private_key).address
    
    # 4. 构建调用 execute() 的交易
    tx = contract.functions.execute(
        to,
        w3.to_wei(amount_eth, "ether")
    ).build_transaction({
        "from": agent_address,
        "nonce": w3.eth.get_transaction_count(agent_address),
        "maxFeePerGas": w3.to_wei(50, "gwei"),
        "maxPriorityFeePerGas": w3.to_wei(2, "gwei"),
    })
    
    # 5. agent 私钥签名并广播
    signed = w3.eth.account.sign_transaction(tx, agent_private_key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash.hex()

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
    mock_dex_address = Web3.to_checksum_address(os.getenv("MOCK_DEX_ADDRESS"))
    MOCK_DEX_ABI = [{
        "name": "swap",
        "type": "function",
        "inputs": [
            {"name": "tokenOut", "type": "address"},
            {"name": "amountOutMin", "type": "uint256"}
        ],
        "outputs": [],
        "stateMutability": "payable"
    }]   
     # 1. encode swap calldata
    mock_dex = w3.eth.contract(address=mock_dex_address, abi=MOCK_DEX_ABI)
    calldata = mock_dex.encode_abi("swap", args=[
        Web3.to_checksum_address("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),  # USDC address
        0  # amountOutMin
    ])

    
    # 2. 通过 SmartAccount.execute() 调用 MockDEX
    abi_path = os.path.join(os.path.dirname(__file__),
             "../contracts/out/SmartAccount.sol/SmartAccount.json")
    with open(abi_path) as f:
        abi = json.load(f)["abi"]
    contract = w3.eth.contract(address=contract_address, abi=abi)

    agent_address = w3.eth.account.from_key(agent_private_key).address
    tx = contract.functions.execute(
        mock_dex_address,
        w3.to_wei(amount_eth, "ether"),
        calldata
    ).build_transaction({
        "from": w3.eth.account.from_key(agent_private_key).address,
        "nonce": w3.eth.get_transaction_count(w3.eth.account.from_key(agent_private_key).address),
        "maxFeePerGas": w3.to_wei(5, "gwei"),
        "maxPriorityFeePerGas": w3.to_wei(1, "gwei"),
        "gas": 300000,  # swap 交易通常需要更多的 gas，设置一个较大的值
        "value":0,
    })
    #print(f"[DEBUG] agent_address: {agent_address}")
    #print(f"[DEBUG] tx value: {tx.get('value')}")
    #print(f"[DEBUG] tx from: {tx.get('from')}")

    signed = w3.eth.account.sign_transaction(tx, agent_private_key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash.hex()
    
if __name__ == "__main__":
    main()