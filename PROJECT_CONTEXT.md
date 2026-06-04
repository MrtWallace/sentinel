# Sentinel — Project Context

> Root source of truth for Codex and other coding agents. Read this before suggesting or making changes.

Last updated: 2026-06-04

## 1. Project Positioning

**Sentinel is an AI Agent for DeFi operations.** A user gives a natural-language DeFi instruction, an AI agent parses the intent, applies safety guardrails, builds a transaction, and executes through a restricted SmartAccount on Sepolia.

Core claim:

```
natural language intent -> AI parsing -> guardrails -> SmartAccount execution -> audit/demo surface
```

## 2. Current State

There are two active layers in this repository.

### Baseline Sentinel

Implemented baseline:

- Solidity `SmartAccount` with `owner`, `agent`, `dailyLimit`, `dailySpent`, `deposit`, `withdraw`, `execute`, `setAgent`, and `receive`.
- `Executed` and `Deposited` events.
- Foundry tests covering owner/agent permissions, daily limit, reset behavior, deposit/receive, `setAgent`, and two fuzz paths.
- Python CLI agent:
  - DeepSeek intent parsing through OpenAI-compatible SDK.
  - Transfer and swap parsing.
  - `execute_via_contract` for ETH transfer.
  - `execute_swap` using Sepolia Uniswap V3 router calldata through `SmartAccount.execute`.
  - Blacklist guardrail and manual confirmation threshold.
  - Latency/cost JSONL logging in `agent/logs/`.
  - Evaluation script with 20 natural-language test cases.
- Scaffold-ETH frontend baseline:
  - Current `/` page reads SmartAccount balance, owner, agent, daily limit, and daily spent.
  - This is a status dashboard, not the planned risk-control console.

Current deployed SmartAccount in frontend config:

```text
0x3350A693619209193B01399e78d5897766c44074
```

Known mismatch:

- `frontend/packages/nextjs/contracts/deployedContracts.ts` uses `0x3350A693619209193B01399e78d5897766c44074`.
- Current `frontend/packages/nextjs/app/page.tsx` hardcodes old address `0xad7C1EBe561C9359C657FA36a156Cd213C8E6d7c` for `useBalance`.
- Frontend implementation must remove this hardcoded address and use Scaffold-ETH contract config.

### Hackathon Extension

The hackathon direction is a demo frontend and backend shape for a CAW-backed AI risk-control execution pipeline:

```
user intent
  -> Agent A proposal
  -> hard rule checks
  -> Agent B security review + Agent C risk review
  -> decision
  -> optional bounded reproposal attempts
  -> optional confirmation
  -> CAW execution / rejection / CAW policy denial
  -> audit log
```

The frontend plan is in `hackathon/docs/frontend-plan.md`.

The backend/API specs are in `hackathon/docs/backend-spec.md` and `hackathon/docs/backend-plan.md`. Current backend checkpoint status is tracked separately in `hackathon/docs/backend-progress.md`.

As of 2026-06-04, the backend feature work lives in the separate worktree `/home/admini/sentinel-backend` on branch `feature/backend-risk-pipeline`. The current backend has a first FastAPI implementation with:

- `GET /health`
- `POST /api/execute`

The current `/api/execute` response includes `tx_id`, `status`, `decision`, `decision_reason`, `attempts[]`, a legacy `decision_chain`, and an `execution` block. The legacy `decision_chain` exists for frontend compatibility, but the frontend plan must now treat `attempts[]` and `execution` as first-class demo data.

Confirmed backend direction from `hackathon/docs/backend-plan.md`:

- FastAPI is the MVP backend framework. Flask is only a later comparison exercise.
- Cobo Agentic Wallet (CAW) is now the Cobo track primary execution path.
- `SmartAccount.sol` is retained as baseline / fallback / technical evidence, not the primary Cobo demo funding path.
- MVP API surface is staged:
  - `POST /api/execute` exists first and must return a stable response shape for frontend work.
  - `GET /api/audit-log/{tx_id}` follows for detail records.
  - `POST /api/confirm` and `GET /api/audit-log` list API can be added after the minimal execute/detail path.
- `CONFIRM` is a backend terminal state in MVP.
- `/api/confirm` only records the user's approve/reject choice in the audit log for v1; it does not trigger a real on-chain transaction.
- Real Sepolia transactions must be gated by `ENABLE_REAL_TX=true`; default behavior should be dry-run/mock.
- Audit log v1 is local JSON plus HTTP query API, not chain-event reads.
- Agent B/C receive raw user input as untrusted data plus structured `TxProposal`.
- Agentic behavior uses a bounded retry loop:
  - `attempts[]` records each proposal, rule result, reviewer result, decision, and rejection source.
  - `ReproposalAgent` may revise a rejected proposal based on suggestions.
  - `MutationGuard` verifies that revisions lower risk and do not bypass hard rules.
- CAW evidence is now part of the demo surface:
  - CAW wallet address.
  - active pact id/status.
  - CAW request / transaction id.
  - CAW policy denial reason when applicable.

## 3. Tech Stack

