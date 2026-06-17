# Sentinel 简历 Bullet

> 用途：这里保存可复用的英文简历句子，以及哪些说法不能写。说明用中文，
> bullet 保留英文，方便你直接复制到英文简历里。

## 项目标题

```text
Sentinel - CAW-governed autonomous trading execution agent
Completed hackathon project, 2026
```

## 强版本主 bullet

适合 AI/Web3 agent 岗位，信息密度最高：

```text
Built a CAW-governed autonomous trading execution agent that converts natural-language intents into bounded on-chain actions, evaluates them through deterministic risk rules and LLM reviewers, and executes approved transfers/swaps through Cobo Agentic Wallet with Pact policy enforcement.
```

## AI / Web3 Engineer 版本

```text
Built Sentinel, a CAW-governed autonomous trading execution agent that parses natural-language transfer/swap intents, runs deterministic guardrails and LLM-based security/risk reviewers, and executes approved Sepolia transactions through Cobo Agentic Wallet.
```

```text
Implemented a bounded agent workflow with Agent A proposal generation, Agent B security review, Agent C risk analysis, deterministic hard rules, mutation-guarded reproposals, and full audit logging.
```

## Python Backend 版本

适合把重点放在 API、数据库、失败处理上：

```text
Developed a FastAPI backend for AI-assisted wallet execution, including typed execution responses, SQLite audit storage, user CAW wallet state, risk configuration APIs, CAW execution evidence, and unit-tested failure handling.
```

## Crypto Risk / Wallet Operations 版本

适合强调 wallet policy、risk control、audit trail：

```text
Designed a dual-layer wallet risk-control demo where Sentinel performs pre-execution AI/rule risk assessment and Cobo Agentic Wallet Pact enforces final transfer and contract-call boundaries.
```

```text
Built audit views for executed, rejected, pending, and CAW policy-denied transactions, preserving wallet address, Pact ID, request/transaction IDs, tx hashes, policy reason, and decision-chain evidence.
```

## Technical Support / QA 版本

适合强调 evaluation 和测试：

```text
Created a 109-case evaluation suite covering E2E behavior, decision trajectory, prompt-injection safety, reference trajectories, and fuzz inputs, with README-documented final result of 108/109 passing.
```

## Portfolio Summary

可用于 GitHub profile、LinkedIn 项目描述、作品集简介：

```text
Sentinel is a completed AI/Web3 hackathon project demonstrating risk-bounded autonomous wallet execution on Sepolia through Cobo Agentic Wallet. It includes natural-language intent parsing, hard-rule guardrails, LLM reviewers, CAW transfer and Uniswap V3 swap execution, Pact policy denial handling, and auditable decision-chain UI.
```

## 不要这么写

不要写：

```text
Production custody system
Mainnet trading bot
Senior Web3 security engineer
Advanced DeFi protocol engineer
```

更稳妥的表达：

```text
Hackathon prototype
Reference implementation
Sepolia demo
Risk-bounded execution workflow
Wallet policy enforcement demo
```

## 使用建议

- 一份简历只选 1-2 条 Sentinel bullet，不要把所有版本都塞进去。
- AI/Web3 岗位优先用强版本或 AI/Web3 版本。
- Backend 岗位优先用 FastAPI/SQLite/audit/test 版本。
- Crypto risk/support 岗位优先用 dual-layer risk-control 和 audit evidence 版本。
- 面试时必须能解释 bullet 里的每个词，尤其是 CAW、Pact、hard rules、LLM reviewers、
  `transfer_tokens`、`contract_call`。
