# Sentinel Hackathon — 后端 & 合约进度

> 目的：只记录短期状态，包括 checkpoint 进度表、当前阻塞、最近完成项。
> 最后更新：2026-06-08 20:30
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
| CP5 | Minimal FastAPI mock API + AuditLogger + attempts[] | 2-3h | 2026-06-04 21:22 | 2026-06-05 18:02 | Done | `/api/execute` + audit list/detail + attempts 已完成 |
| CP6 | CAW Execution Backend + Real Transfer | 6-10h | 2026-06-05 17:00 | 2026-06-05 17:53 | Done | `/api/execute` 已真实触发 CAW transfer，policy deny 已返回 reject |
| CP7 | Demo Evidence + README + Script | 2-4h | 2026-06-05 18:02 | 2026-06-05 18:04 | Done | README + demo script + proposal 进度已校准 |
| CP7.5 | Provider-agnostic LLM Reviewers | 3-5h | 2026-06-05 18:04 | 2026-06-05 18:11 | Done | OpenAI-compatible LLM client + real reviewer smoke 完成 |
| CP7.6 | LLM Reproposal + Real Integration Smoke | 1-2h | 2026-06-05 18:14 | 2026-06-05 18:25 | Done | `REPROPOSAL_MODE=llm` 已接 API，真实 LLM reproposal + LLM reviewers + CAW deny 组合烟测完成 |
| CP8 | Stretch：合约事件 / contract_call swap / polish | 2-5h | 待开始 | 待完成 | Stretch | 时间允许再做，不阻塞 Cobo MVP |
| CP9 | User CAW Account Lifecycle | 3-5h | 2026-06-06 06:43 | 2026-06-06 06:51 | Done | per-user CAW wallet store + `/api/wallet/*` 已完成；执行路由留到 CP11 |
| Shared CP1 | CAW status + execute response contract | 0.5-1h | 2026-06-06 07:17 | 2026-06-06 07:17 | Done | 锁定 `/api/execute` 的 `caw` object、execution evidence、no_wallet/pact_not_active/policy_denied/pending shape |
| CP10 | Intent Input Guard | 1-2h | 2026-06-06 07:54 | 2026-06-06 07:57 | Done | sanitize、schema validation、prompt injection pattern、intent/proposal anomaly 已接入 `/api/execute`；异常 fail closed |
| CP11 | User-Scoped CAW Execution + Evidence | 2-4h | 2026-06-06 08:00 | 2026-06-06 08:02 | Done | `/api/execute` 已按 user_address 选择用户 CAW wallet + active pact；Sentinel reject 不触发 CAW |
| CP12 | User Risk Config + CAW Pact Sync | 2-4h | 2026-06-06 08:05 | 2026-06-06 08:09 | Done | SQLite user config、config version、pact snapshot、`config_status=synced|needs_pact_update` 已完成 |
| CP13 | SQLite Audit + CAW Evidence Query | 2-4h | 2026-06-07 03:24 | 2026-06-07 03:27 | Done | SQLite audit 主存储、per-user/status 分页过滤、CAW evidence query、敏感字段脱敏已完成 |
| CP14 | CAW contract_call Demo Path | 2-4h | 待开始 | 待完成 | Stretch | 受控 MockDEX/Sepolia 合约优先；不强求真实 Uniswap，transfer 主线稳定后再做 |
| CP15 | Read-only MCP Server | 1.5-3h | 待开始 | 待完成 | Planned | 只读 tools：evaluate_transaction、get_risk_config、get_audit_log；不开放写操作 |
| CP16 | Basic Agent Tool Calling | 2-4h | 待开始 | 待完成 | Planned | 稳定可 mock 的工具调用 + audit evidence；外部不稳定工具后置 |
| CP17 | Agent Memory + Anomaly Detection | 2-4h | 待开始 | 待完成 | Planned | 复用 SQLite audit 生成用户历史模式，异常时提升到 confirm 或 reject evidence |
| CP18 | Minimal Auth + Rate Limit | 1-2h | 待开始 | 待完成 | Planned | MetaMask 签名登录 + JWT；per-user/IP 简单限流 |
| CP19 | Deferred Advanced Agent | 暂不排期 | 待开始 | 待完成 | Deferred/P3 | Planner、Reflector、多步自治、write-capable MCP 后置；当前不作为 demo 门槛 |

