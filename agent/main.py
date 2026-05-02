# Sentinel Agent — main entry point
# Phase 3 will implement the actual agent loop
from web3 import Web3
from dotenv import load_dotenv
import os,time
from intent import parse_intent
from executor import execute_via_contract
from guardrails import check

load_dotenv()

def main():
    rpc_url = os.getenv("RPC_URL")
    w3 = Web3(Web3.HTTPProvider(rpc_url))

    # TODO 1: 用 w3.is_connected() 检查连接，打印 True/False
    # TODO 2: 打印你的钱包地址的 Sepolia ETH 余额（用 w3.eth.get_balance）
    #         地址先硬编码，格式: "0x..."
    #         余额单位是 wei，用 w3.from_wei(..., 'ether') 转换
    wallet_address = os.getenv("WALLET_ADDRESS")
    balance = w3.eth.get_balance(wallet_address)
    print(f"Connected: {w3.is_connected()}")
    print(f"Address: {wallet_address}")
    print(f"Balance: {w3.from_wei(balance, 'ether')} ETH")
    user_input = input("What should I do? > ")
    intent = parse_intent(user_input)
    print(f"Parsed intent: {intent}")
    if intent.get("action") == "transfer":
        private_key = os.getenv("AGENT_PRIVATE_KEY")
        allowed, reason = check(intent["to"], intent["amount_eth"])
        if not allowed:
            print(f"Transaction rejected: {reason}")
            return
        else:
            tx_hash = execute_via_contract(w3, intent["to"], intent["amount_eth"], private_key)
            print(f"Transaction sent: https://sepolia.etherscan.io/tx/0x{tx_hash}")
    elif intent.get("action") == "swap":
        from executor import execute_swap
        private_key = os.getenv("AGENT_PRIVATE_KEY")
        tx_hash = execute_swap(w3, intent["from_token"], intent["to_token"], intent["from_amount"], private_key)
        print(f"Swap sent: https://sepolia.etherscan.io/tx/0x{tx_hash}")
    else:
        print("Could not parse intent.")


if __name__ == "__main__":
    main()
