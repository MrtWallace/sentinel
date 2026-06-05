# Sentinel Hackathon — 后端 & 合约稳定计划

> 目的：记录 Sentinel 黑客松后端/合约方向、已确认取舍、checkpoint 定义和长期测试策略。
> 最后更新：2026-06-03 21:17
> 短期进度、当前阻塞、最近完成项见 `hackathon/docs/backend-progress.md`。

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

## 进度记录约定

- 每次开始一个后端/合约 checkpoint 时，默认更新 `hackathon/docs/backend-progress.md` 的开始时间、状态和备注。
- 每次结束一个后端/合约 checkpoint 或准备提交前，默认更新 `hackathon/docs/backend-progress.md` 的完成时间、状态、测试结果和最近完成项。
- 时间戳统一使用北京时间（Asia/Shanghai），精确到分钟，格式为 `YYYY-MM-DD HH:MM`。
- 用户不需要每次重复提醒“更新进度详情”或“记录时间戳”；除非明确要求跳过，默认执行。

## 产品目标

Sentinel 不应该只是一个交易解析器，而要表现为 CAW 之上的 risk-aware autonomous trading agent。最有表现力的 demo 链路是：

1. 用户要求 AI Agent 执行一次 transfer 或 swap。
2. Agent A 将自然语言转换成结构化交易方案。
3. 硬规则层拦截明显违规交易。
4. 两个 LLM 审查员分别进行安全审计和 DeFi 风险分析。
5. DecisionEngine 给出 execute、confirm 或 reject。
6. AgenticLoop 在 reject + suggestions 时最多重生成 2 次 proposal。
7. Sentinel 通过后，CAW 在 active pact 范围内真实执行 safe transfer。
8. 完整决策链路和 CAW request/transaction evidence 写入审计日志，供前端展示和复盘。

## 已确认方向

- Cobo 主 demo 路径采用 **transfer-first**：至少一条 safe transfer 通过 CAW `transfer_tokens` 真实执行。
- `swap` 继续保留为风控展示和 stretch goal；CAW `contract_call` swap 不进入 MVP 硬门槛。
- 后端主线使用 FastAPI，配合 Pydantic 定义请求/响应模型；Flask 作为后期对照练习，不进入 MVP 主线。
- `CONFIRM` 是 MVP 阶段的后端终态；`/api/confirm` 第一版只更新审计状态，不触发真实链上执行。
- 真实 Sepolia 执行必须受 `ENABLE_REAL_TX=true` 控制，默认走 dry-run/mock，避免 demo 和开发误触发。
- Audit log 第一版使用本地 JSON + 简单 HTTP API 查询，不读取链上事件。
- Agent B/C 同时接收原始用户输入和结构化 `TxProposal`，但 prompt 必须明确原始输入是 untrusted data，只能用于审查，不能当作指令执行。
- `transfer` 第一版使用黑名单 + 金额限制，不做白名单模式。
- swap 模拟采用 live Sepolia 优先 + mock fallback，兼顾真实性和 demo 稳定性。
- 合约白名单先放 Sepolia 相关合约即可，因为这是测试网项目。
- Cobo 赛道主线选择 `04｜Autonomous Trading`，Sentinel 定位为 risk-aware autonomous trading agent。
- Cobo 赛道 demo 以 Cobo Agentic Wallet (CAW) 作为 Agent 资金账户和主执行后端。
- `SmartAccount.sol` 保留为 baseline / fallback / 技术展示，不作为 Cobo 赛道 demo 的主资金路径。
- Sentinel 风控管线负责执行前 AI 风险判断；CAW Pact 负责资金权限边界和 infrastructure-enforced policy 兜底。
- Agent 化采用 bounded retry loop：最多重试 2 次，建议驱动，所有 attempt 写入审计日志，不做无限自治。
- CAW Pact 在 demo 前预先提交并由 owner 审批；运行时只在 active pact 范围内执行，不在每次 `/api/execute` 内临时等待 owner approval。
- 提交截止时间按 `2026-06-13 12:00` 规划；MVP 范围优先保证 CAW `transfer_tokens`、Sentinel reject、CAW policy deny 三条稳定 demo。
- CAW 真实调用是 Cobo 赛道 MVP gate：最终 demo 至少要有一条通过 CAW SDK/API 完成的真实 `transfer_tokens` 资金操作，只有 mock/simulator 不满足赛道要求。
- CAW mock/simulator 只用于开发、测试和 fallback；demo 主路径必须展示 CAW wallet、active pact、request/transaction id，时间允许再补 testnet tx hash。
- Agentic 能力采用 `ReproposalAgent + MutationGuard + AgenticLoop`：LLM/mock 负责重新提案，确定性 guard 负责验证风险是否真的降低。
- CP4/CP5 不做多笔交易拆分，`TxProposal` 仍保持单笔交易模型；拆单策略只作为 reasoning / v1.1 方向。
- Solo MVP 优先级按 P0/P1/P2 执行，先暴露 CAW 真实调用风险，再补 API 和 demo polish。