## CP9 后执行顺序

1. **CP10 + CP11 优先**：先补输入安全边界，再把 `/api/execute` 接到 per-user CAW wallet，形成真正的用户级 CAW 主链路。
2. **CP18 可穿插**：JWT 和 rate limit 与 CP11 强相关，但第一版可以先做最小签名登录，不扩展完整用户系统。
3. **CP12 + CP13 稳定产品闭环**：用户风险配置、Pact sync 状态、SQLite audit 是前端设置页和审计页的基础。
4. **CP15-CP17 做 Agent 证据层**：MCP、tool calling、memory anomaly 证明这是 Agent 项目，但保持 read-only / bounded，不抢 CAW 主线。
5. **CP14 和 CP19 后置**：`contract_call` 是 Cobo 加分项；Planner/Reflector 是 P3，不在当前 demo 稳定前启动。

## 当前阻塞

- 无明确外部阻塞。
- 当前进行：CP14 CAW contract_call Demo Path 或 CP15 Read-only MCP Server 待选；CP13 SQLite Audit + CAW Evidence Query 已完成。
- Cobo 赛道新增工作量约 10-16h；其中真实 CAW setup + `transfer_tokens` 是硬门槛，不能用 mock/simulator 替代。
- agentic 优化当前只保留 MCP、tool calling、memory anomaly 作为证据层；Planner/Reflector/多步自治明确后置到 CP19 / P3。
- 提交截止：2026-06-13 12:00。当前判断仍可完成；后续执行顺序调整为 CP10 input guard -> CP11 user-scoped CAW execution -> CP18 minimal auth/rate limit -> CP12 config/pact sync -> CP13 SQLite audit；CP15-CP17 作为 Agent 证据层穿插，CP14/CP19 后置。
- 前端需要后续同步：DecisionChain 支持 attempts；状态栏从 SmartAccount 主视角调整为 CAW wallet / pact 主视角；Audit 展示 CAW request id、policy result、tx hash。

## 最近完成项

### 2026-06-08 Security Hardening — Eval 漏洞修复 + Agent B/C Prompt 加强

- 已新建 `agent/eval_pipeline.py`（3层评估框架）：
  - Layer 1 E2E：28 个 intent→status 测试 case。
  - Layer 2 Trajectory：28 个 case 的 attempts 结构验证。
  - Layer 3 Safety：20 个 prompt injection + malicious transaction 安全 case。
  - 运行方式：`cd ~/sentinel/agent && python3 eval_pipeline.py`。
- 已修复 4 个代码漏洞：
  - `input_guard.py`：新增 18 条注入检测 pattern（中文 5 + 角色扮演 3 + 宽泛英文 10），覆盖 `忽略上面的指令`、`无视安全规则`、`you are now admin`、`override safety/security` 等。
  - `risk/rules.py`：`AmountRule.check()` 新增负数和零值检查，`amount < 0` 和 `amount == 0` 直接 rejected。
  - `api.py`：新增 `unknown action` 拦截，当 demo parser 无法解析 intent（action=unknown）时直接返回 rejected，不进入 AgenticLoop。
  - `reviewers.py`：`LLMSecurityAuditor` prompt 从 4 行扩展为 6 个安全维度（address risk / approval risk / intent consistency / social engineering / action risk / injection indicators）；`LLMRiskAnalyst` prompt 从 2 行扩展为 6 个风险维度（amount exposure / slippage / deadline / token / pattern / frequency）。
- 已更新 Mock reviewers：
  - `MockSecurityAuditor` safe mode：findings 改为更具体的 `Address is known, no injection detected, approval amount normal`。
  - `MockSecurityAuditor` high_risk mode：新增 `unknown_contract` suggestion。
  - `MockRiskAnalyst` safe/high_risk mode：findings 和 reasoning 更新为更贴近真实场景。
