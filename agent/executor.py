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
    contract_address = os.getenv("CONTRACT_ADDRESS")
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
    
if __name__ == "__main__":
    main()