## Solo MVP 优先级

### P0：必须优先完成

| 调整 | 目的 | 预计耗时 |
|---|---|---:|
| CAW Setup Spike 提前到 CP4.5 | 尽早验证 CLI/SDK/wallet/pact 是否可用 | 1-3h |
| Cobo demo transfer-first | 保证至少一条真实 CAW 资金操作 | 文档 0.5h；实现 2-4h |
| CAW Evidence Checklist | 确保提交材料满足 Cobo 赛道证据要求 | 0.5h |

### P1：紧随 P0

| 调整 | 目的 | 预计耗时 |
|---|---|---:|
| CP5 缩到最小 `/api/execute` | 前端尽快按稳定 response shape 开发 | 文档 0.5h；实现 2-3h |
| Demo Script First | 反推后端字段和前端展示，避免做完讲不清 | 1h |
| SmartAccount 降级更明确 | 避免评委误解 Cobo 主执行路径 | 0.5h |

### P2：控制范围

| 调整 | 目的 | 预计耗时 |
|---|---|---:|
| CP4 拆成 CP4a/b/c | 降低 AgenticLoop 实现失控风险 | 0.5h |
| Provider-agnostic LLM Agent B/C 后移 | 先保证 CAW 真实执行，再补真实 LLM reviewer，降低 demo 不稳定性 | 0.25h |
| 失败预案 | demo 当天可控 | 0.5h |
| 前端改成证据展示而非 dashboard | 突出评委关心的资金执行和风控证据 | 0.5h 文档；前端节省时间 |

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

后端 MVP 先支撑前端 demo 的最小 API 能力：

- `POST /api/execute`：提交自然语言 intent，返回一次执行决策结果。
- `GET /api/audit-log/{tx_id}`：获取单条完整审计记录，可在 CP5 后半补。
- `POST /api/confirm`：后补；MVP 只记录用户 approve/reject，不真实执行。
- `GET /api/audit-log`：后补列表页，不阻塞 demo。

响应结构需要包含前端可直接展示的 `status`、`decision_chain`、`attempts`、`execution`、`tx_id`、`decision_reason`、CAW wallet/pact/request evidence 等字段。具体 Pydantic schema 在实现阶段再细化，避免计划文档过度膨胀。

### Transfer-first，Swap 保留为风控展示

`transfer` 是 Cobo MVP 主执行链路，必须走：

- 金额规则
- 收款地址黑名单
- 频率规则
- Agent B/C 审查
- AgenticLoop attempts
- CAW `transfer_tokens` 真实执行或 policy deny
- 审计日志和前端 evidence 展示

`swap` 继续走完整风控链路，但执行层可先 dry-run/mock：

- 滑点规则
- 金额规则
- 合约白名单
- 频率规则
- Agent B/C 审查
- 模拟
- 执行或 dry-run
- 审计日志

CAW `contract_call` swap 作为 stretch goal，只有 safe transfer 稳定后再做。

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

### Bounded Agent Loop

Sentinel 的 agent 化不追求无限自治，而是在硬规则约束内进行有限重试：