Locked choices:

| Layer | Stack |
| --- | --- |
| Smart contract | Solidity 0.8.20+, Foundry |
| Agent | Python 3.11+, web3.py, OpenAI-compatible SDK for DeepSeek |
| AI model | DeepSeek `deepseek-chat` |
| Frontend | Scaffold-ETH 2, Next.js App Router, React, TypeScript, DaisyUI/Tailwind |
| Chain interaction | wagmi v2, viem |
| CAW execution | Cobo Agentic Wallet for Cobo track primary execution |
| Network | Sepolia |
| Secrets | `.env` for MVP |

Do not suggest:

- LangChain, AI SDK, Coinbase AgentKit for MVP.
- Full EIP-4337 account abstraction.
- Multi-chain support.
- Production-grade key management.
- Complex rule engines beyond the current hackathon plan.

## 4. Repository Structure

```text
sentinel/
├── contracts/                     # Baseline Foundry contracts
│   ├── src/SmartAccount.sol
│   ├── src/MockDEX.sol
│   ├── test/SmartAccount.t.sol
│   └── script/
├── agent/                         # Baseline Python CLI agent
│   ├── main.py
│   ├── intent.py
│   ├── executor.py
│   ├── guardrails.py
│   ├── eval.py
│   └── requirements.txt
├── frontend/                      # Scaffold-ETH 2 app
│   └── packages/nextjs/
├── hackathon/
│   ├── docs/frontend-spec.md
│   ├── docs/frontend-plan.md
│   ├── docs/frontend-checkpoint-0.md
│   ├── docs/backend-spec.md
│   ├── docs/backend-progress.md
│   └── docs/backend-plan.md
├── README.md                      # External project summary
├── PROJECT_CONTEXT.md             # This file
└── AGENTS.md                      # Agent collaboration instructions
```

## 5. Current Frontend Baseline

Files inspected for Checkpoint 0:

- `frontend/packages/nextjs/app/page.tsx`
- `frontend/packages/nextjs/app/layout.tsx`
- `frontend/packages/nextjs/components/ScaffoldEthAppWithProviders.tsx`
- `frontend/packages/nextjs/components/Header.tsx`
- `frontend/packages/nextjs/components/Footer.tsx`
- `frontend/packages/nextjs/contracts/deployedContracts.ts`
- `frontend/packages/nextjs/scaffold.config.ts`
- `frontend/packages/nextjs/styles/globals.css`

Facts:

- Providers should be kept: Wagmi, React Query, RainbowKit, ThemeProvider, progress bar, toaster.
- Default Scaffold-ETH Header/Footer currently show Scaffold-ETH branding, Debug Contracts, wallet connect, fork/support links, and theme switch.
- Planned demo should replace the visible shell but keep the provider infrastructure.
- Correct contract hook names in this repo are `useScaffoldReadContract` and `useScaffoldWriteContract`.
- Target network is Sepolia.

Detailed Checkpoint 0 notes: `hackathon/docs/frontend-checkpoint-0.md`.

## 6. MVP Boundaries

For the current frontend implementation:

- Build the risk-control console in checkpoints.
- Use English UI copy for external demo.
- Use Chinese internal docs and explanations.
- Use API-shaped mock data until the backend API endpoint needed by the current checkpoint is ready.
- Keep the frontend data access behind `frontend/packages/nextjs/lib/sentinel/api.ts`, with mapper functions handling backend DTO changes.
- Show CAW evidence when the backend provides it, but do not add wallet connect or front-end signing flows.
- Do not add wallet connect flow, auth, Redux/Zustand, i18n, charts, mobile polish, or chain-event audit reads in v1.
- Do not implement real streaming; use loading skeleton plus reveal animation.

## 7. Known Issues / Risks

- Foundry was not available in the current shell during this documentation refresh, so test status was not freshly verified by command.
- `agent/guardrails.py` still uses blocking `input()` for confirmation in the CLI flow.
- Swap path in `main.py` does not call `guardrails.check`; the hackathon risk pipeline is expected to supersede this.
- `agent/eval.py` has expected cases for ENS/WETH-like variants that may not match the strict parser perfectly.
- Frontend plan must be updated from a single `decision_chain` model to `attempts[] + execution` while preserving a simple demo UI.
- Current backend `/api/execute` has only a minimal `execution.status = "not_submitted"` block until CAW execution is implemented.
- Frontend status bar must shift from SmartAccount-only framing to CAW wallet / pact framing for the Cobo demo; SmartAccount can remain as secondary baseline/fallback context.
- Frontend `confirmExecution` must mirror backend MVP semantics: update audit/decision state, not assume confirmation sends a real transaction.
- Root README should not claim the planned risk-control console is already implemented until Checkpoint 1-7 are complete.

## 8. Collaboration Guidance

The user wants learning plus execution. For frontend implementation:

- Work checkpoint by checkpoint.
- Give concise explanations of data flow and component responsibilities.
- Do not generate the entire frontend in one pass.
- Surface scope creep directly.
- If implementation conflicts with this file or the plan, ask before deviating.
