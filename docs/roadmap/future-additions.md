# Sentinel 后续可添加内容

> 更新时间：2026-06-18 02:00 Asia/Shanghai
>
> 用途：把长期计划里和 Sentinel 相关的后续方向整理出来。这个文件不是授权你现在
> 一次性把所有功能都加上。

## Sentinel 已经完成的内容

长期 plan 和旧 post-MVP 文档里提到的一些能力，现在已经部分或完全实现：

| 方向 | 当前状态 |
|---|---|
| CAW `transfer_tokens` | 已完成，有 Sepolia evidence。 |
| CAW `contract_call` swap | 已完成，有 wrap / approve / swap evidence。 |
| Per-user CAW wallet state | 已实现 demo lifecycle。 |
| User risk config + Pact sync status | 已在 backend/frontend surface 实现。 |
| SQLite audit | 已作为 primary audit store，并有 JSON fallback。 |
| Input guard | 已有 sanitizer 和 injection/anomaly checks。 |
| Tool-call evidence | 已作为 reviewer evidence layer 实现。 |
| Memory anomaly evidence | 已基于 audit-derived behavior signals 实现。 |
| Frontend audit/evidence UI | 已为 demo 实现。 |

不要把这些当成缺失功能重复添加。未来工作应该是 harden 或 productize。

## Stage 1 - Python Backend 和 SQL

目标：把黑客松 backend 变成更可维护、面试可防守的 backend service。

推荐添加：

- Audit 和 wallet/config storage 的 repository layer。
- SQLite/PostgreSQL 切换。
- Alembic 或基础 migration。
- 更明确的 API error shape。
- 带 dependency checks 的 `/api/health`。
- 按 status/user/time 查询 audit 的 endpoints。
- 测试 invalid input、policy denied、CAW pending、execution failure。

最佳第一个任务：

```text
Add support_note to audit records -> return it from audit detail -> write tests.
```

## Stage 2 - DevOps 和 Cloud

目标：达到 developer level 的部署和运维能力。

推荐添加：

- 清理 Dockerfile，并用 Docker Compose 跑 backend + database。
- Review GitHub Actions test/build workflow。
- 部署到一个小 cloud server。
- 暴露 public `/health` endpoint。
- 写基础 log inspection docs。
- 写 `.env` 和 secrets handling notes。

暂时避免：

- Kubernetes。
- Terraform。
- 高级 AWS architecture。

## Stage 3 - Chain Risk Monitor 项目

目标：做第二个更贴近 crypto risk/support 的项目，不要把 Sentinel 塞得过重。

推荐新项目：

```text
chain-risk-monitor
```

功能：

- 添加 watched wallets。
- 拉取 tx、receipt、logs。
- Decode ERC20 Transfer 和 Approval events。
- 存 transaction records。
- 应用风险规则：large transfer、repeated transfer、new recipient、high approval、
  failed transaction spike。
- 生成英文 incident reports。
- 添加 tests、Docker、CI、README。

为什么重要：

它覆盖 crypto risk、wallet operations、Web3 QA、technical support、Python backend
这些岗位方向。

## Stage 4 - LangGraph / Agent Workflow

目标：把 agent workflow 显式建成 graph。

把 Sentinel 映射成 nodes：

```text
InputGuard -> Proposal -> HardRules -> Reviewer -> Decision
-> HumanConfirm -> Execution -> Audit
```

推荐添加：

- Minimal graph demo branch。
- State object，包含 proposal、rule results、reviewer results、decision、execution、
  audit metadata。
- reject/confirm/execute/failure 的 conditional edges。
- 测试 execute、confirm、reject、reviewer failure、hard-rule failure paths。

不要把它做成 generic chatbot。

## Stage 5 - RAG / GraphRAG Exposure

目标：覆盖 AI JD 里 RAG/GraphRAG 相关经验，但不改变 Sentinel core。

推荐 mini-project：

```text
Sentinel Support Assistant
```

功能：

- 用户问为什么某笔交易被拒。
- 系统检索 Sentinel docs、audit examples、policy rules。
- LLM 带 citations 回答。

添加：

- 20 个 evaluation questions。
- Expected answers。
- Retrieval success/failure notes。
- Hallucination controls。

## Stage 6 - Solidity / Web3 Maintenance

目标：保持 Solidity 和 Foundry 手感。

推荐 Sentinel maintenance tasks：

- 给 `SmartAccount.sol` 加一个 event。
- 写一个 Foundry event test。
- 写一个 revert test。
- 写一个 fuzz test。
- 解释 approve/allowance risk。
- 解释为什么 Sentinel 不是 production custody。

保持很窄，不要重启大型 smart-account redesign。

## Stage 7 - Job Materials

目标：完成投递材料包。

添加：

- Master resume。
- AI/Web3 resume。
- Crypto risk/support resume。
- Python backend resume。
- Sentinel case study。
- Stage 3 完成后的 Chain-risk-monitor case study。
- 30 秒和 2 分钟英文录音。
- LinkedIn/X project post。
- AI-assisted development ownership 面试回答。

## 暂时不要加

在前面阶段被亲自验证前，不要往 Sentinel 加：

- Multi-chain support。
- Mainnet execution。
- Full planner/reflector multi-step autonomy。
- Write-capable MCP。
- Complex auth/RBAC。
- Production custody claims。
- Arbitrage、LP、rebalancing 等 strategy execution 自动动作。

## 推荐下一步

先手动完成 Stage 0：

```text
Practice the 5-minute explanation.
Update resume.
Explain failure paths without AI.
```

然后从一个很小的 backend/SQL 任务开始 Stage 1，不要开启新一轮功能扩张。