- `AgentResult` 增加 `suggestions: list[Suggestion]`，用于记录 Agent B/C 给出的可执行修改建议。
- `Suggestion` 至少包含 `field`、`suggested_value`、`reason`、`rejection_code`。
- 不做机械字段替换；`ReproposalAgent` 接收原始 proposal、attempts、rejection context 和 suggestions，重新生成 revised `TxProposal`。
- CP4 先实现 `MockReproposalAgent`，按 `rejection_code` 选择策略；后续真实版用 provider-agnostic LLM client / Agent A 重新推理。
- `AgenticLoop(max_retries=2)` 在 `reject + suggestions` 时允许 Agent A 重生成 `TxProposal`，重试计数包含后续 CAW deny 触发的重试。
- suggestions 只能降低风险参数，例如降低 `amount`、降低 `slippage`、缩短 `deadline`。
- 不允许 suggestions 修改 `to_contract` 到未知地址，也不能绕过 hard rule。
- 每次 attempt 都要写入 audit log，前端可展示 `attempt 1/2/3`。
- `tool_calls[]` / `observations[]` 暂降为 nice-to-have；优先把 proposal retry、guard 验证和 attempts 展示做扎实。

### MutationGuard 标准

`MutationGuard` 用确定性代码验证 revised proposal，避免 LLM/mock 通过“看似修改”绕过风险规则：

| rejection_code | 允许自动修正 | 验证标准 |
|---|---|---|
| `amount_too_high` | 是 | 使用 `Decimal` 比较，`new.amount <= old.amount * 0.7`，至少降低 30% |
| `slippage_too_high` | 是 | `new.slippage < old.slippage` |
| `deadline_too_long` | 是 | `new.deadline < old.deadline` |
| `unknown_contract` | 默认否 | 不自动替换 `to_contract`；除非 new contract 已在 allowlist，否则拒绝 revised proposal |

- guard 还要检查修改是否覆盖对应 rejection reason：例如被拒原因是 `slippage_too_high`，只改 `amount` 不算通过。
- guard 通过后仍必须重新跑 RiskPipeline，确认新 proposal 不再触发同一 hard rule。
- 金额比较禁止用 `float`，统一用 `Decimal`。
- MVP 不支持 `TxProposal -> list[TxProposal]` 的拆单输出，避免扩大 RiskPipeline、Audit 和前端展示范围。

### CAW Execution Path

Cobo 赛道版本中，CAW 是 Agent 资金执行的主路径，Sentinel 是执行前的 AI 风控层：

```text
Setup:
  caw onboard --wait
  -> 创建/配对 CAW 钱包
  -> 提交 PactSpec
  -> owner 在 CAW app 审批
  -> pact 进入 active

Runtime:
  user intent
  -> Sentinel risk decision
  -> decision == execute 且 pact active
  -> CAW transfer_tokens / contract_call
  -> CAW result + Sentinel audit log
```

- CAW policy denied 时返回 `REJECT`，写入 audit log，并在前端展示 CAW deny reason。
- CAW pact policy 与 Sentinel hard rules 对齐：金额限制、合约 allowlist、频率限制、function selector / params match。
- 开发默认 `ENABLE_REAL_TX=false`，不发真实 CAW transaction，只返回 dry-run / mocked result；Cobo demo 的 safe transfer 场景必须在受控测试资产下设置 `ENABLE_REAL_TX=true` 并真实调用 CAW。
- 运行时使用 active pact 的 scoped credentials，不在每笔交易中临时提交 pact 等待审批。

### CAW Evidence Checklist

Cobo 提交和 demo 至少保留以下证据：

- CAW wallet address。
- active pact id / 截图 / CLI 状态记录。
- 一条 safe transfer 的 CAW request id 或 transaction record。
- 时间允许则补 testnet tx hash / explorer 链接。
- 一条 Sentinel reject：展示 hard rule 或 Agent 审查拒绝，且不触发 CAW。
- 一条 CAW policy deny：Sentinel 通过，但 CAW Pact 拒绝，展示双层防护。
- 对应 Sentinel audit record：intent、proposal、rules、agent results、decision、execution result。

### Demo Script First

Demo 先按场景反推后端字段和前端展示：

