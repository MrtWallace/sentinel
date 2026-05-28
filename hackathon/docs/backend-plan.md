# Sentinel Hackathon — 后端 & 合约计划

> 目的：记录 Sentinel 黑客松后端/合约方向、已确认取舍、待讨论问题和执行计划。
> 最后更新：2026-05-28

## 语言约定

- 后端/合约相关文档优先使用中文编写。
- 与用户讨论方案、计划、实现细节时优先使用中文回答。
- 代码、变量名、函数名、提交信息可继续使用英文，保持工程惯例。

## 协作方式

- 采用“结对编程 + 教练模式”，目标是让项目所有者能参与核心后端和合约代码编写，而不是完全由 AI 代写。
- 每个阶段先解释目标、输入输出、关键概念和文件位置，再进入实现。
- 对适合练习的模块，优先给出小任务、接口草稿或 TODO，让项目所有者先写关键逻辑。
- AI 主要负责拆解任务、解释设计取舍、代码审查、测试建议、排查 bug，以及在卡住时补齐必要代码。
- 重要代码合并前，需要能回答“为什么这么设计、风险在哪里、测试覆盖了什么”，方便后续求职面试讲述。
- 如果时间紧或 demo 风险高，可以由 AI 接手实现，但需要同步解释改动原因和核心逻辑。

## 产品目标

Sentinel 不应该只是一个交易解析器，而要表现为 AI DeFi 执行前的安全护栏。最有表现力的 demo 链路是：

1. 用户要求 AI Agent 执行一次 swap。
2. Agent A 将自然语言转换成结构化交易方案。
3. 硬规则层拦截明显违规交易。
4. 两个 LLM 审查员分别进行安全审计和 DeFi 风险分析。
5. DecisionEngine 给出 execute、confirm 或 reject。
6. 真正发链上交易前先做模拟。
7. 完整决策链路写入审计日志，供前端展示和复盘。

## 已确认方向

- 主 demo 路径是 `swap`，重点展示 Sepolia 上 ETH/WETH 到 USDC 的兑换。
- 普通 `transfer` 不能缺少，需要作为基础动作和简单安全控制 demo 保留。
- 后端主线使用 FastAPI，配合 Pydantic 定义请求/响应模型；Flask 作为后期对照练习，不进入 MVP 主线。
- `CONFIRM` 是 MVP 阶段的后端终态；`/api/confirm` 第一版只更新审计状态，不触发真实链上执行。
- 真实 Sepolia 执行必须受 `ENABLE_REAL_TX=true` 控制，默认走 dry-run/mock，避免 demo 和开发误触发。
- Audit log 第一版使用本地 JSON + 简单 HTTP API 查询，不读取链上事件。
- Agent B/C 同时接收原始用户输入和结构化 `TxProposal`，但 prompt 必须明确原始输入是 untrusted data，只能用于审查，不能当作指令执行。
- `transfer` 第一版使用黑名单 + 金额限制，不做白名单模式。
- swap 模拟采用 live Sepolia 优先 + mock fallback，兼顾真实性和 demo 稳定性。
- 合约白名单先放 Sepolia 相关合约即可，因为这是测试网项目。

## 架构建议

### 先稳定数据模型

在实现 Pipeline 前，先定义共享的类型模型：

- `TxProposal`：Agent A 输出的标准交易方案。
- `RuleResult`：硬规则检查结果。
- `AgentResult`：Agent B/C 审查结果。
- `DecisionResult`：最终决策和原因。
- `SimulationResult`：eth_call 或 dry-run 结果。
- `AuditRecord`：完整审计记录。

先统一模型可以避免每个模块都传松散 dict，后面接测试和前端也更稳。

### 对齐前端接口

后端 MVP 需要支撑前端计划中的四个 API 能力：

- `POST /api/execute`：提交自然语言 intent，返回一次执行决策结果。
- `POST /api/confirm`：处理 `confirm_needed` 后的用户选择；MVP 只更新审计记录，不真实执行。
- `GET /api/audit-log`：获取审计列表。
- `GET /api/audit-log/{tx_id}`：获取单条完整审计记录。

