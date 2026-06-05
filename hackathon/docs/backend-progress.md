# Sentinel Hackathon — 后端 & 合约进度

> 目的：只记录短期状态，包括 checkpoint 进度表、当前阻塞、最近完成项。
> 最后更新：2026-06-05 17:00
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
| CP4a | DecisionEngine + Agent B/C mock + suggestions | 已完成 | 2026-06-02 00:13 | 2026-06-02 21:41 | Done | 53 个单元测试通过 |
| CP4b | ReproposalAgent + MutationGuard | 1.5-2.5h | 2026-06-04 00:21 | 2026-06-04 21:06 | Done | 11 个 reproposal 单元测试通过 |
| CP4c | AgenticLoop + in-memory attempts | 1.5-2.5h | 2026-06-04 21:06 | 2026-06-04 21:06 | Done | 4 个 loop 单元测试通过，attempts 先存在返回值 |
| CP4.5 | CAW Setup Spike | 1-3h | 2026-06-05 16:16 | 2026-06-05 16:37 | Done | CAW wallet/pact/policy deny/allowed transfer 已验通 |
| CP5 | Minimal FastAPI mock API + AuditLogger + attempts[] | 2-3h | 2026-06-04 21:22 | 待完成 | In Progress | 最小 `/api/execute` 已完成；AuditLogger / detail API 待补 |
| CP6 | CAW Execution Backend + Real Transfer | 6-10h | 2026-06-05 17:00 | 待完成 | In Progress | 执行层骨架 + dry-run/mock/policy-denied 单测已完成 |
| CP7 | Demo Evidence + README + Script | 2-4h | 待开始 | 待完成 | Todo | CAW evidence checklist + 3-5 分钟 demo script |
| CP7.5 | Provider-agnostic LLM Reviewers | 3-5h | 待开始 | 待完成 | Todo | OpenAI-compatible client + real Agent B/C，mock 保留 fallback |
| CP8 | Stretch：合约事件 / contract_call swap / polish | 2-5h | 待开始 | 待完成 | Stretch | 时间允许再做，不阻塞 Cobo MVP |

## 当前阻塞

- 无明确外部阻塞。
- 当前进行：CP6 CAW Execution Backend；CP4.5 已确认真实 CAW deny 和 allowed transfer 路径。
- Cobo 赛道新增工作量约 10-16h；其中真实 CAW setup + `transfer_tokens` 是硬门槛，不能用 mock/simulator 替代。
- agentic 优化新增约 3-5h，主要集中在 ReproposalAgent、MutationGuard 和 loop 测试。
- 提交截止：2026-06-13 12:00。当前判断仍可完成；执行顺序调整为 CP6 real transfer -> CP5 Audit detail -> CP7 evidence/script -> CP7.5 real LLM reviewers -> CP8 stretch。
- 前端需要后续同步：DecisionChain 支持 attempts；状态栏从 SmartAccount 主视角调整为 CAW wallet / pact 主视角；Audit 展示 CAW request id、policy result、tx hash。

## 最近完成项

### 2026-06-05 CP6 CAW Execution Backend 起步

- 已新增 execution backend 第一版：
  - `ExecutionResult`
  - `ExecutionBackend` protocol
  - `MockExecutionBackend`
  - `CawConfig`
  - `CawExecutor`
- `/api/execute` 已接执行层：
  - `decision != execute` 时 execution 返回 `skipped`。
  - `swap` 暂不执行，execution 返回 `skipped`。
  - `transfer` 在 mock backend 下返回 `dry_run`。
  - `EXECUTION_BACKEND=caw` 且 `ENABLE_REAL_TX=false` 时返回 CAW dry-run payload。
- `CawExecutor` 已按官方 SDK 方向预留真实调用：
  - `WalletAPIClient`
  - `get_pact(COBO_PACT_ID)`
  - pact-scoped API key
  - `transfer_tokens(...)`
  - `request_id=sentinel-<tx_id>` 防重复提交
  - policy denial 统一映射为 `status="policy_denied"`
- 已新增执行层单测：
  - mock dry-run。
  - CAW dry-run 不创建 client。
  - mocked CAW success 映射 `succeeded` / tx hash。
  - mocked CAW policy denied 映射 `policy_denied`。
- 当前验证：

```bash
PYTHONPATH=agent python3 -m unittest discover -s agent -p 'test_*.py'
```

```text
Ran 74 tests
OK
```
- CP6 剩余：
  - 安装/验证 `cobo-agentic-wallet` Python SDK。
  - 在 `EXECUTION_BACKEND=caw ENABLE_REAL_TX=true` 下跑一次受控 API real transfer。
  - 把 CAW execution result 写进 audit/detail API。

### 2026-06-05 真实 LLM 调用计划确认

