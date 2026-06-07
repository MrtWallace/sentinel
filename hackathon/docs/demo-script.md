# Sentinel Demo Script

> Target length: 3-5 minutes.
> Goal: show Agentic Commerce with real CAW execution and double-layer risk control.

## Opening

Sentinel is a risk-aware autonomous trading agent.

It lets an AI agent execute wallet operations, but only inside two safety layers:

```text
Sentinel risk layer
  -> rules, reviewers, bounded retry, audit

Cobo Agentic Wallet layer
  -> active Pact, wallet policy, transfer enforcement
```

## Scene 1 — Safe CAW Transfer

Input:

```text
Send 0.001 ETH
```

Show:

- `/api/execute` response.
- `status = executed`.
- `sentinel_decision = execute`.
- `execution.backend = caw`.
- CAW request id.
- CAW transaction id / tx hash.
- Audit detail by `tx_id`.

Talking point:

```text
The agent made a low-risk transfer decision, and CAW executed it through an active Pact.
```

## Scene 2 — Sentinel Hard Rule Reject

Input:

```text
Swap 1 ETH to USDC
```

Show:

- `status = rejected`.
- hard rule result from `AmountRule`.
- `security_audit = null`.
- `risk_analysis = null`.
- `execution.status = skipped`.

Talking point:

```text
Hard rules are fail-fast. If Sentinel rejects before agent review, CAW is never called.
```

## Scene 3 — Agentic Retry

Input:

```text
Swap 0.2 ETH to USDC
```

Show:

- `attempts[0]`:
  - RiskAnalyst rejects high exposure.
  - Suggestion: reduce amount to `0.01`.
- Reproposal:
  - amount changes from `0.2` to `0.01`.
  - MutationGuard validates the change.
- `attempts[1]`:
  - final Sentinel decision execute.

Talking point:

```text
This is bounded autonomy: the agent can adapt, but only within deterministic mutation guards.
```

## Scene 4 — CAW Policy Deny

Input:

```text
Send 0.005 ETH
```

Show:

- `sentinel_decision = execute`.
- `execution.backend = caw`.
- `execution.status = policy_denied`.
- `execution.policy_reason = matched_pact_transfer_deny_if`.
- Final API result:
  - `status = rejected`.
  - `decision = reject`.

Talking point:

```text
Sentinel approved the transfer, but CAW Pact denied it because the amount exceeded the wallet policy. This demonstrates infrastructure-enforced double-layer protection.
```

## Evidence Checklist

Show or mention:

- CAW wallet address.
- Active pact ID.
- Safe transfer request id / tx hash.
- Policy deny reason.
- Sentinel audit record.

## Closing

Sentinel is not just a wallet UI and not just an LLM wrapper.

It is an agent execution stack:

```text
intent
-> risk-aware decision
-> bounded adaptation
-> CAW-enforced execution
-> audit trail
```

This makes AI agents safer participants in on-chain economic activity.