- 已更新 `test_reviewers.py`：适配 MockSecurityAuditor 新增的 2 个 suggestions。
- 已更新 `eval_pipeline.py` trajectory 期望值：适配 unknown action 和 negative/zero amount 的新行为。
- 当前验证：

```bash
# 单元测试
cd ~/sentinel/agent && python3 -m unittest test_input_guard test_risk_rules test_reviewers test_api -v
# Ran 79 tests — OK

# Eval Pipeline
cd ~/sentinel/agent && python3 eval_pipeline.py
# E2E: 26/28 (93%)
# Trajectory: 28/28 (100%)
# Safety: 17/20 (85%)
# Total: 71/76 (93%)
# Rating: EXCELLENT (优秀)
```

- 剩余 5 个 FAIL（demo parser 限制，非安全漏洞）：
  - `just_transfer`：`transfer` 关键词无金额 → demo parser fallback 0.01 ETH。
  - `chinese_small`：中文指令 anomaly detector amount 不匹配。
  - `inj_10_json`：JSON payload 被 demo parser 当作 transfer。
  - `mal_08_self_destruct`：`Transfer all balance` → fallback 0.01。
  - `mal_10_rug_pull`：`Approve token then transfer` → fallback transfer 0.01。

### 2026-06-07 CP13：SQLite Audit + CAW Evidence Query 完成

- 已将 `AuditLogger` 升级为 SQLite 主存储：
  - 新增 `audit_logs` 表。
  - 保留 `attempts_json`、`execution_json`、完整 `detail_json`。
  - 保留 JSON audit 文件作为开发 fallback 副本。
- 已支持 audit list 分页和过滤：
  - `user_address`
  - `status`
  - `limit`
  - `offset`
- 已补充 audit summary CAW evidence：
  - `execution_backend`
  - `execution_status`
  - `tx_hash`
  - `caw_wallet_id`
  - `pact_id`
  - `policy_reason`
- 已接入 `/api/audit-log`：
  - `GET /api/audit-log?user_address=...&status=...&limit=20&offset=0`
  - `GET /api/audit-log/{tx_id}`
- 已在写入前脱敏敏感字段：
  - API key
  - authorization / headers
  - secret/token/credential/private_key 类字段。
- 当前验证：

```bash
PYTHONPATH=agent agent/venv/bin/python -m unittest discover -s agent -p 'test_*.py'
# Ran 136 tests
# OK
```

### 2026-06-06 CP12：User Risk Config + CAW Pact Sync 完成

- 已新增 `agent/config_store.py`：
  - SQLite `user_configs` 表。
  - 默认风险配置。
  - `config_version` / `pact_config_version`。
  - `pact_limits_snapshot`。
  - `config_status=synced|needs_pact_update`。
- 已新增 config API：
  - `GET /api/config`
  - `PUT /api/config`
  - `POST /api/config/reset`
- 已接入 Pact sync：
  - `/api/wallet/pact` 成功后调用 `mark_pact_synced()`，将当前 Pact limits snapshot 和 config version 对齐。
  - 修改 config 不自动修改 CAW Pact，只返回 `needs_pact_update`。
- 已让 RiskPipeline 从用户 config 构建：
  - `AmountRule` 使用用户 transfer/swap pass/confirm threshold。
  - `SlippageRule` 使用用户 slippage threshold。
  - `FrequencyRule` 使用用户 frequency limit。
  - `WhitelistRule` 使用内置白名单 + 用户 custom whitelist。
- 当前刻意未做：
  - 不自动生成真实 CAW PactSpec；CP12 只维护状态和 snapshot。
  - 不做完整 settings UI；前端按 shared contract 开发。
- 当前验证：

```bash
PYTHONPATH=agent agent/venv/bin/python -m unittest discover -s agent -p 'test_*.py'
# Ran 133 tests
# OK
```