1. **Sentinel reject before CAW**：高金额或高滑点交易被 Sentinel 拒绝，CAW 不被调用。
2. **Agent revises risky proposal**：Agent B/C 给出 suggestion，ReproposalAgent 重生成 proposal，MutationGuard 验证风险降低。
3. **CAW executes safe transfer**：Sentinel 决策 execute，CAW 在 active pact 范围内真实 `transfer_tokens`。
4. **CAW policy deny**：Sentinel 通过但 CAW Pact 拒绝，前端展示 CAW deny reason。

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

## Checkpoint 定义

> 本节只定义 checkpoint 的目标和范围，不记录当前状态。状态更新统一写入 `hackathon/docs/backend-progress.md`。

### CP1 / Phase 1：数据模型与接口契约

- 定义 `TxProposal`、`RuleResult`、`AgentResult`、`DecisionResult`、`SimulationResult`、`AuditRecord`。
- 对齐前端需要的 `ExecuteResponse`、`DecisionChain`、`AuditLogItem`。
- 学习切片：项目所有者先写 Pydantic/dataclass 模型，AI review 字段命名、默认值和校验边界。

### CP2 / Phase 2：Agent A 结构化输出

- 改造 `agent/intent.py`，让 `swap` 和 `transfer` 输出统一 `TxProposal`。
- 保留 LLM JSON parse + validate；非法输出直接返回 failed，不进入执行。
- 学习切片：项目所有者实现 validator 或 parse 函数，AI 补测试样例和失败兜底。

### CP3 / Phase 3：RiskPipeline

- 实现 slippage、amount、whitelist、frequency、approval 规则。
- `swap` 走完整规则；`transfer` 走 amount、blacklist、frequency。
- 阈值使用本计划中的初始草案。
- 任意 hard reject 直接停止后续 Agent 审查。

### CP4a / Phase 4a：DecisionEngine + Agent B/C mock + suggestions

- 新增 Security Auditor 和 Risk Analyst。
- mock Agent B/C 支持 `passed`、`risk_level`、`findings`、`reasoning`、`suggestions`。
- `Suggestion` 增加 `rejection_code`，支撑后续 `MutationGuard` 判定。
- DecisionEngine 输出 `execute`、`confirm`、`reject`，并在 reject/high risk 时保留 suggestions。
- Provider-agnostic LLM Agent B/C 后移到 CAW 真实执行之后；MVP 可继续使用 mock reviewer，但 2026-06-13 前计划补真实 LLM 调用。

### CP4b / Phase 4b：ReproposalAgent + MutationGuard

- 新增 `MockReproposalAgent`，根据 `rejection_code` 重新生成 revised `TxProposal`，不是简单 string replacement。
- 新增 `MutationGuard`，验证 revised proposal 是否真实降低风险且没有绕过 hard rule。
- `MutationGuard` 覆盖 `amount_too_high`、`slippage_too_high`、`deadline_too_long`、`unknown_contract`。
- 金额比较使用 `Decimal`，`amount_too_high` 至少降低 30%。

### CP4c / Phase 4c：AgenticLoop + in-memory attempts

- 新增 `AgenticLoop(max_retries=2)`，串起 RiskPipeline、Agent B/C mock、DecisionEngine、ReproposalAgent 和 MutationGuard。
- 第一版 attempts 可先存在内存返回值里；CP5 再写入 AuditLogger。
- Agent B/C 同时接收原始用户输入和 `TxProposal`，并把原始输入声明为 untrusted data。
- LLM 超时、非法 JSON、字段缺失默认 reject。
- `CONFIRM` 只作为后端终态，不在后端阻塞等待 input。

### CP4.5 / Phase 4.5：CAW Setup Spike

- 安装并验证 CAW CLI / Python SDK。
- 跑 `caw onboard --wait`，创建或配对 CAW wallet。
- Pair owner，拿到 wallet id / api endpoint / credentials。
- 提交最小 PactSpec，并确认 pact active。
- 记录 CAW wallet address、pact id、CLI 截图/命令输出位置。
- 不接业务代码也可以，但必须在 CP6 前确认真实 CAW 执行路径可用。

### CP5 / Phase 5：Minimal FastAPI 服务与审计日志 + attempts[]

