# Sentinel Hackathon — AI×Web3 School Week 3-4

> **项目**: Sentinel — AI Agent DeFi 执行的安全护栏
> **赛道**: Wallet / Permission / Safe Execution
> **学员**: Mr Wallace (#3752)

## 快速导航

- `proposal.md` — 项目提案（1 页 memo）
- `docs/mvp-spec.md` — MVP 归档规格（后续不作为最新计划维护）
- `docs/shared-api-contract.md` — 前后端联调 API contract
- `docs/backend-plan.md` — 后端稳定计划和 Post-MVP checkpoint
- `docs/frontend-plan.md` — 前端稳定计划和 Post-MVP checkpoint
- `CLAUDE-backend.md` — 后端开发的 Claude Code 上下文
- `CLAUDE-frontend.md` — 前端开发的 Claude Code 上下文
- `sentinel/` — Sentinel 项目源码（symlink → /home/admin/sentinel）

## 架构总览

```
用户意图
    ↓
Agent A (Executor) → JSON 交易方案
    ↓
硬规则层（代码）→ 不通过直接拦
    ↓
Agent B (安全) + Agent C (风险) 并行审查
    ↓
代码投票决策 → 执行/人工确认/拒绝
    ↓
eth_call 模拟 → SmartAccount 链上执行
    ↓
审计日志记录
```

## 开发分工

| 角色 | 工具 | 负责内容 | 上下文文件 |
|------|------|----------|-----------|
| 后端 & 合约 | VSCode Claude Code | Agent A/B/C, Pipeline, DecisionEngine, Logger | `CLAUDE-backend.md` |
| 前端 | Claude Code CLI | 交易执行页, 审计日志页, 决策链路展示 | `CLAUDE-frontend.md` |

## 时间线

- **Week 3 (6/1-7)**: Agent A 改造 + 风控 Pipeline + Agent B/C 原型
- **Week 4 (6/8-14)**: 集成测试 + 前端 + Demo + 文档 + 修 bug