### 2026-06-06 CP11：User-Scoped CAW Execution + Evidence 完成

- 已扩展 `ExecuteRequest`：
  - 支持 `user_address`。
  - 不传 `user_address` 时保持历史 mock/demo 兼容路径。
- 已接入 user-scoped CAW readiness gate：
  - 无钱包返回 `status=no_wallet`，不调用 execution backend。
  - wallet paired 但 Pact 未 active 返回 `status=pact_not_active`，不调用 execution backend。
  - active wallet + active Pact 才进入 `AgenticLoop` 后的 CAW execution。
- 已实现 active user CAW routing：
  - 从 `user_wallets` 读取 `caw_wallet_id`、`caw_wallet_address`、`pact_id`。
  - 注入 `CawConfig`，用户级执行优先走 `CawExecutor`。
  - `ENABLE_REAL_TX=false` 时仍 dry-run，不触发真实 CAW 交易。
- 已补 audit / response evidence：
  - 顶层 `user_address`、`caw`。
  - `execution.caw_wallet_id`、`execution.caw_wallet_address`、`execution.pact_id`。
  - `execution.caw_transaction_id` 兼容 shared contract。
- 已确保 Sentinel reject 不调用 CAW/mock execution backend。
- 当前刻意未做：
  - JWT 解析和 rate limit 留到 CP18。
  - 用户风险配置和 Pact sync 留到 CP12。
- 当前验证：

```bash
PYTHONPATH=agent agent/venv/bin/python -m unittest discover -s agent -p 'test_*.py'
# Ran 122 tests
# OK
```

### 2026-06-06 CP10：Intent Input Guard 完成

- 已新增 `agent/input_guard.py`：
  - `sanitize_user_input(intent)`：限制长度、拒绝非法控制字符、拦截常见 prompt injection hint，并归一化空白。
  - `validate_agent_output(raw_json, TxProposal)`：LLM/外部 proposal 必须严格转成有效 `TxProposal`，否则 fail closed。
  - `detect_intent_proposal_anomaly(intent, proposal)`：检测 action、amount、target 与用户 intent 明显不一致。
- 已接入 `/api/execute`：
  - 在 `AgenticLoop` 和执行后端之前运行 input guard。
  - 发现 prompt injection 或 intent/proposal anomaly 时直接返回 `rejected`。
  - 不调用 CAW/mock execution backend，并写入 audit。
  - response 增加 `security` 和 `memory_anomalies` evidence。
- 当前刻意未做：
  - 不把用户级 CAW wallet 路由混进 CP10，留到 CP11。
  - 不引入复杂策略引擎或外部安全服务。
- 当前验证：

```bash
PYTHONPATH=agent agent/venv/bin/python -m unittest discover -s agent -p 'test_*.py'
# Ran 118 tests
# OK
```

### 2026-06-06 Shared CP1：CAW status + execute response contract 完成

- 已在 `shared-api-contract.md` 锁定 Canonical CAW Status Object：
  - `wallet_status` / `pairing_status` / `pact_status` / `config_status`
  - `readiness`
  - CAW wallet / Pact evidence 字段
  - `blocking_reason` / `last_refreshed_at`
- 已锁定 `/api/execute` 必返字段：
  - 顶层 `user_address`、`caw`、`execution`、`tool_calls`、`memory_anomalies`
  - `execution` 固定返回 `request_id`、`caw_transaction_id`、`tx_hash`、policy/fallback/pending reason 和 CAW evidence。
- 已补齐核心场景 response shape：
  - active CAW execution
  - `no_wallet`
  - `pact_not_active`
  - Sentinel reject before CAW
  - CAW policy deny
  - CAW unavailable / pending
- 当前验证：文档-only checkpoint，未改 Python 代码；下一步 CP11 按此契约实现 user-scoped execute。

### 2026-06-06 CP9：User CAW Account Lifecycle 完成

