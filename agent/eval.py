from intent import parse_intent

TEST_CASES = [
    # ── 正常转账 (10) ──
    {
        "input": "Send 0.001 ETH to 0x742d35Cc6634C0532925a3b8D4C9D5A4",
        "expected": {"action": "transfer", "to": "0x742d35Cc6634C0532925a3b8D4C9D5A4", "amount_eth": 0.001}
    },
    {
        "input": "transfer 5 ETH to 0x1234567890abcdef1234567890abcdef12345678",
        "expected": {"action": "transfer", "to": "0x1234567890abcdef1234567890abcdef12345678", "amount_eth": 5}
    },
    {
        "input": "Send 0.5 ETH to vitalik.eth",
        "expected": {"action": "transfer", "to": "vitalik.eth", "amount_eth": 0.5}
    },
    {
        "input": "send 2500 ETH to 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
        "expected": {"action": "transfer", "to": "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B", "amount_eth": 2500}
    },
    {
        "input": "pay 0.1 ETH to 0xRecipientAddress",
        "expected": {"action": "transfer", "to": "0xRecipientAddress", "amount_eth": 0.1}
    },
    {
        "input": "Send 1.5 to 0xdeADbeEf00000000000000000000000000000000",
        "expected": {"action": "transfer", "to": "0xdeADbeEf00000000000000000000000000000000", "amount_eth": 1.5}
    },
    {
        "input": "Please transfer 10000 ETH to 0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        "expected": {"action": "transfer", "to": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52", "amount_eth": 10000}
    },
    {
        "input": "send 50 ETH to 0xaaa…bbb",
        "expected": {"action": "transfer", "to": "0xaaa…bbb", "amount_eth": 50}
    },
    {
        "input": "I want to send 200 ETH to address 0x0000000000000000000000000000000000000001",
        "expected": {"action": "transfer", "to": "0x0000000000000000000000000000000000000001", "amount_eth": 200}
    },
    {
        "input": "transfer 0.00123 wETH to 0x1111111111111111111111111111111111111111",
        "expected": {"action": "transfer", "to": "0x1111111111111111111111111111111111111111", "amount_weth": 0.00123}
    },

    # ── 无法识别的输入 (3) ──
    {
        "input": "What's the weather like today?",
        "expected": {"action": "unknown"}
    },
    {
        "input": "Hi, how are you?",
        "expected": {"action": "unknown"}
    },
    {
        "input": "Can you write me a poem about Ethereum?",
        "expected": {"action": "unknown"}
    },

    # ── 边界情况 (3) ──
    {
        "input": "Send 100 ETH",
        "expected": {"action": "unknown", "reason": "missing recipient address"}
    },
    {
        "input": "Send ETH to 0x742d35Cc6634C0532925a3b8D4C9D5A4",
        "expected": {"action": "unknown", "reason": "missing amount"}
    },
    {
        "input": "transfer",
        "expected": {"action": "unknown", "reason": "missing amount and recipient"}
    },

    # ── 中文指令 (2) ──
    {
        "input": "转 50 ETH 到 0x742d35Cc6634C0532925a3b8D4C9D5A4",
        "expected": {"action": "transfer", "to": "0x742d35Cc6634C0532925a3b8D4C9D5A4", "amount_eth": 50}
    },
    {
        "input": "帮我转 0.2 个 ETH 到 0x1234567890abcdef1234567890abcdef12345678",
        "expected": {"action": "transfer", "to": "0x1234567890abcdef1234567890abcdef12345678", "amount_eth": 0.2}
    },

    # ── Swap 类型 (2) ──
    {
        "input": "Swap 100 USDC to ETH",
        "expected": {"action": "swap", "from_token": "USDC", "from_amount": 100, "to_token": "ETH"}
    },
    {
        "input": "swap 5 ETH for 10000 USDC",
        "expected": {"action": "swap", "from_token": "ETH", "from_amount": 5, "to_token": "USDC", "to_amount": 10000}
    },
]



def evaluate():
    passed = 0
    for case in TEST_CASES:
        result = parse_intent(case["input"])
        expected = case["expected"]
        
        # TODO: 写判断逻辑
        # 检查 action、to（大小写不敏感）、amount_eth（浮点误差容忍）
        # 通过则 passed += 1，失败则打印是哪条失败了
        if result.get("action") != expected.get("action"):
            print(f"FAIL: {case['input']}")
            print(f"  expected action={expected['action']}, got action={result.get('action')}")
            continue

        # 只有 transfer 才检查 to 和 amount
        if expected.get("action") == "transfer":
            if result.get("to", "").lower() != expected.get("to", "").lower():
                print(f"FAIL: {case['input']}")
                print(f"  expected to={expected.get('to')}, got to={result.get('to')}")
                continue
            amount_key = next((k for k in expected if k.startswith("amount_")), None)
            if amount_key and abs(result.get("amount_eth", 0) - expected.get(amount_key, 0)) > 0.0001:
                print(f"FAIL: {case['input']}")
                print(f"  expected {amount_key}={expected.get(amount_key)}, got amount_eth={result.get('amount_eth')}")
                continue

        passed += 1
        print(f"PASS: {case['input']}")

        
    total = len(TEST_CASES)
    print(f"\n{passed}/{total} passed ({passed/total*100:.0f}% accuracy)")

if __name__ == "__main__":
    evaluate()