- 新增 FastAPI app，先保证 `/api/execute` 和 `/api/audit-log/{tx_id}` 能支撑前端 demo；`/api/confirm`、`/api/audit-log` 列表可后补。
- AuditLogger 写本地 JSON，记录 intent、proposal、规则结果、Agent 审查、决策、模拟、tx hash。
- `AuditRecord` 增加 `attempts[]`，每轮记录 proposal、rules、agent results、decision。
- `/api/execute` 返回 final decision 和 attempts summary，供前端 DecisionChain 展示 `attempt 1/2/3`。
- `/api/confirm` MVP 只记录用户 approve/reject，不真实执行交易。
- CP5 不追求完整 API surface，优先尽快交给前端稳定 response shape，并为 CP6 CAW 字段预留 `execution` 区块。

### CP6 / Phase 6：CAW Execution Backend + Real Transfer

- 定义 `ExecutionBackend` 接口。
- `LocalSmartAccountExecutor` 保留为 baseline/fallback。
- `CawExecutor` 作为 Cobo 赛道 demo 的 primary executor。
- CP6 是 Cobo 赛道硬门槛，优先级高于完整 FastAPI polish 和 `contract_call` swap。
- 先跑通真实 CAW `transfer_tokens`，拿到 CAW request/transaction id；再实现 `contract_call`。
- simulator 只能作为开发 fallback，不能作为 Cobo demo 的主执行证明。
- TransactionSimulator 先支持 transfer/swap dry-run，live eth_call 可用则使用，不可用时 mock fallback。
- 配置项：
  - `EXECUTION_BACKEND=local|caw`
  - `ENABLE_REAL_TX=false` 默认 dry-run
  - `COBO_WALLET_ID`
  - `COBO_PACT_ID`
  - `COBO_ENV`
- 记录 `request_id` 防重复提交。
- 捕获 CAW policy denial，并写入 audit log。
- CAW policy denial 作为 `rejection_source="caw"` 写入 attempt；时间允许时走同一套 `ReproposalAgent + MutationGuard` observe/adapt 流程，且共享 `max_retries=2` 预算。
- CAW setup 可以在 CP4 结束后并行提前做：安装 CLI/SDK、`caw onboard --wait`、pair owner、提交并审批 pact，不必等 CP5 完整完成。

### CP7 / Phase 7：Demo Evidence + README + Script

- 按 CAW Evidence Checklist 整理 wallet、pact、request/transaction、policy deny、Sentinel audit record。
- 写 README 的 Cobo demo 路径和环境变量说明。
- 写 3-5 分钟 demo script，按四个场景录制。
- 前端优先展示证据链，不做复杂 dashboard。

### CP7.5 / Phase 7.5：Provider-agnostic LLM Reviewers

- 新增 `LLMClient` 抽象，reviewer / reproposal agent 不直接依赖具体厂商。
- 第一版实现 `OpenAICompatibleLLMClient`，支持 DeepSeek、OpenAI、Qwen、Moonshot 等兼容 Chat Completions 的服务。
- 配置项：
  - `LLM_PROVIDER=openai_compatible`
  - `LLM_BASE_URL`
  - `LLM_API_KEY`
  - `LLM_MODEL`
  - `LLM_TIMEOUT_SECONDS=15`
  - `LLM_TEMPERATURE=0`
- 不依赖厂商 tool calling / function calling；第一版使用普通 chat completion + JSON extract + dataclass validation。
- 新增 `LLMSecurityAuditor` 和 `LLMRiskAnalyst`：
  - 输入 `TxProposal` 和 untrusted 原始 intent。
  - 输出 `AgentResult`，必须包含 `passed`、`risk_level`、`findings`、`reasoning`、`suggestions`。
  - LLM 超时、非法 JSON、字段缺失默认返回 reject / high risk，不进入执行。
- `MockSecurityAuditor` / `MockRiskAnalyst` 保留为 fallback 和单元测试默认路径。
- 时间允许再新增 `LLMReproposalAgent`：
  - 输入 old proposal、attempt history、rejection context、suggestions。
  - 输出 revised `TxProposal`。
  - 必须经过 `MutationGuard`，不能直接执行 LLM 输出。
