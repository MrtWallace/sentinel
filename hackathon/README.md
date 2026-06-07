# Sentinel Hackathon — AI×Web3 School

> **项目**: Sentinel — 让 AI Agent 安全地参与链上经济活动
> **赛道**: Cobo — Agentic Economy × Cobo Agentic Wallet
> **方向**: 04｜Autonomous Trading — 带风控的自主交易 Agent
> **学员**: Mr Wallace (#3752)

## 快速导航

- `proposal.md` — 项目提案（1 页 memo）
- `docs/shared-api-contract.md` — 前后端联调 API contract（单一真值源）
- `docs/backend-plan.md` — 后端稳定计划和 checkpoint 定义
- `docs/backend-progress.md` — 后端实时进度（CP1-13 Done）
- `docs/frontend-plan.md` — 前端稳定计划和 checkpoint 定义
- `docs/frontend-progress.md` — 前端实时进度（CP0-12 Done）
- `docs/demo-script.md` — 3-5 分钟 demo 脚本（4 个场景）
- `docs/post-mvp-requirements.md` — Post-MVP 需求和优先级
- `docs/mvp-spec.md` — MVP 归档规格（历史参考）
- `CLAUDE-backend.md` — 后端开发上下文
- `CLAUDE-frontend.md` — 前端开发上下文

## 架构总览

```text
用户意图 ("Send 0.001 ETH" / "Swap 0.1 ETH to USDC")
    ↓
Input Guard — 输入清洗、长度限制、注入检测
    ↓
Agent A (Executor) → 结构化 TxProposal
    ↓
RiskPipeline 硬规则（金额/滑点/白名单/频率）→ 不通过直接拦
    ↓
Agent B (Security) + Agent C (Risk) 并行审查
    ↓
DecisionEngine → execute / confirm / reject
    ↓
AgenticLoop — reject 时最多重试 2 次（ReproposalAgent + MutationGuard）
    ↓
CAW Pact 执行 — active pact 范围内真实 transfer
    ↓
SQLite 审计日志 — 完整决策链路 + CAW evidence
```

## 双层防护

```text
Sentinel AI 风控层（动态判断）
  → 该不该做？有没有异常？滑点合不合理？
        ↓ approved
Cobo Agentic Wallet 层（静态策略兜底）
  → Pact 资金边界 + wallet policy enforcement
```

Sentinel 拦逻辑风险，CAW Pact 拦资金越权。两者互补。

## 技术栈

| 层 | 技术 |
|---|---|
| 智能合约 | Solidity + Foundry (Sepolia) |
| Agent 后端 | Python 3.11 + FastAPI |
| AI 模型 | DeepSeek / OpenAI-compatible（provider-agnostic） |
| 执行钱包 | Cobo Agentic Wallet (CAW) |
| 前端 | Next.js 14 + Scaffold-ETH 2 |
| 审计存储 | SQLite |

## 当前状态

- **后端**: CP1-13 Done，136 tests passing
- **前端**: CP0-12 Done（execute console, audit, settings, CAW lifecycle）
- **集成**: `integration/caw-demo` branch 已合并前后端
- **提交截止**: 2026-06-13 12:00

## Demo 场景

1. ✅ **Safe CAW Transfer** — 低风险转账，Sentinel + CAW 双层通过
2. 🚫 **Sentinel Hard Reject** — 超限额交易，硬规则直接拦截，CAW 不触达
3. 🔄 **Agentic Retry** — 中风险交易，Agent 建议降额，MutationGuard 验证后重试通过
4. ⛔ **CAW Policy Deny** — Sentinel 通过但 CAW Pact 拒绝，展示双层防护
