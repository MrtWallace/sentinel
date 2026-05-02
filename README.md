# Sentinel — AI Agent for DeFi Operations

Your AI-driven DeFi assistant. Describe what you want in plain English — Sentinel parses the intent, enforces guardrails, and executes on-chain.

> **Now building**: Uniswap V3 swap support (started 2026-05-02)

## Architecture

```
User (natural language)
        ↓
Python Agent (DeepSeek API — intent parsing)
        ↓
Guardrails (blacklist + confirmation threshold)
        ↓
SmartAccount.sol (daily spend limit enforcement)
        ↓
Sepolia Testnet (Uniswap V3 / ETH transfers)
```

## Project Structure

```
sentinel/
├── contracts/   Solidity smart contract (Foundry)
├── agent/       Python AI agent (DeepSeek + web3.py)
└── frontend/    Web UI (Scaffold-ETH 2) — coming Phase 4
```

## Tech Stack

| Layer     | Tech                              |
|-----------|-----------------------------------|
| Contract  | Solidity 0.8.20 + Foundry         |
| Agent     | Python 3.11 + web3.py             |
| AI Model  | DeepSeek API (deepseek-chat)      |
| Frontend  | Next.js 14 + Scaffold-ETH 2       |
| Network   | Sepolia Testnet                   |

## Agent Capabilities

| Feature | Status |
|---------|--------|
| Natural language ETH transfer | ✅ |
| Daily spend limit (on-chain) | ✅ |
| Intent parsing (20 cases, 95% accuracy) | ✅ |
| Guardrails — blacklist | ✅ |
| Guardrails — confirmation threshold | ✅ |
| Latency / cost logging | ✅ |
| Uniswap V3 swap | 🔨 |
| Frontend dashboard | 📅 |

## Deployed Contract

- **Network**: Sepolia Testnet
- **SmartAccount**: `0xbB5dA66c1D164050FaFf7A0165Cf7808e0C616DF`

## Getting Started

> 🚧 WIP — Full setup guide coming after Phase 4

## Roadmap

- [x] Phase 0 — Project skeleton & repo setup
- [x] Phase 1-2 — SmartAccount contract + Foundry tests (100% line coverage)
- [x] Phase 3 — Python agent (natural language → on-chain tx, guardrails, eval)
- [ ] Phase 3+ — Uniswap V3 swap support
- [ ] Phase 4 — Scaffold-ETH 2 frontend
- [ ] Phase 5 — Etherscan verified + demo video

## License

MIT