- API 增加模式开关：
  - `REVIEWER_MODE=mock|llm`
  - `REPROPOSAL_MODE=mock|llm`

### CP8 / Phase 8：Stretch：合约事件 / contract_call swap / polish

- 给 `withdraw`、`setAgent`、`setDailyLimit` 补事件。
- 补 Foundry 测试，确认事件 emit 和原有权限/限额逻辑不变。
- 不新增复杂 guard，不改变 `execute(address,uint256,bytes)` 的行为。
- 时间允许再做 CAW `contract_call` swap 和 LLM reproposal polish。

### Demo 用例

- 成功 safe transfer：通过 Sentinel，CAW 真实 `transfer_tokens`，展示 request/transaction id。
- 高风险 swap：硬规则拒绝，跳过 Agent/执行。
- 边界 swap：返回 `confirm_needed`，前端按钮调用 `/api/confirm` 更新审计状态。
- 普通 transfer：通过基础安全链路，证明普通转账未缺失。
- safe transfer via CAW：展示 CAW wallet address、pact active、transaction/request id。
- Cobo 必做真实执行：至少一条 safe transfer 通过 CAW SDK/API 发起，不能只展示 mock/simulated hash。
- Sentinel hard rule reject：不触发 CAW。
- CAW pact deny：Sentinel 通过，但 CAW policy 拒绝，展示双层防护。
- 时间允许再做 `contract_call` swap。

## 测试计划

### Python 单元测试

- Agent A JSON parse 成功/失败。
- 每条 RiskRule 的 pass/confirm/reject 边界。
- DecisionEngine 组合测试。
- AuditLogger 写入和按 `tx_id` 查询。
- Agent B/C reject 或 high risk 时必须返回 suggestions。
- `AgenticLoop` 最多重试 2 次。
- hard rule reject 不触发 retry 执行。
- suggestions 不允许修改 `to_contract` 到未知地址。
- `MockReproposalAgent` 按 `rejection_code` 生成不同 revised proposal。
- `MutationGuard` 覆盖 `amount_too_high`、`slippage_too_high`、`deadline_too_long`、`unknown_contract`。
- `MutationGuard` 对金额使用 `Decimal`，并要求 amount 至少降低 30%。
- 修改字段与 rejection reason 不匹配时，guard 应拒绝 revised proposal。
- `CawExecutor` dry-run / mocked CAW success / mocked CAW policy denied。
- `CawExecutor` 真实 CAW `transfer_tokens` smoke test，需记录 request id；真实调用只在显式配置和测试资产下运行。
- `AuditRecord.attempts[]` 顺序和内容可追溯。

### FastAPI 接口测试

- `/api/execute` 覆盖成功、拒绝、确认、失败四类响应。
- `/api/execute` 返回 attempts summary。
- `/api/confirm` approve/reject 都能更新审计记录。
- `/api/audit-log` 和详情接口返回前端兼容结构。
- Sentinel reject 时 `execution_backend` 不被调用。
- CAW policy denied 时返回 reject，并包含 CAW reason。
- `ENABLE_REAL_TX=false` 时不发真实 CAW transaction。
- Cobo demo 配置下 `ENABLE_REAL_TX=true` 时，`/api/execute` 可以触发 CAW `transfer_tokens` 并返回 CAW request/transaction id。

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
- CAW wallet address 可展示。
- active pact 记录或截图可展示。
- CAW transaction/request id 必须可展示；testnet tx hash 时间允许则补。
- 至少展示一条 Sentinel reject 和一条 CAW policy deny。
- 至少展示一条 CAW 真实 safe transfer，不接受只用 mock/simulator 作为 Cobo 主路径。

## Cobo Agentic Wallet (CAW) 集成方案

> **目标**：Cobo 赛道 demo 以 CAW 作为 Agent 资金账户和主执行路径，
> Sentinel 保留为 CAW 之前的 AI 风控与决策层。
> 方向：**04｜Autonomous Trading** — 带风控的自主交易 Agent。

### 定位

