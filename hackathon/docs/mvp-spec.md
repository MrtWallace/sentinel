# Sentinel MVP Spec

> **Status:** Archive / historical MVP specification.
> **Last updated:** 2026-06-06
> **Maintenance:** This file replaces the old `backend-spec.md` and `frontend-spec.md`. It records the original MVP scope and should not be treated as the source of truth for Post-MVP Cobo + Agent work.

Current planning documents:

- Backend plan: `docs/backend-plan.md`
- Frontend plan: `docs/frontend-plan.md`
- Shared API contract: `docs/shared-api-contract.md`
- Post-MVP requirements: `docs/post-mvp-requirements.md`

---

## MVP Goal

Sentinel MVP demonstrates a natural-language DeFi intent flowing through AI parsing, deterministic risk checks, agent review, execution or rejection, and audit logging.

Original MVP chain:

```text
User intent
  -> Agent A structured transaction proposal
  -> RiskPipeline hard rules
  -> Agent B Security Auditor + Agent C Risk Analyst
  -> DecisionEngine
  -> execution evidence
  -> audit log
```

The MVP initially centered on SmartAccount and a simple frontend. During the hackathon, the execution story shifted to Cobo Agentic Wallet (CAW) for the Cobo track, while SmartAccount remained baseline/fallback/technical evidence.

---

## Backend MVP Scope

Backend and contract work covered:

- `TxProposal` structured output from natural language.
- Risk rules:
  - `AmountRule`
  - `SlippageRule`
  - `WhitelistRule`
  - `ApprovalRule`
  - `FrequencyRule`
- Agent reviewers:
  - Agent B: Security Auditor
  - Agent C: Risk Analyst
- `DecisionEngine` producing `execute`, `confirm`, or `reject`.
- `AgenticLoop` with bounded retry and `MutationGuard`.
- FastAPI endpoints:
  - `GET /health`
  - `POST /api/execute`
  - `GET /api/audit-log`
  - `GET /api/audit-log/{tx_id}`
  - `POST /api/confirm`
- JSON audit log for demo usage.
- CAW execution backend for transfer and policy-deny evidence.

Important MVP constraints:

- Sepolia only.
- No mainnet execution.
- LLM outputs must be parsed and validated.
- Hard-rule rejection stops execution before CAW.
- `CONFIRM` is an API/UI terminal state in MVP; confirm does not automatically submit a real chain transaction.

---

## Frontend MVP Scope

Frontend work covered:

- Main execution console at `/`.
- Audit page at `/audit`.
- API-shaped mock data first, then backend mapper integration.
- Decision chain display:
  - Agent A proposal
  - hard rules
  - Agent B/C review
  - final decision
  - execution evidence
- Attempt timeline for agentic retry.
- CAW evidence display when returned by backend.
- Manual review / confirm-needed UI.

Original frontend non-goals:

- No full account system.
- No production auth.
- No complex state management.
- No production-grade mobile polish.
- No chain-event audit reader.

---

## Historical API Shape

The MVP `POST /api/execute` returned these stable fields:

```json
{
  "tx_id": "uuid",
  "intent": "Swap 0.01 ETH to USDC",
  "status": "executed",
  "decision": "execute",
  "decision_reason": "All checks passed.",
  "sentinel_decision": "execute",
  "sentinel_decision_reason": "All Sentinel checks passed.",
  "attempts": [],
  "decision_chain": {},
  "execution": {}
}
```

For current and future API work, use `shared-api-contract.md` instead of this archived spec.

---

## MVP Demo Scenarios

- Safe transaction: low-risk intent passes and returns execution evidence.
- Sentinel reject: high-risk swap is rejected before execution.
- Agent retry: risky proposal is revised to a safer proposal through bounded retry.
- Manual review: medium-risk transfer returns `confirm_needed`.
- CAW policy deny: Sentinel allows but CAW Pact blocks execution.

---

## Legacy Files

This file consolidates:

- `docs/backend-spec.md`
- `docs/frontend-spec.md`

Those files were removed to avoid maintaining three overlapping specs.