- 已确认 2026-06-13 12:00 前仍有时间补真实 LLM 调用。
- 计划不绑定 DeepSeek 单一厂商，改为 provider-agnostic：
  - `LLMClient` 抽象。
  - 第一版 `OpenAICompatibleLLMClient`。
  - 支持通过 env 切换 DeepSeek / OpenAI / Qwen / Moonshot 等 OpenAI-compatible provider。
- 新增 CP7.5：
  - 先补 `LLMSecurityAuditor` / `LLMRiskAnalyst`。
  - mock reviewer 保留为 fallback。
  - LLM 超时、非法 JSON、字段缺失默认 reject。
  - 时间允许再补 `LLMReproposalAgent`，但输出必须经过 `MutationGuard`。
- 已更新 `agent/.env.example`，补：
  - `REVIEWER_MODE`
  - `REPROPOSAL_MODE`
  - `LLM_PROVIDER`
  - `LLM_BASE_URL`
  - `LLM_API_KEY`
  - `LLM_MODEL`
  - `LLM_TIMEOUT_SECONDS`
  - `LLM_TEMPERATURE`

### 2026-06-05 CP4.5 CAW Setup Spike 起步

- CP4.5 结果更新：
  - CAW wallet 已 active。
  - 已提交 transfer pact，pact status 为 `active`。
  - 已验证 CAW policy deny：
    - `0.005 SETH` 被 pact `deny_if.amount_gt=0.002` 拒绝。
    - code: `TRANSFER_LIMIT_EXCEEDED`
    - reason: `matched_pact_transfer_deny_if`
  - 已验证 CAW allowed transfer：
    - `0.001 SETH` 被 CAW 接受并完成。
    - status: `Success`
    - sub_status: `completed`
    - tx hash 已记录到本地私有 evidence。
  - 已将私有 smoke test 证据记录到 `hackathon/evidence/caw/caw-smoke-test.md`，该目录已加入 `.gitignore`。
- CP6 注意：
  - `caw tx transfer` 本地 smoke test 需要显式 `--src-address`；后续 SDK 接入优先显式传 `src_addr`。

- 已查阅官方 CAW 文档，确认 CP4.5/CP6 主路径：
  - CLI 负责 install、onboard、pair、faucet、pact submit/status、transfer smoke test。
  - Python SDK 后续用 `WalletAPIClient` 接 `submit_pact`、`get_pact`、`transfer_tokens`。
  - Pact transfer policy 使用 `when` allowlist + `deny_if.amount_gt`，默认 fail-closed。
- 已下载并检查官方 install script 到 `/tmp/caw-install.sh`：
  - 安装到 `~/.cobo-agentic-wallet`。
  - 默认 symlink 到 `~/.local/bin/caw`。
  - 不自动 onboard、不提交 pact、不操作资金。
- 已新增 `hackathon/docs/caw-setup.md`：
  - install/onboard/pair/faucet/credentials/pact/transfer smoke test 操作步骤。
  - 明确哪些步骤需要用户手动执行。
  - 明确 CP6 所需 env 和 evidence checklist。
- 已更新 `agent/.env.example`，补 CAW / execution backend env 模板。
- 当前阻塞：
  - 等待用户确认并手动执行 `bash /tmp/caw-install.sh`。
  - 等待 CAW app pairing 和 pact owner approval。

### 2026-06-04 CP5 最小 API 起步

- 已新增 FastAPI app：
  - `GET /health`
  - `POST /api/execute`
- `/api/execute` 当前最小行为：
  - 接收 `{ "intent": "..." }` 或 `{ "proposal": {...} }`。
  - 使用 deterministic demo parser，不调用 DeepSeek。
  - 串起 `AgenticLoop`，返回 `status`、`decision`、`decision_reason`、`attempts`、`decision_chain`、`execution`。
  - `execution.status = "not_submitted"`，明确 CP5 最小 API 还不提交 CAW 交易。
- 当前验证：

```bash
PYTHONPATH=agent python3 -m unittest discover -s agent -p 'test_*.py'
```

```text
Ran 69 tests
OK
```

### 2026-06-04 CP4b/CP4c：Reproposal + AgenticLoop

- 已完成 `MockReproposalAgent`：
  - 按 `rejection_code` 处理 `amount_too_high`、`slippage_too_high`、`deadline_too_long`。
  - `unknown_contract` 默认不自动改合约，避免绕过 whitelist。
- 已完成 `MutationGuard`：
  - amount 至少降低 30%。
  - slippage 必须降低。
  - deadline 必须缩短。
  - `to_contract` 不允许在 reproposal 中被偷改。
- 已完成 `AgenticLoop` 第一版：
  - 串起 `RiskPipeline`、Agent B/C mock、`DecisionEngine`、`ReproposalAgent`、`MutationGuard`。
  - 支持最多 2 次 retry。
  - 每轮返回 in-memory `AttemptRecord`，供 CP5 API / AuditLogger 复用。
  - hard rule reject 不调用 reviewer，不触发 retry。
