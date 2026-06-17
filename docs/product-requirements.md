# Sentinel 产品需求说明

> 说明：这是公开的 Sentinel 产品边界，不是私人学习与求职 requirements。

## 项目目的

Sentinel 展示的是：AI agent 可以执行 DeFi 操作，但资金执行权不能无约束地交给 LLM。

核心问题：

> AI agent 需要执行能力，但钱包执行是不可逆的。一个有用的系统必须把智能风险判断
> 和基础设施层面的强制限制结合起来。

## 目标用户

- 希望用自然语言完成简单 transfer / swap 操作的 Web3 用户。
- 想评估 AI agent 如何安全参与链上 workflow 的团队。
- 想判断候选人 AI/Web3 集成能力的面试官或 reviewer。

## 已完成范围

Sentinel 当前已经支持：

- 自然语言 transfer 和 swap intent。
- Agent A 将用户意图转换成 `TxProposal`。
- 金额、滑点、白名单、approval、频率等 deterministic hard rules。
- Agent B security review 和 Agent C risk review。
- 带 `MutationGuard` 的有界 reproposal loop。
- CAW execution backend 的 `transfer_tokens`。
- CAW `contract_call` Uniswap V3 swap：`wrap -> approve -> swap`。
- CAW Pact policy denial 处理。
- SQLite audit log 和前端 audit evidence。
- 前端 execute console、audit page、settings page、CAW status display。

## 明确不做

- 不做 mainnet execution。
- 不声称是 production custody system。
- 不做 multi-chain execution。
- 不让 agent 自动执行复杂 DeFi strategy。
- 不做完整 auth/user system。
- 不保证 LLM reviewer 的判断达到生产安全级别。

## Stage 0 成功标准

Stage 0 成功的标志：

- README、case study、evidence list 清楚。
- 你能在不借助 AI 的情况下讲清楚项目 5 分钟。
- 主要失败路径能被解释和防守。
- 简历措辞能表达 completed project，同时不夸大 production security 或 custody readiness。