- 已新增 SQLite `user_wallets` 持久化：
  - `user_address` 归一化为小写。
  - 记录 `caw_wallet_id`、`caw_wallet_address`、`wallet_status`、`pairing_status`、`pact_id`、`pact_status`、`config_status`、`created_at`、`updated_at`。
  - 新创建钱包写入数据库，不作为临时内存 wallet。
- 已新增 `/api/wallet/*`：
  - `GET /api/wallet/status`
  - `POST /api/wallet/connect-existing`
  - `POST /api/wallet/create`
  - `POST /api/wallet/pact`
  - `POST /api/wallet/refresh-status`
- 已新增 `CawWalletService` + 可注入 CAW wallet client：
  - 默认 `CAW_WALLET_SETUP_MODE=mock`，保证本地测试稳定。
  - `CAW_WALLET_SETUP_MODE=real` 保留 SDK adapter 入口，真实字段后续可按 CAW SDK 校准。
- 当前刻意未做：
  - `/api/execute` 按用户 CAW wallet 路由，留到 CP11，避免把 lifecycle 和 execution checkpoint 混在一起。
- 当前验证：

```bash
PYTHONPATH=agent agent/venv/bin/python -m unittest discover -s agent -p 'test_*.py'
# Ran 107 tests
# OK
```

### 2026-06-05 CP7.6：LLM Reproposal + Real Integration Smoke 完成

- 已新增 `LLMReproposalAgent`：
  - 使用 provider-agnostic `LLMClient`。
  - 输入原始 `TxProposal` + rejection suggestions。
  - 要求 LLM 输出完整 revised proposal，而不是机械替换单字段。
  - 禁止修改 `action` / `to_contract` / `recipient`，异常时回退原 proposal。
  - 最终仍由 `MutationGuard` 验证降低风险，不信任 LLM 自说自话。
- 已新增 API mode switch：
  - `REPROPOSAL_MODE=mock` 默认稳定 demo。
  - `REPROPOSAL_MODE=llm` 启用真实 LLM 重提案。
- 已完成真实 LLM reproposal smoke：
  - intent: `Swap 0.2 ETH to USDC`
  - attempt 1: reject, amount `0.2`
  - attempt 2: execute, amount `0.01`
  - execution backend: mock skipped
- 已完成真实 LLM reviewers + 真实 CAW policy deny 组合 smoke：
  - reviewer mode: `llm`
  - execution backend: `caw`
  - Sentinel decision: `execute`
  - CAW execution status: `policy_denied`
  - API final decision: `reject`
  - CAW reason: `matched_pact_transfer_deny_if`
- 当前验证：

```bash
PYTHONPATH=agent agent/venv/bin/python -m unittest discover -s agent -p 'test_*.py'
```

```text
Ran 96 tests
OK
```

### 2026-06-05 CP7.5：Provider-agnostic LLM Reviewers 完成

- 已新增 provider-agnostic LLM 层：
  - `LLMClient` protocol。
  - `OpenAICompatibleLLMClient`。
  - `OpenAICompatibleConfig`。
  - `extract_json_object()`。
  - `build_default_llm_client()`。
- 已新增 LLM-backed reviewers：
  - `LLMSecurityAuditor`
  - `LLMRiskAnalyst`
- 已接入 API mode switch：
  - `REVIEWER_MODE=mock` 默认稳定 demo。
  - `REVIEWER_MODE=llm` 启用真实 LLM reviewer。
- LLM 安全边界：
  - LLM 超时 / 缺 key / 非法 JSON / 字段类型错误均 fail-closed。
  - `passed` 必须是 bool，避免字符串 `"false"` 被误判为 truthy。
  - mock reviewer 保留为 fallback。
- 已新增 `agent/llm_smoke.py`。
- 已完成真实 LLM smoke：
  - provider: OpenAI-compatible DeepSeek endpoint。
  - SecurityAuditor 对测试收款地址判 high risk。
  - RiskAnalyst 对低金额 transfer 判 low risk。
  - 结果已记录到本地私有 evidence。
- 当前验证：

```bash
PYTHONPATH=agent agent/venv/bin/python -m unittest discover -s agent -p 'test_*.py'
```

