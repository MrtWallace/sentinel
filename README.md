# Sentinel — Risk-Aware Agentic Wallet Execution

Sentinel is a risk-aware autonomous trading agent for the Cobo Agentic Wallet track.

It turns a user intent into a structured transaction proposal, runs deterministic risk rules and agent reviews, retries bounded safer proposals when possible, and executes approved transfers through Cobo Agentic Wallet (CAW) with Pact policy enforcement.

> Active hackathon development is currently split across `feature/backend-risk-pipeline` and `feature/frontend-risk-console`. This README mirrors the current Cobo/Agent direction before final integration back to `main`.

## Cobo Track

- Track: Cobo — Agentic Economy x Cobo Agentic Wallet
- Direction: Autonomous Trading
- Positioning: risk-aware autonomous trading agent
- Primary execution path: Cobo Agentic Wallet
- Baseline / fallback: `SmartAccount.sol`

## Current Architecture

```text
User intent
  -> FastAPI /api/execute
  -> TxProposal
  -> RiskPipeline hard rules
  -> Agent B/C reviewers
  -> DecisionEngine
  -> optional bounded reproposal loop
  -> ExecutionBackend
  -> CAW transfer_tokens
  -> AuditLogger
  -> /api/audit-log/{tx_id}
```

Double-layer protection:

```text
Sentinel:
  AI/rule risk decision before execution

CAW:
  wallet-level Pact policy enforcement for real funds
```

## Current Status

Backend Cobo core is implemented and verified on the feature branch:

- FastAPI `/api/execute` risk decision API
- local audit list/detail API
- bounded reproposal loop with mutation guard
- provider-agnostic LLM reviewers
- CAW execution backend with real `transfer_tokens`
- CAW policy-deny handling mapped to final API `reject`
- per-user CAW wallet lifecycle API contract and persistence

Next backend priorities:

1. Input guard: sanitize user intent, validate LLM output, detect intent/proposal mismatch.
2. User-scoped CAW execution: route `/api/execute` through the user's CAW wallet and active Pact.
3. Minimal auth and rate limit: MetaMask signature login, JWT, simple per-user/IP throttling.
4. User risk config + Pact sync status.
5. SQLite audit with per-user CAW evidence queries.

Advanced Agent features are intentionally deferred:

- Agent Planner / multi-step autonomous workflow: P3, after Cobo core is stable.
- Agent Reflector / self-critique: P3, roadmap only for the current demo.
- Write-capable MCP and full external tool suite: P3, not a demo requirement.

The current Agent evidence layer should stay bounded: read-only MCP, basic tool calling, and memory anomaly detection are useful; complex autonomous planning is not required for the Cobo demo.

## Demo Evidence

CAW setup is verified on Sepolia testnet:

- CAW wallet active
- Transfer pact active
- CAW policy deny verified
- CAW allowed transfer verified
- `/api/execute` can trigger CAW transfer
- `/api/execute` returns final `reject` when CAW policy denies execution

Public-safe evidence examples:

```text
CAW wallet: 0x927f175c85d61237f817b499f739336b498384fe
Pact ID: 6514b2d6-6815-4d2f-bc8a-bdc8eca1f030
CAW allowed transfer tx:
0xc1bffdc320c41e9a4d23969fcdeb2dfdb9874808317a3bfe81f873e127f9fd5d
CAW policy deny reason:
matched_pact_transfer_deny_if
```

Private smoke-test details are stored locally under `hackathon/evidence/`, which is gitignored.

## API

Start the backend:

```bash
cd agent
source venv/bin/activate
PYTHONPATH=. uvicorn api:app --host 127.0.0.1 --port 8000
```

Health:

```bash
curl http://127.0.0.1:8000/health
```

Execute:

```bash
curl -X POST http://127.0.0.1:8000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"intent":"Send 0.001 ETH"}'
```

Audit detail:

```bash
curl http://127.0.0.1:8000/api/audit-log/<tx_id>
```

Audit list:

```bash
curl http://127.0.0.1:8000/api/audit-log
```

Wallet lifecycle endpoints:

```text
GET  /api/wallet/status
POST /api/wallet/connect-existing
POST /api/wallet/create
POST /api/wallet/pact
POST /api/wallet/refresh-status
```

Shared API response shapes are tracked in the backend feature branch contract:

```text
hackathon/docs/shared-api-contract.md
```

## Execution Modes

Default development mode is safe:

```bash
EXECUTION_BACKEND=mock
ENABLE_REAL_TX=false
```

CAW dry-run mode:

```bash
EXECUTION_BACKEND=caw
ENABLE_REAL_TX=false
```

Real CAW transfer mode:

```bash
EXECUTION_BACKEND=caw
ENABLE_REAL_TX=true
```

Required CAW env:

```bash
AGENT_WALLET_API_URL=
AGENT_WALLET_API_KEY=
AGENT_WALLET_WALLET_ID=
COBO_PACT_ID=
COBO_CHAIN_ID=SETH
COBO_TOKEN_ID=SETH
COBO_SRC_ADDRESS=
```

Never commit `.env` or API keys.

## Demo Scenarios

1. Safe CAW transfer

```text
Intent: Send 0.001 ETH
Sentinel decision: execute
CAW execution: submitted / succeeded
Audit: tx_id -> attempts + execution evidence
```

2. Sentinel hard-rule reject

```text
Intent: Swap 1 ETH to USDC
Sentinel decision: reject
CAW execution: skipped
```

3. CAW policy deny

```text
Intent: Send 0.005 ETH
Sentinel decision: execute
CAW execution: policy_denied
Final API decision: reject
```

4. Agentic retry

```text
Intent: Swap 0.2 ETH to USDC
Attempt 1: RiskAnalyst rejects amount
Reproposal: amount -> 0.01
Attempt 2: execute
```

## Tests

```bash
PYTHONPATH=agent agent/venv/bin/python -m unittest discover -s agent -p 'test_*.py'
```

Current backend test count:

```text
Ran 107 tests
OK
```

## Project Structure

```text
agent/
  api.py              FastAPI endpoints
  audit.py            local JSON audit logger
  execution.py        mock / CAW execution backend
  loop.py             bounded agent loop
  llm.py              provider-agnostic LLM client
  reproposal.py       reproposal agent + mutation guard
  reviewers.py        mock reviewers
  wallet_store.py     per-user CAW wallet persistence
  wallet_service.py   CAW wallet lifecycle service
  risk/               deterministic hard rules and pipeline
  caw_smoke.py        manual CAW SDK smoke script

contracts/
  src/SmartAccount.sol
  test/SmartAccount.t.sol

hackathon/docs/
  backend-plan.md
  backend-progress.md
  caw-setup.md
  demo-script.md
  shared-api-contract.md
  post-mvp-requirements.md
```

## Documentation

- `PROJECT_CONTEXT.md`: project context
- `hackathon/docs/backend-plan.md`: stable backend plan
- `hackathon/docs/backend-progress.md`: short progress tracker
- `hackathon/docs/shared-api-contract.md`: backend/frontend API contract
- `hackathon/docs/post-mvp-requirements.md`: Post-MVP Cobo + Agent requirements and priorities
- `hackathon/docs/caw-setup.md`: CAW setup and smoke-test flow
- `hackathon/docs/demo-script.md`: demo video script
- `hackathon/docs/frontend-plan.md`: frontend plan

If reading from `main` before integration, detailed Cobo/Agent planning docs may still live on the active feature branches:

- `feature/backend-risk-pipeline`
- `feature/frontend-risk-console`

## License

MIT