- 当前验证：

```bash
PYTHONPATH=agent python3 -m unittest discover -s agent -p 'test_*.py'
```

```text
Ran 66 tests
OK
```

### 2026-06-03 Solo MVP 计划重排

- 已将后续工作按 solo + Cobo 硬规则重新编排：
  - CP4a：DecisionEngine + Agent B/C mock + suggestions，已完成。
  - CP4b：ReproposalAgent + MutationGuard。
  - CP4c：AgenticLoop + in-memory attempts。
  - CP4.5：CAW Setup Spike，提前验证 CLI/SDK/wallet/pact。
  - CP5：Minimal `/api/execute` + attempts/execution shape。
  - CP6：真实 CAW `transfer_tokens`。
  - CP7：CAW evidence checklist + README + demo script。
  - CP8：contract_call swap / 合约事件 / polish，全部降为 stretch。
- 优先级确认：
  - P0：CAW setup、transfer-first、CAW evidence checklist。
  - P1：minimal API、demo script、SmartAccount 明确降级。
  - P2：DeepSeek Agent B/C 后移、失败预案、前端证据展示。

### 2026-06-02 CP4 Step 1：rejection_code 补齐

- 已完成：
  - `Suggestion` 增加 `rejection_code`。
  - mock Agent B/C 的 suggestions 补齐 `amount_too_high` / `slippage_too_high`。
  - reviewer 相关测试补齐 rejection code 断言，DecisionEngine 继续负责透传 suggestions。
- 当前验证：

```bash
PYTHONPATH=agent python3 -m unittest agent/test_reviewers.py agent/test_decision.py agent/test_intent.py agent/test_risk_rules.py agent/test_pipeline.py
```

```text
Ran 53 tests
OK
```

- 暂停点：
  - 下一步进入 `MockReproposalAgent`，按 `rejection_code` 重新生成 revised `TxProposal`。
  - 随后实现 `MutationGuard`，用 `Decimal` 验证 amount 至少降低 30%。

### 2026-06-02 Cobo 规则硬约束校准

- 已确认：Cobo 赛道不接受纯概念 / 纯 mockup，Agent 资金相关操作必须通过 CAW 完成。
- 计划调整：
  - CP6 从 “CAW simulator 可演示” 调整为 “真实 CAW `transfer_tokens` 是 MVP gate”。
  - CP5 缩小为最小 FastAPI：优先 `/api/execute`、attempts、execution shape，完整 API surface 后补。
  - CAW mock / simulator 只作为开发 fallback，不作为 Cobo demo 主验收路径。
- Demo 必须至少展示：
  - CAW wallet address。
  - active pact。
  - 一条真实 CAW safe transfer 的 request/transaction id。
  - 一条 Sentinel reject 不触发 CAW。
  - 一条 CAW policy deny 展示双层防护。

### 2026-06-02 Agentic + CAW 范围校准

- 已将 Hermes 审查后的 agentic 方案并入 `backend-plan.md`：
  - `Suggestion` 后续增加 `rejection_code`。
  - `SuggestionApplier` 不做机械字段替换，改为 `ReproposalAgent` 重新生成 revised `TxProposal`。
  - `MutationGuard` 使用确定性规则验证 revised proposal 是否真实降低风险。
  - amount 使用 `Decimal` 比较，且 `amount_too_high` 至少降低 30%。
  - `unknown_contract` 默认不自动修，除非 revised contract 已在 allowlist。
  - CP4/CP5 不做多笔拆单，保持单笔 `TxProposal`。
- 截止时间判断：
  - 距离 2026-06-13 12:00 仍有约 10 天以上。
  - 后端/合约剩余有效工作量约 23-35h。
  - 若 CAW setup 不在 CP6 前卡住，MVP 可完成。
- MVP 优先级：
  - 必做：AgenticLoop、attempts audit、Minimal FastAPI mock API、真实 CAW `transfer_tokens`、CAW policy deny demo。
  - Stretch：CAW `contract_call` swap、tool_calls/observations、多笔拆单。

### 2026-06-02 CP4 中途收尾

- 已完成并提交：
  - `Suggestion` 数据模型。
  - `AgentResult.suggestions` 与 `DecisionResult.suggestions`。
  - `DecisionEngine` skeleton。
  - `agent/test_decision.py` 组合测试。
- 当前验证：

```bash
PYTHONPATH=agent python3 -m unittest agent/test_decision.py agent/test_intent.py agent/test_risk_rules.py agent/test_pipeline.py
```

```text
Ran 49 tests
OK
```

- 睡醒后下一步：
  - 新增 `agent/reviewers.py`。
  - 新增 `agent/test_reviewers.py`。
  - mock `MockSecurityAuditor` / `MockRiskAnalyst`，先支持 `safe` 和 `high_risk` 两种模式。

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