Cobo 赛道要求 Agent 的资金相关操作通过 CAW 完成。Sentinel 的 Cobo 版本不再把
`SmartAccount.sol` 作为主资金路径，而是采用：

```text
Sentinel = pre-execution AI risk + bounded agent loop + audit
CAW      = agent wallet + scoped execution + infrastructure-enforced policy
```

`SmartAccount.sol` 保留为 baseline / fallback / 技术展示，不作为 Cobo 赛道 demo 的主执行路径。

### CAW 核心概念（开发前必读）

- **Pact（权限契约）**：Setup 阶段提交 PactSpec，owner 在 CAW app 审批，pact active 后 Agent 才能在授权范围内自主执行。
- **MPC 签名**：Agent 不持有私钥，CAW 用 MPC-backed signing 完成资金操作。
- **Infrastructure-enforced policy**：CAW 在执行时强制校验 pact policies，超出范围直接拒绝并返回结构化错误。
- **审计日志**：CAW 交易记录可补充 Sentinel 本地 audit log。

### 架构变化

```text
Baseline:
  用户意图 -> Agent A -> RiskPipeline -> Agent B/C -> DecisionEngine -> SmartAccount.execute()

Cobo Track:
  用户意图 -> Agent A -> RiskPipeline -> Agent B/C -> DecisionEngine -> CAW transfer_tokens / contract_call
                                                                                 ^
                                                           Active Pact + CAW policy enforcement
```

Sentinel 风控在 CAW 之前做智能判断；CAW Pact 在执行时做资金权限边界兜底。
双层防护叙事是 **Sentinel AI risk control + CAW infrastructure-enforced policy**。

### Pact 生命周期

- Setup 阶段：
  - 通过 `caw onboard --wait` 创建并配对 CAW 钱包。
  - 根据 Sentinel hard rules 设计 PactSpec。
  - owner 在 CAW app 审批，pact 进入 active。
- Runtime 阶段：
  - Sentinel 决策为 `execute` 时，检查 active pact 配置。
  - 使用 pact-scoped credentials 调用 `transfer_tokens` 或 `contract_call`。
  - CAW policy denied 时写入 audit log，并返回可展示的 reject reason。
- 不在每次 `/api/execute` 内临时提交 pact 并等待 owner 审批，避免 demo 被人工审批流程阻塞。

### CAW Policy 与 Sentinel Rule 对齐

| Sentinel 规则 | CAW Pact policy 映射 |
|---|---|
| `AmountRule` | spend limit / `amount_gt` / `amount_usd_gt` |
| `WhitelistRule` | contract allowlist / `target_in` |
| `FrequencyRule` | rolling usage limit / tx count cap |
| `ApprovalRule` | `contract_call` target + function selector + params match |

### 改造清单

#### 必做（MVP）

| # | 任务 | 改动范围 | 预估 |
|---|---|---|---|
| C1 | 安装 CAW CLI / Python SDK，跑通 quickstart | 新依赖 + 配置 | 1-2h |
| C2 | 创建 CAW 钱包，pairing owner，拿到 active pact | CLI 操作 + 文档记录 | 0.5-1h |
| C3 | 新增 `ExecutionBackend` 与 `CawExecutor` | 后端执行抽象 | 2-3h |
| C4 | 真实调用 `transfer_tokens`，返回 request/transaction id | CAW 主执行路径 | 2-3h |
| C5 | Audit 记录 CAW wallet / pact / request / tx / policy result | 审计模型 + API | 1-2h |
| C6 | 前端展示 CAW wallet address、pact status、request id / tx hash | 前端小改 | 1h |

#### 可选（时间允许）

| # | 任务 | 说明 |
|---|---|---|
| C7 | CAW 审计日志 + Sentinel 本地日志合并展示 | 前端 audit 页更丰富 |
| C8 | `contract_call` swap 完整实盘路径 | 若 transfer demo 稳定后再做 |
| C9 | 多 Agent 钱包（A2A 方向） | 每个 Agent 独立 CAW 钱包，v1.1+ |

### 关键代码方向