响应结构需要包含前端可直接展示的 `status`、`decision_chain`、`tx_id`、`tx_hash`、`decision_reason` 等字段。具体 Pydantic schema 在实现阶段再细化，避免计划文档过度膨胀。

### Swap 优先，Transfer 完整保留

`swap` 应该走完整风控链路：

- 滑点规则
- 金额规则
- 合约白名单
- 频率规则
- Agent B/C 审查
- 模拟
- 执行或 dry-run
- 审计日志

`transfer` 至少需要支持：

- 金额规则
- 收款地址黑名单
- 频率规则
- Agent B/C 审查（时间允许则接入）
- 执行或 dry-run
- 审计日志

### LLM 失败时保守处理

如果 Agent A/B/C 返回非法 JSON、超时或缺少必要字段：

- Agent A 应返回无效交易方案，并在执行前停止。
- Agent B/C 应产生失败的 `AgentResult`。
- DecisionEngine 应拒绝或要求人工确认，绝不能自动执行。

### 本地日志优先，链上事件最小化

本地 JSON 审计日志应作为 demo 的主要数据源，因为它能保存完整 reasoning、findings、simulation 结果和 tx hash。

链上事件保持最小：

- `Withdrawn`
- `AgentChanged` 或 `ConfigChanged`
- 可选：`RiskDecisionRecorded(bytes32 txIdHash, bytes32 decisionHash, bool approved)`

不要把长篇 AI reasoning 字符串写上链。

## DecisionEngine 初版策略

初始策略建议：

| 条件 | 决策 |
|---|---|
| 任意硬规则返回 `passed=False` | `REJECT` |
| Agent B 和 Agent C 都通过，风险为 low/medium | `EXECUTE` |
| 任一 Agent 以 high risk 拒绝 | `REJECT` |
| 一个 Agent 通过，一个 Agent 以 medium risk 拒绝 | `CONFIRM` |
| 两个 Agent 都拒绝 | `REJECT` |
| Agent B/C 输出非法或不可用 | `REJECT` |
| 模拟失败或 revert | `REJECT` |
| 模拟成功但 gas 估算异常高 | `CONFIRM` |

这样 `CONFIRM` 有明确价值，不会变成所有不确定情况的兜底。MVP 中 `CONFIRM` 不继续阻塞等待 CLI input，也不在 `/api/confirm` 后自动发链上交易。

## 初始阈值草案

以下是黑客松 demo 默认值草案，不是最终策略：

- 滑点：
  - `<= 3%`：通过
  - `> 3% 且 <= 5%`：人工确认
  - `> 5%`：拒绝
- Swap 金额：
  - `<= 0.05 ETH`：通过
  - `> 0.05 ETH 且 <= 0.2 ETH`：人工确认
  - `> 0.2 ETH`：拒绝
- Transfer 金额：
  - `<= 0.02 ETH`：通过
  - `> 0.02 ETH 且 <= 0.1 ETH`：人工确认
  - `> 0.1 ETH`：拒绝
- 频率：
  - 24 小时内同一目标合约或收款地址超过 3 次：拒绝
- 授权：
  - approve 金额大于 1 ETH 等值：拒绝
  - unlimited approval：拒绝

## Sepolia 白名单

初始白名单只放 demo 会用到的合约：

