# CLAUDE.md — Sentinel Hackathon (Backend + Contracts)

## 你在做什么

在现有 Sentinel 项目上增加**多 Agent 交叉审核风控层**，包括 Python Agent 后端和 Solidity 合约两部分。

## 语言约定

- 后端/合约相关文档优先使用中文编写
- 与用户讨论方案、计划、实现细节时优先使用中文回答
- 代码、变量名、函数名、提交信息可继续使用英文，保持工程惯例

## 协作方式

- 采用“结对编程 + 教练模式”
- 用户希望参与后端和合约核心代码编写，用这个项目积累求职可讲述的工程经验
- 实现前先解释目标、输入输出、相关文件和关键概念
- 适合练习的模块优先拆成小任务或 TODO，让用户先写关键逻辑
- Codex 负责拆解、讲解、review、测试建议、排查 bug，并在卡住或时间紧时补齐代码

先读：
- `docs/backend-plan.md` 了解当前已确认方向、待讨论问题和执行计划
- `docs/shared-api-contract.md` 了解前后端 API contract
- `docs/mvp-spec.md` 了解历史 MVP 规格（归档，不作为最新计划维护）

## 现有代码位置

- Agent 代码: `agent/` (intent.py, guardrails.py, executor.py, main.py)
- 合约代码: `contracts/` (Foundry, SmartAccount.sol)
- 合约 ABI: `contracts/out/SmartAccount.sol/SmartAccount.json`
- 项目上下文: `PROJECT_CONTEXT.md`

## 开发顺序（严格按这个来，不要跳）

### Phase 1: Agent A 输出格式改造 (Day 1-2)
- 改 `agent/intent.py` 的 system prompt，输出结构化 JSON
- 加 parse 和 validation

### Phase 2: 风控 Pipeline (Day 3-5)
- 新建 `agent/risk/` 目录
- 实现 RiskRule 基类 + 5 条硬规则（slippage, amount, whitelist, frequency, approval）
- Pipeline 串联逻辑

### Phase 3: 多 Agent 审查 (Day 5-7)
- 新建 `agent/security_auditor.py` (Agent B)
- 新建 `agent/risk_analyst.py` (Agent C)
- Agent B 和 C 用同一个 DeepSeek API，不同 system prompt，**并行调用**
- DecisionEngine 投票逻辑（2/3 一致才执行）

### Phase 4: 合约层增强 (Day 5-7，与 Phase 3 并行)
- 审查现有 `SmartAccount.sol`，确认 execute 函数是否需要扩展
- 如果需要链上风控记录：添加事件 emit（决策结果、拦截原因）
- 如果需要 guard 机制：在合约中添加 policy check 前置逻辑
- 确保合约能配合新的 Agent 执行流程
- 重新编译 + 测试网部署

### Phase 5: 模拟 + 日志 + 集成 (Day 7-9)
- eth_call 模拟器（Python 层，调用合约前先模拟）
- AuditLogger（本地 JSON + 可选链上事件）
- 端到端集成：Agent A → Pipeline → Agent B/C → Decision → 合约执行

### Phase 6: 修 bug + 优化 (Day 9-10)
- 修补已知 5 个 bug
- 测试用例

## 关键约束

- 所有操作在 **Sepolia 测试网**，不上主网
- API Key 用 `.env`，不要硬编码
- LLM 输出必须 parse + validate，不能直接信任
- 每个模块独立可测试
- 用 DeepSeek API (base_url: https://api.deepseek.com)
- Agent B 和 C 用**同一个 LLM**，不同 system prompt
- 合约改动要最小化，优先用事件（event）记录，不改核心执行逻辑

## 不要做的事

- 不要加 LangChain 或任何新框架
- 不要做前端（前端有单独的 spec）
- 不要重构 SmartAccount 的核心 execute 逻辑（可以加事件、加 guard，但不改签名）
- 不要用 Foundry 以外的合约框架

## 合约相关注意事项

- Foundry 项目，用 `forge build` 编译，`forge test` 测试
- 部署脚本在 `contracts/script/` 目录
- ABI 输出到 `contracts/out/`
- Python 通过 ABI 与合约交互（web3.py）

## 测试

每写完一个模块，跑一下确认不报错。最终需要：
- `python main.py` 能跑通完整链路
- `forge test` 合约测试通过
- 至少 2 个端到端用例（正常执行 + 被拦截）
- 至少 1 笔测试网真实交易记录
