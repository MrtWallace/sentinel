# Sentinel Shared API Contract

> **Purpose:** Single source of truth for backend/frontend integration.
> **Status:** Draft for Post-MVP Cobo + Agent work.
> **Last updated:** 2026-06-06

This document defines API shapes, status names, and frontend mapper rules shared by:

- Backend worktree: `feature/backend-risk-pipeline`
- Frontend worktree: `feature/frontend-risk-console`
- Future integration branch: `feature/cobo-agent-integration`

Implementation details stay in `backend-plan.md` and `frontend-plan.md`. This file only records stable contracts and examples.

---

## Naming Rules

- Backend DTOs use `snake_case`.
- Frontend view models use `camelCase`.
- Page components must not parse raw backend DTOs directly. They should consume mapper output from `frontend/packages/nextjs/lib/sentinel/*Mapper.ts`.
- Unknown enum values should render as neutral/unknown states, not crash the UI.

---

## Shared Status Values

### Wallet / Pact

```text
wallet_status: none | pairing_pending | paired | active | revoked | expired
pairing_status: none | pending | paired | failed
pact_status: none | pending_approval | active | expired | revoked
config_status: synced | needs_pact_update
```

### Decision / Execution

```text
status: executed | rejected | confirm_needed | failed | no_wallet | pact_not_active
decision: execute | confirm | reject
execution.status: skipped | dry_run | submitted | succeeded | pending_approval | policy_denied | failed
execution.backend: caw | mock | local | pending
```

Policy note: `policy_denied` is a CAW security boundary. It must not fallback to SmartAccount execution.

---

## Wallet APIs

### GET `/api/wallet/status`

Returns the current user's CAW binding and Pact state.

Query:

```json
{ "user_address": "0xabc..." }
```

Response examples:

```json
{
  "user_address": "0xabc...",
  "wallet_status": "none",
  "pairing_status": "none",
  "pact_status": "none",
  "config_status": "synced"
}
```

```json
{
  "user_address": "0xabc...",
  "wallet_status": "active",
  "pairing_status": "paired",
  "caw_wallet_id": "wallet_123",
  "caw_wallet_address": "0xCAW...",
  "pact_id": "pact_123",
  "pact_status": "active",
  "config_status": "synced",
  "pact_limits": {
    "transfer_amount_threshold_confirm": "0.1",
    "swap_amount_threshold_confirm": "0.2",
    "frequency_limit": 3
  }
}
```

### POST `/api/wallet/connect-existing`

Binds an existing CAW wallet to a user after wallet ownership is verified.

Request:

```json
{
  "user_address": "0xabc...",
  "caw_wallet_id": "wallet_123"
}
```

Response:

```json
{
  "user_address": "0xabc...",
  "caw_wallet_id": "wallet_123",
  "wallet_status": "paired",
  "pairing_status": "paired",
  "pact_status": "none"
}
```

### POST `/api/wallet/create`

Creates a new persistent CAW wallet and returns pairing information. This is not a temporary demo wallet.

Request:

```json
{ "user_address": "0xabc..." }
```

Response:

```json
{
  "user_address": "0xabc...",
  "caw_wallet_id": "wallet_456",
  "wallet_status": "pairing_pending",
  "pairing_status": "pending",
  "pairing_url": "cobo://pair/...",
  "expires_at": "2026-06-06T12:00:00Z"
}
```

### POST `/api/wallet/pact`

Submits a PactSpec for the user's CAW wallet.

Request:

```json
{
  "user_address": "0xabc...",
  "limits": {
    "transfer_amount_threshold_confirm": "0.1",
    "swap_amount_threshold_confirm": "0.2",
    "frequency_limit": 3,
    "custom_whitelist": ["0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"]
  }
}
```

Response:

```json
{
  "user_address": "0xabc...",
  "pact_id": "pact_456",
  "pact_status": "pending_approval",
  "config_status": "needs_pact_update"
}
```

### POST `/api/wallet/refresh-status`

Refreshes pairing and Pact status from CAW.

Request:

```json
{ "user_address": "0xabc..." }
```

Response: same shape as `GET /api/wallet/status`.

---

## Config APIs

### GET `/api/config`

Query:

```json
{ "user_address": "0xabc..." }
```

Response:

```json
{
  "user_address": "0xabc...",
  "config_status": "synced",
  "config_version": 3,
  "pact_config_version": 3,
  "config": {
    "swap_amount_threshold_pass": "0.05",
    "swap_amount_threshold_confirm": "0.2",
    "transfer_amount_threshold_pass": "0.02",
    "transfer_amount_threshold_confirm": "0.1",
    "slippage_threshold_pass": 0.03,
    "slippage_threshold_confirm": 0.05,
    "frequency_limit": 3,
    "whitelist_mode": "strict",
    "custom_whitelist": [],
    "auto_approve_low_risk": true
  }
}
```

### PUT `/api/config`

Request:

```json
{
  "user_address": "0xabc...",
  "config": {
    "transfer_amount_threshold_confirm": "0.05",
    "frequency_limit": 2
  }
}
```

Response:

```json
{
  "user_address": "0xabc...",
  "config_status": "needs_pact_update",
  "config_version": 4,
  "pact_config_version": 3,
  "config": {
    "transfer_amount_threshold_confirm": "0.05",
    "frequency_limit": 2
  }
}
```