```python
class ExecutionBackend:
    def execute(self, tx, calldata=None):
        ...

class LocalSmartAccountExecutor(ExecutionBackend):
    # baseline / fallback
    ...

class CawExecutor(ExecutionBackend):
    # Cobo track primary executor
    # Python package: cobo-agentic-wallet
    # Client direction: WalletAPIClient
    # Operations: submit_pact, get_pact, transfer_tokens, contract_call
    ...
```

配置：

```text
EXECUTION_BACKEND=local|caw
ENABLE_REAL_TX=false
COBO_ENV=
COBO_WALLET_ID=
COBO_PACT_ID=
```

### 数据模型调整

```python
@dataclass
class Suggestion:
    field: str
    suggested_value: str | float | int
    reason: str
    rejection_code: str

@dataclass
class AttemptRecord:
    attempt_index: int
    tx_proposal: TxProposal
    hard_rules: list[RuleResult]
    security_audit: Optional[AgentResult]
    risk_analysis: Optional[AgentResult]
    decision: DecisionResult
    rejection_source: Literal["sentinel", "caw", "none"] = "none"

@dataclass
class CawExecutionResult:
    wallet_id: str
    pact_id: str
    request_id: str
    status: Literal["dry_run", "submitted", "succeeded", "policy_denied", "failed"]
    tx_hash: Optional[str] = None
    policy_reason: Optional[str] = None
```

`AuditRecord` 后续增加：

```python
attempts: list[AttemptRecord]
caw_execution: Optional[CawExecutionResult]
```

### 双层防护的 Demo 叙事

评委/面试核心问题："为什么需要 Sentinel？CAW 自己不是有 Pact 策略吗？"

回答：
> "CAW 的 Pact 负责资金权限边界，例如合约 allowlist、金额上限和频率限制；
> Sentinel 的 AI 风控负责执行前动态判断，例如用户意图是否异常、slippage 是否合理、
> 合约风险是否值得拒绝或要求确认。两者互补：Sentinel 做智能决策，CAW 做最终资金执行保障。"

### 验收标准

- CAW wallet 成功创建并 pairing。
- 至少一个 active pact 可展示。
- 至少一条 safe transfer 通过 CAW SDK/API 真实发起，可稳定演示。
- Sentinel 风控 reject 时不触发 CAW。
- CAW policy denied 时可以展示 policy reason。
- Demo 中有 CAW wallet address、active pact、request id / transaction record；时间允许则补 testnet tx hash。
- CAW simulator / mocked success 只能作为开发备份，不作为 Cobo 赛道主验收路径。

### 参考链接

- 官网：https://www.cobo.com/agentic-wallet
- 文档：https://www.cobo.com/products/agentic-wallet/manual/start-here/introduction
- Python SDK：https://www.cobo.com/products/agentic-wallet/manual/developer/api-client-python
- CLI：https://www.cobo.com/products/agentic-wallet/manual/developer/cli
- Pact Policies：https://www.cobo.com/products/agentic-wallet/manual/reference/pact-policies
- Agentic Economy 博客：https://www.cobo.com/blog-new-page?tag=Cobo+Agentic+Economy

---

## v1.1 / 后续问题

- `confirm_needed` 后批准是否真实执行链上交易，以及如何处理重复点击、状态保存和交易失败。
- 金额阈值是否从统一 ETH 计价升级为 token-specific limit。
- 是否读取链上风控事件作为审计数据补充。
- CAW `contract_call` swap 从 stretch goal 升级为主路径的条件和风险。
- CAW webhook / callback 生产化，用于异步更新 audit tx status。
- CAW PactSpec 是否由 Sentinel hard rules 自动生成，还是手动维护 demo pact。
- 多 Agent / A2A 钱包经济体是否进入 v1.1，而不是当前 Cobo MVP。
- 多笔交易拆分是否进入 v1.1；MVP 中 `TxProposal` 保持单笔交易，避免扩大审计和前端复杂度。
- tool_calls / observations 是否在 demo polish 阶段补充；当前优先级低于 AgenticLoop 和 CAW policy deny。
- Flask 对照练习：用同一套业务逻辑复刻 `/health`、`/api/audit-log`、`/api/audit-log/{tx_id}` 等少量接口，补齐求职常见 JD 技能点。
