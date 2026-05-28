# Sentinel — AI Agent for DeFi Operations

Sentinel is an AI-driven DeFi execution prototype. A user describes an action in natural language; the Python agent parses the intent with DeepSeek, applies guardrails, and executes through a restricted SmartAccount on Sepolia.

## Current Architecture

```text
User natural-language intent
        ↓
Python CLI agent
        ↓
DeepSeek intent parser
        ↓
Guardrails
        ↓
SmartAccount.execute(...)
        ↓
Sepolia transfer / Uniswap V3 swap
        ↓
Frontend status dashboard / hackathon risk-control UI plan
```

## Current Capabilities

| Capability | Status |
| --- | --- |
| SmartAccount with owner and agent roles | Implemented |
| Daily spend limit enforced on-chain | Implemented |
| Owner can update agent with `setAgent` | Implemented |
| Direct ETH receive and deposit support | Implemented |
| `Executed` event for agent executions | Implemented |
| Natural-language transfer parsing | Implemented |
| Natural-language swap parsing | Implemented |
| Sepolia Uniswap V3 swap execution path | Implemented |
| Blacklist guardrail for transfers | Implemented |
| Manual threshold confirmation in CLI | Implemented |
| Latency and cost logging | Implemented |
| Evaluation script with 20 cases | Implemented |
| Simple Scaffold-ETH status dashboard | Implemented |
| AI risk-control console frontend | Planned, see `hackathon/docs/frontend-plan.md` |
| Backend HTTP API for decision chain / audit log | Planned, see `hackathon/docs/backend-plan.md` |

## Deployed Contract

SmartAccount currently configured in the frontend:

[`0x3350A693619209193B01399e78d5897766c44074`](https://sepolia.etherscan.io/address/0x3350A693619209193B01399e78d5897766c44074)

## Demo

[Loom demo video](https://www.loom.com/share/b8ebe76120e54a019d43fd9cd7ad92ef)

Example CLI flows:

```text
> Swap 0.001 ETH to USDC
-> DeepSeek parses intent
-> SmartAccount.execute(...) calls Uniswap V3 router
-> Transaction sent on Sepolia
```

```text
> Send 0.001 ETH to 0x742d...
-> Parsed as transfer
-> Guardrail check
-> SmartAccount.execute(...)
-> Transaction sent on Sepolia
```

```text
> Send 5 ETH to 0xf39F...
-> Blocked: address on blacklist
```

## Tech Stack

| Layer | Tech |
| --- | --- |
| Contracts | Solidity 0.8.20, Foundry |
| Agent | Python 3.11, web3.py, OpenAI-compatible SDK, DeepSeek API |
| Frontend | Scaffold-ETH 2, Next.js, React, TypeScript, DaisyUI/Tailwind |
| Chain libraries | wagmi v2, viem |
| Network | Sepolia |

## Project Structure

```text
sentinel/
├── contracts/
│   ├── src/SmartAccount.sol
│   ├── src/MockDEX.sol
│   ├── test/SmartAccount.t.sol
│   └── script/
├── agent/
│   ├── main.py
│   ├── intent.py
│   ├── executor.py
│   ├── guardrails.py
│   ├── eval.py
│   └── requirements.txt
├── frontend/
│   └── packages/nextjs/
├── hackathon/
│   └── docs/
│       ├── frontend-spec.md
│       ├── frontend-plan.md
│       ├── frontend-checkpoint-0.md
│       ├── backend-spec.md
│       └── backend-plan.md
└── PROJECT_CONTEXT.md
```

## Getting Started

### Agent

```bash
cd agent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Fill RPC_URL, DEEPSEEK_API_KEY, WALLET_ADDRESS, AGENT_PRIVATE_KEY, CONTRACT_ADDRESS

python main.py
```

### Evaluation

```bash
cd agent
python eval.py
```

### Contracts

```bash
cd contracts
forge test
```

Note: the current test file contains tests for deposit/receive, owner-only settings, withdraw, agent execution, daily-limit reset, `setAgent`, and two fuzz paths.

### Frontend

```bash
cd frontend
yarn install
yarn start
# http://localhost:3000
```

Current frontend is a simple Scaffold-ETH status dashboard. The planned hackathon console will be implemented checkpoint by checkpoint from `hackathon/docs/frontend-plan.md`.

## Hackathon Frontend Plan

The next frontend target is an AI risk-control console:

```text
intent input
  -> Agent A proposal
  -> hard rules
  -> Agent B/C reviews
  -> decision
  -> optional confirmation
  -> tx hash or rejection
  -> audit log
```

Implementation plan:

- `hackathon/docs/frontend-plan.md`
- `hackathon/docs/frontend-checkpoint-0.md`

## Hackathon Backend Plan

The planned backend extension is a FastAPI service for the risk-control demo:

```text
POST /api/execute
POST /api/confirm
GET  /api/audit-log
GET  /api/audit-log/{tx_id}
```

MVP behavior:

- `POST /api/execute` returns a full decision chain for executed/rejected/confirm-needed outcomes.
- `POST /api/confirm` records approve/reject in the audit log; it does not trigger a real transaction in v1.
- Real Sepolia transactions are gated by `ENABLE_REAL_TX=true`.
- Audit log v1 uses local JSON, not chain-event reads.

## Documentation

- `PROJECT_CONTEXT.md`: source of truth for agents.
- `hackathon/docs/frontend-plan.md`: frontend implementation plan.
- `hackathon/docs/frontend-spec.md`: original frontend product spec.
- `hackathon/docs/backend-plan.md`: backend implementation plan.
- `hackathon/docs/backend-spec.md`: original backend product spec.

## License

MIT
