# Sentinel - AI-Operated Smart Account
Your AI co-pilot on-chain. Set rules in plain English, Sentinel executes within your limits — you stay in control.


## Architecture

User (natural language)
↓
Python Agent (Claude API — intent parsing)
↓
SmartAccount.sol (daily spend limit enforcement)
↓
Sepolia Testnet

## Project Structure

sentinel/
├── contracts/   Solidity smart contract (Foundry)
├── agent/       Python AI agent (Claude API + web3.py)
└── frontend/    Web UI (Scaffold-ETH 2) — coming Phase 4

## Tech Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Contract  | Solidity 0.8.20 + Foundry     |
| Agent     | Python 3.11 + Anthropic SDK   |
| AI Model  | Claude (claude-sonnet-4-5)    |
| Frontend  | Next.js 14 + Scaffold-ETH 2   |
| Network   | Sepolia Testnet               |

## Getting Started

> 🚧 WIP — Full setup guide coming after Phase 3

## Roadmap

- [x] Phase 0 — Project skeleton & repo setup
- [X] Phase 1-2 — SmartAccount contract + Foundry tests
- [ ] Phase 3 — Python agent (natural language → on-chain tx)
- [ ] Phase 4 — Scaffold-ETH 2 frontend
- [ ] Phase 5 — Sepolia deploy + Etherscan verified

## License

MIT