- Sepolia Uniswap SwapRouter：`0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`
- Sepolia WETH：`0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`
- Sepolia USDC：`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- 如果用于稳定测试，可加入本地或已部署的 MockDEX。

## 执行计划

### Phase 1：数据模型与接口契约

- 定义 `TxProposal`、`RuleResult`、`AgentResult`、`DecisionResult`、`SimulationResult`、`AuditRecord`。
- 对齐前端需要的 `ExecuteResponse`、`DecisionChain`、`AuditLogItem`。
- 学习切片：项目所有者先写 Pydantic/dataclass 模型，AI review 字段命名、默认值和校验边界。

### Phase 2：Agent A 结构化输出

- 改造 `agent/intent.py`，让 `swap` 和 `transfer` 输出统一 `TxProposal`。
- 保留 LLM JSON parse + validate；非法输出直接返回 failed，不进入执行。
- 学习切片：项目所有者实现 validator 或 parse 函数，AI 补测试样例和失败兜底。

### Phase 3：RiskPipeline

- 实现 slippage、amount、whitelist、frequency、approval 规则。
- `swap` 走完整规则；`transfer` 走 amount、blacklist、frequency。
- 阈值使用本计划中的初始草案。
- 任意 hard reject 直接停止后续 Agent 审查。

### Phase 4：Agent B/C 与 DecisionEngine

- 新增 Security Auditor 和 Risk Analyst。
- 并行调用 DeepSeek，输出必须 parse + validate。
- Agent B/C 同时接收原始用户输入和 `TxProposal`，并把原始输入声明为 untrusted data。
- DecisionEngine 输出 `execute`、`confirm`、`reject`。
- LLM 超时、非法 JSON、字段缺失默认 reject。
- `CONFIRM` 只作为后端终态，不在后端阻塞等待 input。

### Phase 5：FastAPI 服务与审计日志

- 新增 FastAPI app，暴露 `/api/execute`、`/api/confirm`、`/api/audit-log`、`/api/audit-log/{tx_id}`。
- AuditLogger 写本地 JSON，记录 intent、proposal、规则结果、Agent 审查、决策、模拟、tx hash。
- `/api/confirm` MVP 只记录用户 approve/reject，不真实执行交易。

### Phase 6：模拟与执行保护

- TransactionSimulator 先支持 swap/transfer dry-run 结果。
- live eth_call 可用则使用，不可用时 mock fallback。
- executor 的真实发交易逻辑保留，但必须受 `ENABLE_REAL_TX=true` 控制。
- 修复 gas 硬编码，优先动态 fee，失败时安全 fallback。

### Phase 7：合约事件与测试

- 给 `withdraw`、`setAgent`、`setDailyLimit` 补事件。
- 补 Foundry 测试，确认事件 emit 和原有权限/限额逻辑不变。
- 不新增复杂 guard，不改变 `execute(address,uint256,bytes)` 的行为。

### Phase 8：前后端联调与 Demo 用例

- 成功 swap：返回完整通过链路，可在 mock/dry-run 下展示 tx hash 或 simulated hash。
- 高风险 swap：硬规则拒绝，跳过 Agent/执行。
- 边界 swap：返回 `confirm_needed`，前端按钮调用 `/api/confirm` 更新审计状态。
- 普通 transfer：通过基础安全链路，证明普通转账未缺失。

## 测试计划

### Python 单元测试

- Agent A JSON parse 成功/失败。
- 每条 RiskRule 的 pass/confirm/reject 边界。
- DecisionEngine 组合测试。
- AuditLogger 写入和按 `tx_id` 查询。

### FastAPI 接口测试

- `/api/execute` 覆盖成功、拒绝、确认、失败四类响应。
- `/api/confirm` approve/reject 都能更新审计记录。
- `/api/audit-log` 和详情接口返回前端兼容结构。

### Foundry 合约测试

- `forge test` 保持原有用例通过。
- 新增事件 emit 测试。
- 确认权限、daily limit、execute 行为不因事件修改而回归。

### 手动验收场景

- `Swap 0.01 ETH to USDC`：通过链路。
- `Swap 1 ETH to USDC`：被硬规则拒绝。
- 边界金额 swap：返回 `confirm_needed`。
- 普通 `transfer`：基础链路可用。
- `ENABLE_REAL_TX` 未开启时不会真实发交易。

## v1.1 / 后续问题

- `confirm_needed` 后批准是否真实执行链上交易，以及如何处理重复点击、状态保存和交易失败。
- 金额阈值是否从统一 ETH 计价升级为 token-specific limit。
- 是否读取链上风控事件作为审计数据补充。
- Flask 对照练习：用同一套业务逻辑复刻 `/health`、`/api/audit-log`、`/api/audit-log/{tx_id}` 等少量接口，补齐求职常见 JD 技能点。