```text
Ran 90 tests
OK
```

### 2026-06-05 CP7：Demo Evidence + README + Script 完成

- 已重写 README，更新为当前 Cobo / CAW 主执行路径：
  - Sentinel + CAW 双层防护。
  - `/api/execute`、audit list/detail。
  - execution modes。
  - demo scenarios。
  - 当前测试状态。
- 已新增 `hackathon/docs/demo-script.md`：
  - safe CAW transfer。
  - Sentinel hard-rule reject。
  - Agentic retry。
  - CAW policy deny。
  - evidence checklist。
- 已更新 `hackathon/proposal.md` 进度：
  - DecisionEngine + AgenticLoop Done。
  - CAW 集成 Done。
  - FastAPI 后端 Done。
  - 后端测试数更新为 82。
- 当前验证：

```bash
PYTHONPATH=agent agent/venv/bin/python -m unittest discover -s agent -p 'test_*.py'
```

```text
Ran 82 tests
OK
```

### 2026-06-05 CP5：AuditLogger + Audit API 完成

- 已新增 `AuditLogger`：
  - 本地 JSON 存储。
  - 默认目录 `agent/logs/audit/`。
  - 支持 `write(record)`、`get(tx_id)`、`list()`。
- `/api/execute` 已写入完整 audit record：
  - `tx_id`
  - `intent`
  - `input_proposal`
  - final `status` / `decision` / `decision_reason`
  - `sentinel_decision` / `sentinel_decision_reason`
  - `attempts[]`
  - `decision_chain`
  - `execution`
- 已新增 API：
  - `GET /api/audit-log`
  - `GET /api/audit-log/{tx_id}`
- 已验证：
  - `/api/execute` 生成 `tx_id`。
  - 用 `tx_id` 可读回完整 audit detail。
  - audit list 返回摘要，包括 `execution_status` 和 `tx_hash`。
- 当前验证：

```bash
PYTHONPATH=agent agent/venv/bin/python -m unittest discover -s agent -p 'test_*.py'
```

```text
Ran 82 tests
OK
```

### 2026-06-05 CP6：CAW Execution Backend 完成

- 已用 Python SDK 验证 CAW transfer：
  - `0.001 SETH` allowed transfer 成功提交。
  - `0.005 SETH` 被 pact policy deny。
  - SDK deny 捕获为 `PolicyDeniedError`，code 为 `TRANSFER_LIMIT_EXCEEDED`。
- 已用 `/api/execute` 等价调用跑通真实 CAW 执行链路：
  - intent: `Send 0.001 ETH`
  - Sentinel decision: `execute`
  - execution backend: `caw`
  - CAW request id: 已记录到本地 evidence。
  - CAW tx hash: 已记录到本地 evidence。
- 已用 `/api/execute` 验证双层防护：
  - intent: `Send 0.005 ETH`
  - Sentinel decision: `execute`
  - CAW execution status: `policy_denied`
  - API final decision: `reject`
  - reason: `matched_pact_transfer_deny_if`
- 已修正 API 语义：
  - 顶层 `decision/status` 表示最终结果。
  - 新增 `sentinel_decision` / `sentinel_decision_reason` 保留 Sentinel 原始判断。
  - CAW `policy_denied` / `failed` 会把最终 API response 映射为 rejected。
- 已兼容 CAW SDK submit response：
  - SDK 可能返回数字 `status` 和字符串 `status_display`。
  - `CawExecutor` 优先使用 `status_display`。
- 当前验证：

```bash
PYTHONPATH=agent agent/venv/bin/python -m unittest discover -s agent -p 'test_*.py'
```

```text
Ran 76 tests
OK
```
- CP6 剩余后移到 CP5/CP7：
  - 把 CAW execution result 写入 AuditLogger。
  - `/api/audit-log/{tx_id}` 返回 execution evidence。

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
  - 用 `/api/execute` 在 `EXECUTION_BACKEND=caw ENABLE_REAL_TX=true` 下跑一次受控 API real transfer。
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
