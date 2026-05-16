# Sentinel — AI Agent for DeFi Operations

Your AI-driven DeFi assistant. Describe what you want in plain English — Sentinel parses the intent, enforces guardrails, and executes on-chain.

## Architecture

```
User (natural language)
        ↓
Python Agent (DeepSeek API — intent parsing + retry)
        ↓
Guardrails (blacklist + confirmation threshold)
        ↓
SmartAccount.sol (daily spend limit enforcement)
        ↓
Sepolia Testnet — Uniswap V3 swap / ETH transfers
```

## Agent Capabilities

| Feature | JD Mapping | Status |
|---------|-----------|--------|
| Natural language ETH transfer | AI agent workflows | ✅ |
| Uniswap V3 swap (real on-chain) | Tool integration | ✅ |
| Daily spend limit (on-chain) | Safety / guardrails | ✅ |
| Intent parsing — 20 cases, 95% accuracy | Testing & evaluation | ✅ |
| Blacklist + confirmation threshold | Human handoff / safety | ✅ |
| Latency / cost logging (~1.5s, ~$0.00004/call) | Observability | ✅ |
| Error handling & retry | Reliability | ✅ |
| Frontend dashboard (Scaffold-ETH 2) | Lightweight interface | ✅ |

## Demo

**Natural Language Swap**
```
> Swap 0.001 ETH to USDC
→ DeepSeek parses intent
→ SmartAccount.execute() → Uniswap V3 exactInputSingle
→ 8.02 USDC received on Sepolia
```

**ETH Transfer**
```
> Send 0.001 ETH to 0x742d...
→ Parsed → Guardrail check → SmartAccount.execute() → confirmed
```

**Guardrail Block**
```
> Send 5 ETH to 0xf39F...  (blacklisted address)
→ ❌ Blocked: address on blacklist
```

**Threshold Confirmation**
```
> Send 0.05 ETH to 0x...   (exceeds threshold)
→ ⚠️  Amount 0.05 ETH exceeds threshold. Confirm? (yes/no)
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Smart Contract | Solidity 0.8.20 + Foundry |
| Agent | Python 3.11 + web3.py + DeepSeek API |
| Frontend | Next.js 14 + Scaffold-ETH 2 + wagmi v2 |
| Network | Sepolia Testnet |

## Deployed Contract

- **SmartAccount**: [`0x3350A693619209193B01399e78d5897766c44074`](https://sepolia.etherscan.io/address/0x3350A693619209193B01399e78d5897766c44074) — Etherscan verified ✅

## Project Structure

```
sentinel/
├── contracts/
│   ├── src/SmartAccount.sol     # Core contract (owner + agent roles, daily limit)
│   ├── src/MockDEX.sol          # Test DeFi contract
│   ├── test/SmartAccount.t.sol  # Foundry tests (100% line coverage, 2 fuzz tests)
│   └── script/Deploy.s.sol
├── agent/
│   ├── main.py                  # Main loop with error handling
│   ├── intent.py                # DeepSeek intent parsing with retry
│   ├── executor.py              # On-chain execution (ETH transfer + Uniswap V3)
│   ├── guardrails.py            # Blacklist + confirmation threshold
│   ├── eval.py                  # Evaluation framework (20 cases)
│   └── requirements.txt
└── frontend/
    └── packages/nextjs/         # Scaffold-ETH 2 dashboard
```

## Demo Video

[![Sentinel Demo](https://img.shields.io/badge/Loom-Demo%20Video-blue)](https://www.loom.com/share/b8ebe76120e54a019d43fd9cd7ad92ef)

> Watch: natural language → Uniswap V3 swap + guardrail block, live on Sepolia

## Getting Started

### Prerequisites

- Python 3.11+
- Foundry (`foundryup`)
- Node.js + yarn

### Agent Setup

```bash
cd agent
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Fill in: RPC_URL, DEEPSEEK_API_KEY, WALLET_ADDRESS, AGENT_PRIVATE_KEY, CONTRACT_ADDRESS
```

### Run Agent

```bash
python main.py
# > What should I do? Send 0.001 ETH to 0x...
```

### Run Evaluation

```bash
python eval.py
# 19/20 passed (95% accuracy)
```

### Frontend

```bash
cd frontend
yarn install
yarn start
# http://localhost:3000
```

### Contract Tests

```bash
cd contracts
forge test
# 11/11 passed, 100% line coverage
```

## Roadmap

- [x] Phase 0 — Project skeleton
- [x] Phase 1-2 — SmartAccount contract + Foundry tests
- [x] Phase 3 — Python agent (ETH transfer, Uniswap V3, guardrails, eval, cost log)
- [x] Phase 4 — Scaffold-ETH 2 frontend
- [x] Phase 5 — Sepolia deploy + Etherscan verified
- [x] Demo video

## License

MIT
