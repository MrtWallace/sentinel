# Sentinel 技术规格

> 更新时间：2026-06-18 02:00 Asia/Shanghai

## 技术栈

| 层 | 技术 |
|---|---|
| Backend agent | Python 3.11, FastAPI, Pydantic-style request models |
| LLM integration | OpenAI-compatible client, DeepSeek-compatible configuration |
| Risk engine | Deterministic Python rules + LLM reviewers |
| Execution wallet | Cobo Agentic Wallet, Pact-scoped execution |
| Audit storage | SQLite primary store, JSON fallback |
| Frontend | Next.js 14, Scaffold-ETH 2, TypeScript |
| Baseline contract | Solidity + Foundry SmartAccount |
| Network | Sepolia testnet |

## 技术约束

- 智能合约工具链保持 Foundry。
- 已验证的真实执行路径以 CAW 为准。
- LLM 层通过 OpenAI-compatible client 保持 provider-agnostic。
- 默认执行必须安全：未显式配置真实 CAW 执行时，使用 mock / dry-run。
- 没有更新 plan 前，不扩展到 mainnet 或 multi-chain。
- 不声称 production custody readiness。

## 架构

```text
User intent
-> InputGuard
-> Agent A / parser -> TxProposal
-> RiskPipeline hard rules
-> Agent B SecurityAuditor + Agent C RiskAnalyst
-> DecisionEngine
-> AgenticLoop + ReproposalAgent + MutationGuard
-> CAW Execution Backend
-> AuditLogger
-> Frontend Decision Chain / Audit UI
```

## 主要模块

| 模块 | 责任 |
|---|---|
| `agent/api.py` | FastAPI routes、执行编排、response mapping。 |
| `agent/models.py` | `TxProposal`、`RuleResult`、`AgentResult` 等共享 dataclass。 |
| `agent/input_guard.py` | 输入清洗、prompt injection pattern 检查、proposal anomaly 检查。 |
| `agent/risk/rules.py` | Deterministic hard rules。 |
| `agent/risk/decision.py` | 决策优先级 cascade。 |
| `agent/reviewers.py` | Mock reviewers 和 LLM-backed Agent B/C reviewers。 |
| `agent/loop.py` | 有界 retry loop。 |
| `agent/reproposal.py` | Reproposal 和 mutation guard。 |
| `agent/execution.py` | Mock 和 CAW execution backends。 |
| `agent/audit.py` | SQLite audit logger 和 redaction。 |
| `agent/wallets.py` | CAW wallet lifecycle 和 Pact status。 |
| `frontend/packages/nextjs/lib/sentinel/*` | API clients、mappers、view models。 |

## 执行模式

```text
EXECUTION_BACKEND=mock, ENABLE_REAL_TX=false
  -> 安全本地 demo，不产生真实 CAW transaction。

EXECUTION_BACKEND=caw, ENABLE_REAL_TX=false
  -> CAW-shaped dry run。

EXECUTION_BACKEND=caw, ENABLE_REAL_TX=true
  -> 真实 Sepolia CAW transfer_tokens 或 contract_call。
```

## 风险决策语义

Hard rules 先于 LLM reviewers 执行。任何 hard-rule `rejected` 都会停止 reviewer
执行，并直接返回 `reject`。

Hard rules 通过后：

- Agent B 检查 security dimensions。
- Agent C 检查 DeFi risk dimensions。
- LLM reviewer 失败时 fail closed，作为 high-risk `AgentResult` 处理。
- Medium risk 进入 `confirm`。
- High risk 或 reviewer failure 进入 `reject`。
- 干净的 low-risk path 才进入 `execute`。

## CAW 边界

Sentinel 决定“是否应该尝试执行”；CAW Pact 决定“资金是否允许移动”。

重要规则：

```text
CAW policy_denied -> final API status rejected.
No silent fallback to SmartAccount execution.
```

CAW timeout 或 pending 是可用性问题，可以表达为 `pending`，但不能等同于
policy denial。

## Audit 数据

Audit record 包括：

- `tx_id`、timestamp、user address、original intent。
- Final status、decision、decision reason。
- Sentinel decision 和 reason。
- Attempts、proposals、hard rules、Agent B/C results、suggestions。
- CAW execution status、request id、CAW transaction id、tx hash。
- Wallet address、Pact ID、policy reason。
- Tool calls 和 memory anomalies。

敏感字段持久化前必须 redacted。