---

## Execute API

### POST `/api/execute`

Request:

```json
{
  "user_address": "0xabc...",
  "intent": "Send 0.001 ETH to 0x1111111111111111111111111111111111111111"
}
```

Core response fields:

```json
{
  "tx_id": "uuid",
  "intent": "Send 0.001 ETH to 0x111...",
  "status": "executed",
  "decision": "execute",
  "decision_reason": "All checks passed.",
  "sentinel_decision": "execute",
  "sentinel_decision_reason": "All Sentinel checks passed.",
  "attempts": [],
  "decision_chain": {},
  "execution": {},
  "tool_calls": [],
  "memory_anomalies": []
}
```

### No Wallet

```json
{
  "tx_id": "uuid",
  "status": "no_wallet",
  "decision": "reject",
  "decision_reason": "Please bind or create a CAW wallet before execution.",
  "execution": {
    "backend": "caw",
    "status": "skipped",
    "reason": "No active CAW wallet."
  }
}
```

### Pact Not Active

```json
{
  "tx_id": "uuid",
  "status": "pact_not_active",
  "decision": "reject",
  "decision_reason": "CAW Pact is not active.",
  "execution": {
    "backend": "caw",
    "status": "skipped",
    "reason": "Pact status is pending_approval."
  }
}
```

### Sentinel Reject

```json
{
  "tx_id": "uuid",
  "status": "rejected",
  "decision": "reject",
  "decision_reason": "Hard rule violation: AmountRule",
  "sentinel_decision": "reject",
  "attempts": [
    {
      "attempt_index": 1,
      "proposal": { "action": "swap", "amount": "1", "from_token": "ETH", "to_token": "USDC" },
      "hard_rules": [
        { "rule_name": "AmountRule", "status": "rejected", "reason": "Swap amount exceeds 0.2 ETH limit", "severity": "critical" }
      ],
      "security_audit": null,
      "risk_analysis": null,
      "decision": { "decision": "reject", "reason": "Hard rule rejected transaction.", "suggestions": [] },
      "rejection_source": "sentinel"
    }
  ],
  "execution": {
    "backend": "caw",
    "status": "skipped",
    "reason": "Sentinel rejected before CAW execution."
  }
}
```

### CAW Policy Deny

```json
{
  "tx_id": "uuid",
  "status": "rejected",
  "decision": "reject",
  "decision_reason": "CAW policy denied execution: matched_pact_transfer_deny_if",
  "sentinel_decision": "execute",
  "execution": {
    "backend": "caw",
    "status": "policy_denied",
    "request_id": "sentinel-uuid",
    "tx_id": null,
    "tx_hash": null,
    "reason": "matched_pact_transfer_deny_if",
    "policy_reason": "TRANSFER_LIMIT_EXCEEDED",
    "caw_wallet_id": "wallet_123",
    "caw_wallet_address": "0xCAW...",
    "pact_id": "pact_123"
  }
}
```

### Tool Evidence + Memory

```json
{
  "tool_calls": [
    {
      "agent": "SecurityAuditor",
      "tool": "check_contract_verified",
      "status": "succeeded",
      "result": { "address": "0x3bFA...", "verified": true }
    },
    {
      "agent": "RiskAnalyst",
      "tool": "check_gas_price",
      "status": "succeeded",
      "result": { "gas_price_gwei": "12.4" }
    }
  ],
  "memory_anomalies": [
    {
      "kind": "amount_above_average",
      "severity": "warning",
      "reason": "Current amount is 6.2x the user's average transfer amount."
    }
  ]
}
```

---

## Audit APIs

### GET `/api/audit-log`

Query:

```json
{
  "user_address": "0xabc...",
  "status": "executed",
  "limit": 20,
  "offset": 0
}
```

Response:

```json
{
  "items": [
    {
      "tx_id": "uuid",
      "timestamp": "2026-06-06T12:00:00Z",
      "intent": "Send 0.001 ETH",
      "status": "executed",
      "decision": "execute",
      "decision_reason": "All checks passed.",
      "execution_backend": "caw",
      "execution_status": "succeeded",
      "tx_hash": "0x..."
    }
  ],
  "limit": 20,
  "offset": 0,
  "total": 1
}
```

### GET `/api/audit-log/{tx_id}`

Returns the full execute response plus audit metadata.

Sensitive data must not be returned: API keys, pact scoped credentials, raw authorization headers, or secret-like fields.

---

## MCP Tools

Initial MCP server is read-only.

```text
evaluate_transaction(intent: str, user_address?: str)
get_risk_config(user_address: str)
get_audit_log(tx_id: str)
```

`update_risk_config` is deferred until auth and write authorization are stable.

---

## Frontend Demo Presets

```text
Safe CAW transfer: Send 0.001 ETH to 0x1111111111111111111111111111111111111111
CAW policy deny: Send 0.005 ETH to 0x1111111111111111111111111111111111111111
Sentinel hard reject: Swap 1 ETH to USDC
Agent retry: Swap 0.2 ETH to USDC
Manual review: Send 0.03 ETH to 0x742d...
CAW contract_call: controlled MockDEX / whitelisted contract interaction
```

---

## Document Ownership

- Backend changes update this file first when response shape changes.
- Frontend changes update mapper tests against this file's examples.
- `post-mvp-requirements.md` may reference this file but should not duplicate full API examples.
