# Sentinel Hackathon — 后端 & 合约进度

> 目的：只记录短期状态，包括 checkpoint 进度表、当前阻塞、最近完成项。
> 最后更新：2026-06-02 00:13
> 稳定方向和 checkpoint 定义见 `hackathon/docs/backend-plan.md`。

## 更新约定

- 时间戳使用北京时间（Asia/Shanghai），格式统一为 `YYYY-MM-DD HH:MM`。
- `预计工时` 是有效 coding + review 时间，不包含长时间休息。
- 历史记录如果当时没有记录到分钟，明确标注“未记录分钟”。
- 后续 checkpoint 状态、阻塞和最近完成项只更新本文件，除非稳定计划本身发生变化。

## 进度表

| Checkpoint | 内容 | 预计工时 | 开始时间 | 完成时间 | 状态 | 备注 |
|---|---|---:|---|---|---|---|
| CP1 | 数据模型 + Agent A parser/validator | 3-4h | 2026-05-31（未记录分钟） | 2026-05-31（未记录分钟） | Done | 6 个 intent 单元测试通过 |
| CP2 | RiskPipeline 骨架 + AmountRule | 2-3h | 2026-06-01（未记录分钟） | 2026-06-01 05:12 | Done | 19 个 agent 单元测试通过，包含 stop-on-reject 测试 |
| CP3 | 剩余硬规则：Slippage / Whitelist / Approval / Frequency | 4-6h | 2026-06-01 05:12 | 2026-06-01 06:48 | Done | 37 个 risk/pipeline 单元测试通过 |
| CP4 | DecisionEngine + Agent B/C mock + suggestions | 4-6h | 2026-06-02 00:13 | 待完成 | In Progress | 第一步：Suggestion 模型 + suggestions 字段 |
| CP5 | AuditLogger + FastAPI mock API + attempts[] | 5-8h | 待开始 | 待开始 | Todo | 前端联调关键节点，支撑 agent retry 展示 |
| CP6 | CAW Execution Backend + Simulator | 5-8h | 待开始 | 待开始 | Todo | CAW 为 Cobo demo 主执行路径，local executor 保留 fallback |
| CP7 | 合约事件 + Foundry 测试 | 2-4h | 待开始 | 待开始 | Todo | 最小改动，不改 `execute` 核心逻辑 |
| CP8 | E2E Demo：safe / reject / confirm / transfer | 3-5h | 待开始 | 待开始 | Todo | 后端 demo 验收 |

## 当前阻塞

- 无明确外部阻塞。
- 当前进行：CP4，第一步补 `Suggestion` 数据模型，不写 `DecisionEngine`。
- Cobo 赛道新增工作量约 8-14h：agent retry、attempts audit、CAW executor、CAW 展示和 policy denied demo。
- 前端需要后续同步：DecisionChain 支持 attempts；状态栏从 SmartAccount 主视角调整为 CAW wallet / pact 主视角；Audit 展示 CAW request id、policy result、tx hash。

## 最近完成项

### 2026-06-02 后端计划更新：Agent 化 + CAW 主执行路径

- 已将 Cobo 赛道主线并入 `backend-plan.md`：
  - 选择 `04｜Autonomous Trading`。
  - CAW 作为 Cobo demo 主执行路径。
  - `SmartAccount.sol` 保留为 baseline / fallback / 技术展示。
  - Pact 在 demo 前预先审批，运行时在 active pact 范围内执行。
- 已将 agent 化并入后续 checkpoint：
  - CP4：DecisionEngine + Agent B/C mock + suggestions。
  - CP5：AuditLogger + FastAPI mock API + attempts[]。
  - CP6：CAW Execution Backend + Simulator。
- 当前判断：
  - 最小可演示版新增约 6-8h。
  - 完整 Cobo demo 新增约 12-18h。
  - 为控制风险，先保证 CAW `transfer_tokens` + policy denied demo，`contract_call` swap 作为 stretch goal。

### 2026-06-01 后端编码 Checkpoint 3（完成）

- 已完成硬规则：
  - `SlippageRule`
  - `WhitelistRule`
  - `ApprovalRule`
  - `FrequencyRule`
- `FrequencyRule` 第一版使用注入式 `history` 和 `now`，统计 24 小时内同一 `to_contract` 或 `recipient` 的历史次数。
- 当前测试状态：

```bash
PYTHONPATH=agent python3 -m unittest agent/test_risk_rules.py agent/test_pipeline.py
```

```text
Ran 37 tests
OK
```

### 2026-06-01 今日收尾

- 完整后端 Python 单测通过：

```bash
PYTHONPATH=agent python3 -m unittest agent/test_intent.py agent/test_risk_rules.py agent/test_pipeline.py
```

```text
Ran 43 tests
OK
```

### 2026-06-01 后端编码 Checkpoint 2（完成）

- 已新增 `agent/risk/rules.py`，完成第一条硬规则 `AmountRule`：
  - swap：`<= 0.05 ETH` passed，`> 0.05 且 <= 0.2 ETH` confirm，`> 0.2 ETH` rejected
  - transfer：`<= 0.02 ETH` passed，`> 0.02 且 <= 0.1 ETH` confirm，`> 0.1 ETH` rejected
  - 非法金额 rejected
  - unknown action skipped
- 已新增 `agent/risk/pipeline.py`，完成 `RiskPipeline` 最小骨架：
  - 初始化时接收规则列表
  - `run(tx)` 顺序执行 `rule.check(tx)`
  - 遇到 `status == "rejected"` 时停止后续规则
  - 返回 `list[RuleResult]`
- 已新增 `agent/test_risk_rules.py` 和 `agent/test_pipeline.py`。
- 已补充 `RiskPipeline` stop-on-reject 测试。
- 当前测试状态：

```bash
PYTHONPATH=agent python3 -m unittest agent/test_intent.py agent/test_risk_rules.py agent/test_pipeline.py
```

```text
Ran 19 tests
OK
```

### 2026-05-31 后端编码 Checkpoint 1（完成）

- 已新增 `agent/models.py`，完成核心 dataclass 模型第一版：
  - `TxProposal`
  - `RuleResult`
  - `AgentResult`
  - `DecisionResult`
  - `SimulationResult`
  - `AuditRecord`
- 已在 `agent/intent.py` 新增 `proposal_from_dict()`：
  - 支持新格式 swap：`action/from_token/to_token/amount`
  - 兼容旧格式 swap：`from_amount`
  - 支持新格式 transfer：`recipient/amount`
  - 兼容旧格式 transfer：`to/amount_eth`
  - 缺字段或未知 action 时返回 `TxProposal(action="unknown", amount="0", reasoning=...)`
- 已新增 `parse_tx_proposal()`，在不破坏旧 `parse_intent()` 的情况下提供新链路：
  - `user_input -> parse_intent() -> proposal_from_dict() -> TxProposal`
- 已新增 `agent/test_intent.py`，覆盖 6 个单元测试。
- 验证命令：

```bash
PYTHONPATH=agent python3 -m unittest agent/test_intent.py
```

## 当前整体判断

- 后端/合约 MVP 约完成 30%-35%，因为 Cobo 赛道主路径和 agent retry 增加了新范围。
- 当前速度：CP3 在教练模式下完成，核心硬规则已有单测保护。
- 剩余后端/合约预计有效工时：约 24-34h；若 CAW 环境、Pact 审批、web3 / FastAPI 联调卡住，可能到 36h+。
