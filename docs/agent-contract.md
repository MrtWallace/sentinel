# Sentinel Agent Contract

> Updated: 2026-06-18 02:00 Asia/Shanghai

## Current Project State

Sentinel is a completed hackathon prototype and post-hackathon flagship project
asset. The public positioning is:

> CAW-governed autonomous trading execution agent.

It converts natural-language intents into bounded on-chain actions, evaluates
them through deterministic risk rules and LLM reviewers, and executes approved
transfers or swaps through Cobo Agentic Wallet with Pact policy enforcement.

## Active Scope

Current work is documentation, assetization, interview defense, and staged
learning. Do not add new product features unless the user explicitly starts a
checkpoint. Personal stage/checkpoint documents live under the ignored local
directory `docs/private/career/` when available.

Current proven demo capabilities:

- CAW `transfer_tokens` on Sepolia.
- CAW `contract_call` Uniswap V3 swap on Sepolia.
- Swap mainline: `wrap ETH -> approve WETH -> exactInputSingle`.
- Sentinel hard-rule rejection before CAW execution.
- CAW Pact policy denial after Sentinel approval.
- SQLite audit trail with sensitive field redaction.
- Frontend execute console, audit page, settings page, CAW evidence display.

## Non-Goals

Do not present Sentinel as:

- A production custody system.
- A mainnet trading product.
- A senior smart-contract security or custody platform.
- A fully autonomous multi-step DeFi strategy executor.

Do not add, unless explicitly approved:

- Mainnet execution.
- Multi-chain support.
- Complex private-key management.
- Redux/Zustand/i18n/charts/mobile polish.
- Advanced planner/reflector workflows.
- Write-capable MCP tools.

## Evidence Rule

Use only evidence already present in the repo or explicitly verified. Do not
invent wallet IDs, Pact IDs, tx hashes, block numbers, screenshots, or CI
results.

Primary public evidence is in:

- `README.md`
- `docs/evidence/sentinel-evidence.md`
- `docs/case-study-sentinel.md`

Archived implementation evidence remains under `hackathon/docs/*`, but those
files are not the default current context.

## Default Validation

For documentation-only changes:

```bash
git diff --check
```

For backend changes:

```bash
cd agent
python3 -m unittest discover -v
```

For frontend changes:

```bash
cd frontend
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
yarn workspace @se-2/nextjs build
```

For contract changes:

```bash
cd contracts
forge test
```
