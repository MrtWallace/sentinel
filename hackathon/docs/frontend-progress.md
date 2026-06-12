# Sentinel 前端进度记录

> 最后更新：2026-06-12 20:29

## 进度记录约定

- 每次开始一个前端 checkpoint 时，默认更新“进度跟踪”表的开始时间、状态和备注。
- 每次结束一个前端 checkpoint 或准备提交前，默认更新完成时间、状态、测试结果和“当前进度详情”。
- 时间戳统一使用北京时间（Asia/Shanghai），精确到分钟，格式为 `YYYY-MM-DD HH:MM`。
- 历史 checkpoint 如果当时没有记录到分钟，明确标注“规则建立前未记录分钟”，不补造精确时间。
- 除非前端计划本身发生变化，否则只更新本文件，不更新 `frontend-plan.md`。

## 进度跟踪

当前前端开发分支：`feature/frontend-risk-console`。

| Checkpoint | 内容 | 预计工时 | 开始时间 | 完成时间 | 状态 | 备注 |
|---|---|---:|---|---|---|---|
| CP0 | 现有前端基线确认 | 0.5-1h | 2026-05-31（规则建立前未记录分钟） | 2026-05-31（规则建立前未记录分钟） | Done | 结果见 `hackathon/docs/frontend-checkpoint-0.md` |
| CP0.5 | Stitch 风格 UI skeleton | 2-4h | 2026-05-31（规则建立前未记录分钟） | 2026-06-01（规则建立前未记录分钟） | Done | 已合并到本地 `main`，提交 `59f6ef0 feat(frontend): add sentinel UI skeleton` |
| CP1 | 类型、mock 数据、API 封装 | 1-2h | 2026-06-01（规则建立前未记录分钟） | 2026-06-01（规则建立前未记录分钟） | Done | 数据层位于 `frontend/packages/nextjs/lib/sentinel/`；体验验收后移到 CP3 |
| CP2 | 真实链上状态栏接入 | 1-2h | 2026-06-01（规则建立前未记录分钟） | 2026-06-01（规则建立前未记录分钟） | Code Done / QA Pending | 类型检查和 lint 通过；用户浏览器已能加载页面，仍需补一次状态栏视觉确认 |
| CP3 | 首页执行控制台接入 mock API | 2-4h | 2026-06-01 16:44 | 2026-06-01 16:56 | Code Done / Auto Screenshot Passed / User QA Pending | `executeIntent` 已接入；成功、拦截、确认状态可点击触发；WSL Playwright 截图可用，Codex in-app browser 仍受本地 sandbox 影响 |
| CP4 | `confirm_needed` 与错误态 | 2-3h | 2026-06-02 04:44 | 2026-06-02 04:58 | Code Done / User QA Pending | Approve / Reject mock 确认流已接入；网络、超时、执行失败错误文案已分类处理；已修复 safe swap 被误判为 blocked 的 QA bug |
| CP4.5 | 后端契约重新对齐 | 1-2h | 2026-06-04 22:02 | 2026-06-04 22:36 | Code Done / CLI QA Partial | 已对齐 minimal `/api/execute`、`attempts[]`、`execution`、CAW evidence、更新 presets；typecheck/lint 通过；3000 端口 CLI 请求仍超时 |
| CP5 | Audit 页接入 mock/API | 2-3h | 2026-06-05 21:35 | 2026-06-05 22:04 | Code Done / Browser Reachable / User QA Pending | 点击行展开 attempts timeline + execution evidence；展开区复用 `DecisionChain` |
| CP5.5 | 后端联调接入 | 1-2h | 2026-06-05 22:38 | 2026-06-05 22:56 | Code Done / Backend Proxy Verified / User QA Pending | 已对接后端 `/api/audit-log`、`/api/audit-log/{tx_id}`、`/api/confirm`，复核 execute contract |
| CP6 | 前端理解层 | 2-4h | 待开始 | 待开始 | Deferred / Post-MVP | `frontend-implementation-guide.md` + `/frontend-map`；按用户要求顺延，不阻塞前端 MVP |
| CP7 | 验证与小修 | 1-3h | 2026-06-05 23:05 | 2026-06-05 23:27 | MVP Code Done / Build Passed / User QA Pending | CP6 顺延；前端 MVP 已完成真实后端 smoke、typecheck、lint、build |
| CP7.1 | MVP quick wins | 0.5h | 2026-06-05 23:53 | 2026-06-06 00:03 | Code Done / QA Pending | 修复 info panel 空态、状态标签、死代码、textarea aria、global paragraph margin，并补轻量移动端状态栏/Audit 表格适配 |
| CP8 | Shared Contract / Docs 对齐 | 1-2h | 2026-06-07 03:49 | 2026-06-07 03:58 | Code Done / Tests Passed | 已对齐 CAW wallet lifecycle、risk config、tool/memory evidence 类型、mock、mapper、API wrapper 和 Next proxy routes |
| CP9 | CAW Account Lifecycle UI | 2-4h | 2026-06-07 03:58 | 2026-06-07 04:41 | Code Done / Build + HTTP Smoke Passed | CAW Account 改为顶部连接钱包式二级菜单；首屏不再占用 Intent Workbench 空间 |
| CP10 | Intent Input Guard UX | 1-2h | 2026-06-07 05:15 | 2026-06-07 05:25 | Code Done / Tests Passed | 前端输入校验：长度限制(500)、控制字符、prompt injection 提示；后端 security rejection 展示 |
| CP11 | Settings Page + Pact Sync Status | 2-4h | 2026-06-07 09:11 | 2026-06-07 09:37 | Code Done / Build + Screenshot Passed | Settings 页面、config save、Pact sync warning、左侧 Settings 导航已完成 |
| CP12 | CAW Evidence Audit + Policy Deny Visual | 2-4h | 2026-06-07 08:45 | 2026-06-07 09:37 | Code Done / Build + Screenshot Passed | Audit user/status/page 控制和 CAW policy deny 证据展示已完成 |
| CP13.5 | Judge Landing Polish + Evidence Panel | 1-2h | 2026-06-12 04:30 | 2026-06-12 04:57 | Code Done / Build + HTTP Smoke Passed | 首页首屏对齐 CP14：真实 CAW swap preset、执行流、证据面板和 CAW Pact 边界说明 |
| CP14 | Decision Chain Expandable Details | 1-2h | 2026-06-12 05:19 | 2026-06-12 14:33 | Code Done / Build + Browser QA Passed | Decision Chain steps default collapsed; tool-use, memory anomaly, execution details, 5-rule swap checks, and retry attempts are expandable |

当前整体判断：

- 前端 MVP 约完成 70%-75%，首页执行控制台、确认流、CAW/attempts 后端契约对齐、Audit 页展开/收起、输入校验已完成。
- CP10 已完成输入校验 UX（长度限制、控制字符、prompt injection warning）和 Run 按钮 disabled 逻辑。
- Audit 行已支持展开/收起 toggle。
- dev server 运行中（需确认端口 3000 上是最新进程，否则浏览器刷新拿到旧代码）。
- 后端 FastAPI 已在 `http://127.0.0.1:8000` 启动。
- Current checkpoint: CP14 code is implemented and verified with typecheck, lint, production build, HTTP smoke, and Playwright browser QA.
- Backend evidence sync: CP16/CP17 live backend data now maps into Decision Chain details; browser QA verified Agent B/C tool calls and memory anomaly confirmation display.

## 当前进度详情

### 2026-06-12 API user binding 与 CAW Pact Deny Demo Evidence 修复

- 完成时间：2026-06-12 20:29。
- 修复内容：
  - README API 示例把 `user_address` 改为本地 demo bound user：`0x1111111111111111111111111111111111111111`。
  - README 新增说明：`user_address` 是 Sentinel 本地 user/binding identifier；CAW wallet address 才是真实 Cobo Agentic Wallet 执行钱包。
  - Demo Evidence 中继续保留真实 CAW wallet：`0x927f175c85d61237f817b499f739336b498384fe`，未改 tx hash 或 CAW evidence。
  - 首页 `CAW Pact Deny` preset 在当前 live run 被 memory anomaly 截获为 `confirm_needed` 时，右栏改为展示已记录的 `Demo Evidence — recorded CAW Pact denial`，并明确显示 `execution backend: caw`、`execution status: policy_denied`、`matched_pact_transfer_deny_if` 和 CAW Pact hard boundary note。
  - 未改真实 CAW 执行代码；Prompt Injection、Agentic Retry、Real CAW Swap 行为保持原状。
- 验证结果：
  - Playwright 回归通过：覆盖 Real CAW Swap、CAW Pact Deny recorded evidence、Prompt Injection、切回 Real CAW Swap、Manual review。
  - `yarn workspace @se-2/nextjs check-types` passed。
  - `yarn workspace @se-2/nextjs lint` passed。
  - `yarn workspace @se-2/nextjs build` passed；保留既有 Wallet/RainbowKit dependency warnings。
  - `git diff --check` passed。

### 2026-06-12 首页 Chain Evidence 右栏二次修复

- 完成时间：2026-06-12 19:17。
- 修复内容：
  - 右侧 `Chain Evidence` 状态 badge 不再固定使用绿色；`Executed` 使用成功色，`Rejected` 使用红色，`Manual review` 使用 amber。
  - `Rejected` 场景新增 `Reject Reason` 行，直接展示 Sentinel / CAW 返回的拒绝原因。
  - `Real CAW Swap` 在当前后端 `ENABLE_REAL_TX=false` 的 dry-run 响应下，仍显示 CP14 已记录的真实 demo evidence，并新增 `Evidence Source: CP14 demo evidence`，避免把 demo tx 伪装成当前 live tx。
  - 右栏长地址、tx hash 和拒绝原因改为可换行显示，避免窄栏截断关键信息。
- 验证结果：
  - Playwright 回归通过：验证 `Executed` / `Rejected` / `Manual review` 三种右栏状态切换、rejected reason、以及从 rejected 切回 `Real CAW Swap` 后 demo evidence 不丢失。
  - `yarn workspace @se-2/nextjs check-types` passed。
  - `yarn workspace @se-2/nextjs lint` passed。
  - `yarn workspace @se-2/nextjs build` passed；保留既有 Wallet/RainbowKit dependency warnings。
  - `python3 -m unittest discover -v` in `agent/` passed：320 tests OK。

### 2026-06-12 首页 Chain Evidence 状态切换修复

- 完成时间：2026-06-12 18:49。
- 修复内容：
  - 右侧 `Chain Evidence` badge 不再固定显示 `Current result`，会根据当前响应显示 `Executed`、`Rejected`、`Manual review`、`Failed`。
  - 配合后端修复，`Real CAW Swap` 和 `Agentic Retry` 不再因为 frequency-only memory evidence 被误显示为 `Manual review`。
- 验证结果：
  - Next proxy 验证：`Swap 0.0005 ETH to USDC` 与 `Swap 0.2 ETH to USDC` 返回 `status=executed / decision=execute / execution=dry_run`。
  - Playwright 验证右侧栏三种状态：`Executed`、`Rejected`、`Manual review`。
  - `yarn workspace @se-2/nextjs check-types` passed。
  - `yarn workspace @se-2/nextjs lint` passed。
  - `yarn workspace @se-2/nextjs build` passed；保留既有 Wallet/RainbowKit dependency warnings。

### 2026-06-12 前端 Checkpoint 14：Decision Chain Expandable Details

- 开始时间：2026-06-12 05:19。
- Current status: Code Done / Build + Browser QA Passed.
- 目标：
  - Decision Chain 每步默认 collapsed，点击 header 展开/收起详情。
  - Agent A target 支持长文本换行，不再截断 `CAW contract_call → Uniswap V3 SwapRouter`。
  - 展开区展示 tool-use evidence；后端未返回时 graceful degradation。
  - Agent C 风险审查内展示 memory anomaly。
  - Agentic Retry 的 attempts 支持点击展开，能查看第一轮失败、suggestion、hard rules 和 Agent B/C review。
- 已完成：
  - `DecisionChain.tsx` 增加 collapsed `StepBlock`、tool call 展示、memory anomaly 面板、execution detail 摘要。
  - `AttemptCard` 改为可展开详情，默认收起，避免只看到最后成功案例。
  - `DataPoint` 改为 `break-words`，长 target 可完整显示。
  - `mockData.ts` 为真实 CAW swap 和 Agentic Retry 增加 tool/memory evidence，并补齐 Real CAW Swap 的 5 条 CP14 hard rules：Amount、Slippage、Whitelist、Approval、Frequency。
  - CP13.5 右列 `Chain Evidence` 补充 submitted 状态、swap wrap/approve/swap sub-tx 折叠、Etherscan/Blockscout 链接。
  - Hero 内 `Execution Flow` 改名为 `End-to-end Flow`，明确它是高层 demo path，不替代 Decision Chain。
- Verification:
  - `yarn workspace @se-2/nextjs check-types` passed.
  - `yarn workspace @se-2/nextjs lint` passed with no warnings after a small `settings/page.tsx` prettier-only cleanup.
  - `git diff --check` passed.
  - `yarn workspace @se-2/nextjs build` passed; Next emitted existing dependency warnings from Wallet/RainbowKit import chains, with no app compile error.
  - Dev HTTP smoke passed with `HTTP/1.1 200 OK` on `http://127.0.0.1:3000/`.
  - Playwright browser QA passed: submitted state -> result state, Real CAW Swap details, Agent A full target, 5 hard rules, Agent B/C tool-use, memory anomaly, execution tools, result evidence, Agentic Retry failed attempt expansion, and CAW Pact Deny right-panel status were all verified.
  - CP16/CP17 live backend QA passed: Next proxy returned backend `tool_calls`, reviewer-level `tool_calls`, and `memory_anomalies`; Playwright verified those fields render in the middle Decision Chain and right-side status area.
### 2026-06-12 前端 Checkpoint 13.5：Judge Landing Polish + Evidence Panel

- 开始时间：2026-06-12 04:30。
- 完成时间：2026-06-12 04:57。
- 当前状态：Code Done / Build + HTTP Smoke Passed。
- 目标：
  - 首页首屏 30-60 秒内讲清：natural-language intent → risk decision → CAW Pact → real Uniswap V3 swap → on-chain evidence → audit trail。
  - 第一个 preset 改成 `Real CAW Swap` / `Swap 0.0005 ETH to USDC`。
  - 首页增加可见 Evidence Panel，展示 CAW wallet、Pact、execution backend、real tx mode、swap tx、block、USDC received、audit id/link。
  - 明确 CAW Pact 是硬执行边界。
- 已完成：
  - 首页 hero 文案改为 `CAW-governed autonomous trading execution agent`，并补充 Sentinel 如何把 natural-language trading intents 转为 risk-bounded CAW operations、真实 Sepolia Uniswap V3 swap 和 audit trail。
  - Presets 顺序改为 Real CAW Swap、CAW Pact Deny、Sentinel Hard Reject、Prompt Injection Blocked、Agentic Retry。
  - 首页增加 compact Execution Flow：Intent → Risk Engine → CAW Execution → On-chain Evidence → Audit Trail。
  - 首页增加 Evidence Panel；未运行 intent 时显示 CP14 demo evidence，运行后优先显示当前后端/API 响应中的 CAW wallet、Pact、backend、real tx、swap tx、block、USDC received、audit id。
  - mock fallback 与 mapper 已补齐 CP14 real CAW swap evidence 字段，保持真实后端 API 优先。
- 验证结果：
  - `yarn workspace @se-2/nextjs check-types` passed。
  - `yarn workspace @se-2/nextjs lint` passed with one pre-existing prettier warning in untouched `app/settings/page.tsx`。
  - `git diff --check` passed。
  - `yarn workspace @se-2/nextjs build` passed；保留既有 RainbowKit/Wagmi dynamic dependency warnings。
  - `curl -I http://127.0.0.1:3000/` returned `HTTP/1.1 200 OK` after dev server warm-up。
  - 过期措辞扫描未命中 `safe_swap`、`mock-only`、`future target`、`transfer-only`、`contract_call is not implemented` 等目标短语。

### 2026-06-07 前端 Checkpoint 11：Settings Page + Pact Sync Status

- 开始时间：2026-06-07 09:11。
- 暂停时间：2026-06-07 09:20（WSL service error）。
- 完成时间：2026-06-07 09:37。
- 当前状态：Code Done / Build + Screenshot Passed。
- 目标：
  - 新增 `/settings` 工具页。
  - 展示并编辑 shared contract 中的 `RiskConfig` 字段。
  - 保存后展示 `Sentinel config updated`，并根据 `config_status` 展示 `CAW Pact synced` 或 `CAW Pact update required`。
  - 首页和 Settings 对 `needs_pact_update` 显示轻量 warning。
- 已完成：
  - 新增 `frontend/packages/nextjs/app/settings/page.tsx`：
    - 编辑 shared contract 中的 swap / transfer / slippage / frequency / whitelist / auto approve 字段。
    - 保存调用 `updateRiskConfig()`。
    - 保存后展示 `Sentinel config updated` 和 Pact sync 状态文案。
  - 新增 `frontend/packages/nextjs/lib/sentinel/configViewModel.ts` 和 `configViewModel.test.ts`：
    - `riskConfigToDraft()` / `draftToRiskConfig()`。
    - `getPactSyncMessage()`。
  - 新增 `frontend/packages/nextjs/components/sentinel/ConfigSyncWarning.tsx`：
    - 首页默认只在 `needs_pact_update` 时显示轻量 warning。
    - Settings 页可显示 synced / warning 两种状态。
  - 更新 `SentinelShell.tsx`：
    - 左侧导航增加 Settings。
  - 更新 `page.tsx`：
    - 首页插入轻量 Pact sync warning，不改变常态首屏布局。
  - 更新 `CawWalletContext.tsx`：
    - 暴露 `setConfigStatus()`，Settings 保存后可同步更新 CAW 菜单和首页 warning。
  - 更新 `types.ts`：
    - `whitelistMode` 对齐 shared contract：`strict | open`。
- 验证结果：
  - `yarn workspace @se-2/nextjs check-types` passed。
  - `yarn workspace @se-2/nextjs lint` passed, no ESLint warnings or errors。
  - `git diff --check` passed。
  - `yarn workspace @se-2/nextjs build` passed；保留既有 RainbowKit/Wagmi dynamic dependency warnings。
  - HTTP smoke：`/`、`/audit`、`/settings` 均返回 200。
  - Playwright 截图 `output/playwright/settings-cp11-wait.png` 已生成，确认 Settings 数据加载、Pact sync 状态和右上角 `CAW active` 渲染正常。

后端 CP12 真实联调（2026-06-07 09:49）：

- 已启动后端 `/home/admini/sentinel-backend`，分支 `feature/backend-risk-pipeline`，FastAPI `http://127.0.0.1:8000` 健康检查通过。
- 当前后端 `.env` 关键开关：`EXECUTION_BACKEND=caw`、`ENABLE_REAL_TX=false`。
- 为前端 demo user 准备本地 SQLite 测试状态：
  - `user_address=0x1111111111111111111111111111111111111111`
  - `wallet_status=active`
  - `pairing_status=paired`
  - `pact_status=active`
  - `caw_wallet_id=wallet_frontend_integration_demo`
  - `pact_id=pact_frontend_integration_demo`
- 验收结果：
  - `PUT /api/config` 返回 `config_status=needs_pact_update`、`config_version=2`、`pact_config_version=1`。
  - 发现并修复前端真实联调 bug：后端 `/api/wallet/status` 仍返回 `config_status=synced`，首页只看 wallet status 会漏掉 Pact update warning；已改 `CawWalletContext` 同时读取 `getRiskConfig()`，用 config API 的 `config_status` 覆盖展示状态。
  - 首页截图 `output/playwright/integration-home-config-warning.png` 已确认显示 `CAW Pact update required`。
  - Settings 截图 `output/playwright/integration-settings-needs-pact.png` 已确认显示 `needs_pact_update`，且文案没有暗示 Sentinel config 自动修改 CAW Pact。
- 验证命令：
  - `yarn workspace @se-2/nextjs check-types` passed。
  - `yarn workspace @se-2/nextjs lint` passed。
  - `git diff --check` passed。
  - `yarn workspace @se-2/nextjs build` passed；保留既有 RainbowKit/Wagmi dynamic dependency warnings。

### 2026-06-07 前端 Checkpoint 12：CAW Evidence Audit + Policy Deny Visual

- 开始时间：2026-06-07 08:45。
- 完成时间：2026-06-07 09:10。
- 当前状态：Code Done / Typecheck + Lint Passed / Build Blocked。
- 先审查 Hermes CP10：
  - `validateIntentInput()` 使用 500 字符限制、控制字符 error、prompt injection warning；warning 不阻断提交，符合“前端只做 UX guard”的边界。
  - `runIntent(nextIntent)` 校验实际提交 intent，preset 不再被 textarea 当前错误状态误阻断。
  - Run 按钮有 `disabled` 状态和 onClick 前置兜底。
  - Audit 行 toggle 没有破坏 detail fetch 清理逻辑。
  - `isSecurityRejection()` 不依赖新增后端字段，保持 shared contract 稳定。
- 本 checkpoint 目标：
  - Audit 支持 user-scoped query、status filter、分页。
  - Audit detail 展示 CAW request / transaction / wallet / pact / backend 证据。
  - `execution.status = policy_denied` 时显示专属 CAW Pact block 视觉，不和 Sentinel hard reject 混在一起。
- 已完成：
  - 新增 `auditEvidenceViewModel.ts`，集中处理 CAW evidence label、policy deny 判断、explorer links。
  - Audit API wrapper 支持 `user_address`、`status`、`limit`、`offset`，兼容旧数组响应和 shared contract 分页响应。
  - Audit proxy route 透传查询参数。
  - Audit 页面新增 user scope、status filter、pagination 控制。
  - Audit detail 通过 `DecisionChain` 展示 user address、CAW wallet id/address、pact id/status、request id、transaction id、tx hash、policy reason、execution backend。
  - `execution.status = policy_denied` 时显示 `Sentinel allowed, CAW Pact blocked execution`。
  - mock audit log 增加 CAW Pact deny 样例；真实后端可用时仍优先使用 8000 API。
- 测试结果：
  - `yarn workspace @se-2/nextjs check-types` passed。
  - `yarn workspace @se-2/nextjs lint` passed, no ESLint warnings or errors。
  - `git diff --check` passed。
  - `yarn workspace @se-2/nextjs build` passed；保留既有 RainbowKit/Wagmi dynamic dependency warnings。
  - HTTP smoke：`/`、`/audit`、`/settings` 均返回 200。
  - Playwright 截图 `output/playwright/audit-cp12-wait.png` 已生成，确认 Audit user/status controls、展开区和 CAW header 状态渲染正常。
  - 额外说明：尝试用 inline Playwright script 自动切换 `rejected` filter 检查 policy-deny 文案，但项目未安装可 `require("playwright")` 的本地 module，脚本未执行；policy-deny 逻辑已由 `auditEvidenceViewModel.test.ts` 覆盖。

后端 CP11 + CP13 真实联调（2026-06-07 09:49）：

- 已启动后端 `/home/admini/sentinel-backend`，分支 `feature/backend-risk-pipeline`，FastAPI `http://127.0.0.1:8000` 健康检查通过。
- 通过前端 Next proxy `http://127.0.0.1:3000/api/sentinel/*` 验收：
  - Sentinel reject：
    - 输入：`Swap 1 ETH to USDC`
    - 返回：`status=rejected`、`decision=reject`、`sentinel_decision=reject`
    - execution：`backend=caw`、`status=skipped`、`request_id=null`
    - 结论：Sentinel reject 不触发 CAW submit，audit detail 保留 wallet/pact evidence。
  - CAW request evidence：
    - 输入：`Send 0.001 ETH to 0x1111111111111111111111111111111111111111`
    - 返回：`status=executed`、`execution.backend=caw`、`execution.status=dry_run`
    - evidence：`request_id=sentinel-...`、`caw_wallet_id=wallet_frontend_integration_demo`、`pact_id=pact_frontend_integration_demo`
    - audit list/detail 通过 Next proxy 能查到同一 tx 的 backend/status/request/wallet/pact。
  - Audit 页面截图 `output/playwright/integration-audit-backend.png` 已确认真实后端记录能加载并展开。
- 当前不能直接完成的验收：
  - CAW policy deny：当前后端环境 `ENABLE_REAL_TX=false`，CawExecutor 会在提交前返回 `dry_run`，不会触发真实 CAW Pact deny；当前后端 audit 查询 `execution_status=policy_denied` 记录数为 0。
  - 需要切到受控真实 CAW deny 场景（`ENABLE_REAL_TX=true` 且有会被 Pact 拒绝的 demo transfer / Pact policy）后再做最终 policy deny 验收。

### 2026-06-07 前端 Checkpoint 10：Intent Input Guard UX

- 开始时间：2026-06-07 05:15。
- 完成时间：2026-06-07 05:25。
- 当前状态：Code Done / Tests Passed。
- 已完成：
  - `page.tsx` 新增 `validateIntentInput()` 函数：
    - 空输入不显示 error（Run 按钮已 disabled）。
    - 超过 500 字符 → error 级别，阻断提交。
    - 控制字符（ord < 32，排除 \n\r\t）→ error 级别。
    - prompt injection 模式（6 个 regex，与后端 input_guard.py 对齐）→ warning 级别，不阻断提交。
  - textarea 下方新增 inline error/warning 文案，颜色区分 error（rose）和 warning（amber）。
  - Run 按钮 `disabled` 条件加入 `hasBlockingError`。
  - `runIntent()` 前置检查加入 `hasBlockingError`。
  - `DecisionChain.tsx` 新增 `isSecurityRejection()` 检测：
    - 当后端返回 `status: "rejected"` 且 `reason` 或 `decisionReason` 包含 "input guard" / "prompt injection" / "control character" 时，在 Final Decision 区域显示 "Security rejection" 专属面板。
    - 与普通 policy reject 视觉区分。
- 设计决策：
  - 前端校验只是 UX 层，安全边界在后端。prompt injection 用 warning 而非 error，因为后端才是真正的拦截层。
  - 前端 500 字符限制 vs 后端 1200 字符限制：前端更严格，减少无效提交。
  - `isSecurityRejection` 通过文案关键词匹配，不依赖后端新增字段，保持 contract 稳定。
- 测试结果：
  - `yarn workspace @se-2/nextjs check-types` passed。
  - `yarn workspace @se-2/nextjs lint` passed, no ESLint warnings or errors。
  - `git diff --check` passed。
- 后续修复：
  - `185d33d` — Run 按钮增加 `disabled:` 样式（cursor-not-allowed、灰化）和 onClick `hasBlockingError` 前置检查，修复 disabled 属性未阻止点击的问题。
  - `6df441d` — Audit 行增加展开/收起 toggle，点击已展开行收起。改动 1 行（`onSelect` 从 `setSelectedTxId` 改为 toggle）。
- 环境说明：
  - dev server 有 CSS 400 问题，根因是旧 next-server 进程占端口 3000 导致新进程绑端口失败。正确清理方式：`kill $(ss -tlnp | grep 3000 | grep -oP 'pid=\K[0-9]+')`。
  - 改代码后需确认端口上跑的是最新进程，否则浏览器刷新拿到旧 build 产物。

### 2026-06-07 前端 Checkpoint 9：CAW Account Lifecycle UI

- 开始时间：2026-06-07 03:58。
- 完成时间：2026-06-07 04:41。
- 当前状态：Code Done / Build + HTTP Smoke Passed。
- 已完成：
  - 根据用户反馈，将 CAW Account 从首页大面板改为顶部状态栏里的连接钱包式二级菜单，避免占用首屏。
  - 菜单内显示 `Connect existing CAW` 和 `Create CAW wallet` 两条 setup 路径。
  - 顶部状态栏展示 connected user address、CAW wallet id/address、pairing status、pact status/id、config sync status。
  - 增加 `Refresh status` 操作，使用 CP8 的 wallet API wrapper。
  - SmartAccount baseline 信息保持 secondary，不抢 CAW 主叙事。
- 测试结果：
  - RED：`check-types` 先因缺失 `walletViewModel` / `getCawMenuButtonLabel` 失败，符合预期。
  - GREEN：`yarn workspace @se-2/nextjs check-types` passed。
  - `yarn workspace @se-2/nextjs lint` passed, no ESLint warnings or errors。
  - `git diff --check` passed。
  - `node node_modules/next/dist/bin/next build` passed；保留 RainbowKit/Wagmi 依赖链已有 dynamic dependency warnings。
  - 本地服务 `http://127.0.0.1:3000` 与 `/audit` HTTP smoke 均返回 200。
  - Playwright 静态截图 `output/playwright/caw-menu-home-ready.png` 已生成，确认首屏只显示右上角 CAW menu button，不再显示大块 CAW Account 面板。
  - `playwright-cli` daemon 需要 `/opt/google/chrome/chrome`；安装 Chrome 卡在 `sudo`，已停止挂起安装进程。使用 `npx playwright screenshot --browser=chromium` 完成可用截图验证。

后续 polish（2026-06-07 05:04）：

- 根据用户反馈进一步压缩 header：
  - `CAW active` 状态按钮固定在右上角，同时作为 CAW 二级菜单入口。
  - header 只保留 `NETWORK`、`EXECUTION`、`PACT` 三个高层 demo 状态。
  - `USER`、`WALLET_STATUS`、`CAW_WALLET`、`PAIRING_STATUS`、`CONFIG_STATUS` 等 lifecycle 细节移动到 CAW 二级菜单。
- 新增 `getCawHeaderStatusItems()` view-model contract test，约束 header 不再展示 wallet lifecycle 详情。
- 验证结果：
  - `yarn workspace @se-2/nextjs check-types` passed。
  - `yarn workspace @se-2/nextjs lint` passed, no ESLint warnings or errors。
  - `git diff --check` passed。
  - `node node_modules/next/dist/bin/next build` passed；保留既有 RainbowKit/Wagmi dynamic dependency warnings。
  - 本地服务 `http://127.0.0.1:3000` 与 `/audit` HTTP smoke 均返回 200。
  - Playwright 截图 `output/playwright/caw-menu-header-fixed.png` 已生成，确认 `CAW active` 位于右上角。

### 2026-06-07 前端 Checkpoint 8：Shared Contract / Docs 对齐

- 开始时间：2026-06-07 03:49。
- 完成时间：2026-06-07 03:58。
- 当前状态：Code Done / Tests Passed。
- 已完成：
  - 按 `shared-api-contract.md` 增加 CAW wallet lifecycle 类型、mock 和 API 封装。
  - 覆盖 `wallet_status`、`pairing_status`、`pact_status`、`config_status`。
  - 增加 risk config 类型、mock 与 GET/PUT API wrapper。
  - 增加 `tool_calls`、`memory_anomalies` 前端类型与 mapper。
  - 新增 `/api/sentinel/wallet/*` 与 `/api/sentinel/config` Next proxy routes。
  - 保持前端只依赖 shared contract 字段，不发明后端字段。
- 测试结果：
  - RED：`check-types` 先因缺失 wallet/config/tool/memory 类型和 API 导出失败，符合预期。
  - GREEN：`yarn workspace @se-2/nextjs check-types` passed。
  - `yarn workspace @se-2/nextjs lint` passed, no ESLint warnings or errors。
  - `git diff --check` passed。

### 2026-06-05 前端 Checkpoint 7.1：MVP quick wins

- 开始时间：2026-06-05 23:53。
- 完成时间：2026-06-06 00:03。
- 已完成：
  - 没有 execution 时隐藏 info panel，不再默认显示 `Manual confirmation slot`。
  - 统一状态标签用词：`confirm_needed` / `review` 均显示 `MANUAL REVIEW`。
  - 删除未引用的 `DecisionChainPreview.tsx` 死代码。
  - 给 intent textarea 加 `aria-label="Natural language DeFi intent"`。
  - 将 `globals.css` 的全局 `p { margin: 1rem 0 }` 收窄为 `.prose p`，避免覆盖页面内 `m-0`。
  - 小屏状态栏增加简版 `NET / EXEC / API` pills，不再完全隐藏关键状态。
  - Audit table 从固定 `min-w-[940px]` 调整为 `min-w-[760px] lg:min-w-[940px]`，降低平板溢出。
  - 新增 `StatusBadge.test.ts` 类型契约测试，约束状态标签用词。

验证命令：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
git diff --check
```

当前测试结果：

```text
check-types: passed
lint: passed, no ESLint warnings or errors
git diff --check: passed
```

### 2026-06-05 前端 Checkpoint 7：验证与小修

- 开始时间：2026-06-05 23:05。
- 完成时间：2026-06-05 23:27。
- 已完成：
  - 暂缓 CP6 学习页，优先完成前端 MVP。
  - 验证真实后端健康状态、Next proxy、首页和 Audit 页面。
  - 跑 `check-types`、`lint`、`build`。
  - 确认真实后端关键路径：
    - safe swap。
    - agent retry swap。
    - hard-rule rejected swap。
    - confirm approve。
    - confirm reject。
    - audit list 和 detail。
  - 确认首页 `/` 和 Audit `/audit` 在 Windows/browser 同侧返回 HTTP 200。

真实后端 smoke 结果：

```text
health: ok
safeStatus: executed
safeAttempts: 1
retryStatus: executed
retryAttempts: 2
blockedStatus: rejected
confirmApproveInitial: confirm_needed
approveConfirmation: approved
confirmRejectInitial: confirm_needed
rejectStatus: rejected
rejectConfirmation: rejected
auditCount: 15
detailAttempts: 2
```

验证命令：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
yarn workspace @se-2/nextjs build
git diff --check
```

当前测试结果：

```text
check-types: passed
lint: passed, no ESLint warnings or errors
build: passed
git diff --check: passed
Windows localhost /: HTTP 200
Windows localhost /audit: HTTP 200
```

Build 备注：

- `next build` exit code 为 0。
- build 输出存在 Scaffold-ETH / RainbowKit 依赖链 warning：
  - `@reown/appkit ... Critical dependency: the request of a dependency is an expression`
  - `@coinbase/cdp-sdk ... Critical dependency: the request of a dependency is an expression`
- warning 来自现有 wallet/provider 依赖，不是本轮 Sentinel 页面、proxy 或 mapper 代码错误。

当前限制：

- 未安装 WSL 侧 Playwright wrapper，本轮未新增浏览器截图自动化；已用 Windows/browser 同侧 HTTP、Next proxy smoke、typecheck、lint、production build 覆盖 MVP 可运行性。
- 仍需用户做主观浏览器 QA：视觉、文案、展开行高度、demo 叙事是否符合预期。

提交 / push 记录：

- 时间：2026-06-05 23:36。
- 范围：CP5 Audit 页、CP5.5 真实后端联调、CP7 前端 MVP 验证与文档记录。
- 目标分支：`feature/frontend-risk-console`。
- 提交信息计划：`feat(frontend): complete backend integrated MVP`。

### 2026-06-05 前端 Checkpoint 5.5：后端联调接入

- 开始时间：2026-06-05 22:38。
- 完成时间：2026-06-05 22:56。
- 已完成：
  - 读取后端 OpenAPI 与后端 worktree 代码，确认 `/api/execute`、`/api/audit-log`、`/api/audit-log/{tx_id}`、`/api/confirm` 实际字段。
  - 将前端 backend URL 收敛到 `SENTINEL_BACKEND_URL`，默认 `http://127.0.0.1:8000`。
  - 新增 `backendProxy.ts`，统一 Next proxy 转发逻辑。
  - 新增 Next proxy routes：
    - `/api/sentinel/audit-log`
    - `/api/sentinel/audit-log/[txId]`
    - `/api/sentinel/confirm`
  - `getAuditLog()` / `getAuditLogItem()` / `confirmExecution()` 优先走后端，失败时保留 mock fallback。
  - 新增 `backendAuditMapper.test.ts`，约束后端 audit summary/detail 能映射到现有 `AuditLogItem` / `ExecuteResponse`。
  - 扩展前端类型以覆盖后端真实字段：
    - `execution.status = skipped | dry_run | pending_approval | policy_denied` 等。
    - `execution.tx_id`。
    - `execution.raw`。
  - `confirmExecution()` 接真实后端 `/api/confirm`；approve/reject 后前端展示 operator decision recorded，不暗示真实链上执行。

已确认后端接口：

```text
GET /health -> {"status":"ok"}
POST /api/execute -> 返回 tx_id/status/decision/decision_reason/sentinel_decision/attempts/decision_chain/execution
GET /api/audit-log -> 返回 audit summary list
GET /api/audit-log/{tx_id} -> 返回完整 audit detail
POST /api/confirm -> 返回更新后的完整 audit detail
```

已验证真实样例：

```text
Swap 0.2 ETH to USDC -> executed, 2 attempts, execution.status=skipped
Swap 1 ETH to USDC -> rejected, hard rule AmountRule rejected
Send 0.03 ETH to 0x742d... -> confirm_needed
Send 0.005 ETH -> executed, execution.backend=caw, execution.status=dry_run, request_id=sentinel-...
```

验证命令：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
git diff --check
Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 http://localhost:3000/api/sentinel/audit-log
Invoke-WebRequest -UseBasicParsing -TimeoutSec 30 -Method POST -ContentType 'application/json' -Body '{"intent":"Swap 0.2 ETH to USDC"}' http://localhost:3000/api/sentinel/execute
Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 http://localhost:3000/api/sentinel/audit-log/{tx_id}
Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 -Method POST -ContentType 'application/json' -Body '{"tx_id":"...","action":"reject"}' http://localhost:3000/api/sentinel/confirm
Invoke-WebRequest -UseBasicParsing -TimeoutSec 30 http://localhost:3000/audit
```

当前测试结果：

```text
check-types: passed
lint: passed, no ESLint warnings or errors
git diff --check: passed
Next proxy /api/sentinel/audit-log: HTTP 200
Next proxy /api/sentinel/execute: HTTP 200
Next proxy /api/sentinel/audit-log/{tx_id}: HTTP 200
Next proxy /api/sentinel/confirm: HTTP 200
Windows localhost /audit: HTTP 200
```

当前限制：

- 为验证 `/api/sentinel/confirm`，已对后端现有 confirm record `d8dfe53e-e74f-4404-97b0-00b4499b14da` 执行一次 `reject`；后续如需演示 approve，可重新在首页执行 `Send 0.03 ETH to 0x742d...` 生成新的 confirm_needed 记录。
- WSL 内部访问 Next dev server 的 timeout 现象仍可能存在；本轮使用 Windows/browser 同侧 `localhost:3000` 验证 Next proxy。

### 2026-06-05 前端 Checkpoint 5：Audit 页接入 mock/API

- 开始时间：2026-06-05 21:35。
- 完成时间：2026-06-05 22:04。
- 已完成：
  - `/audit` 页面从静态 rows 改为加载 `getAuditLog()`。
  - 点击 audit row 后调用 `getAuditLogItem(txId)` 获取完整记录。
  - 展开区复用 `DecisionChain`，展示最终状态、原因、attempts timeline、proposal/rules/reviews/suggestions 与 CAW/mock execution evidence。
  - 新增 `AuditTable` client component，负责 loading / empty / detail error / expanded row 状态。
  - 新增 `auditItemToExecuteResponse()`，把 audit detail 转成首页复用的 `ExecuteResponse` view model。
  - 新增轻量类型契约测试，约束 audit detail 转换保留 attempts 与 execution evidence。
  - audit table 支持整行点击或键盘 Enter / Space 展开详情。
  - 修复 audit mock 数据：加入 `agent_retry_swap` 记录，并把 failed 记录改为唯一 `demo-005`，避免详情查找命中错误记录。

验证命令：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
git diff --check
Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 http://localhost:3000/audit
```

当前测试结果：

```text
check-types: passed
lint: passed, no ESLint warnings or errors
git diff --check: passed
Windows localhost /audit: HTTP 200
WSL curl 127.0.0.1:3000/audit: timed out after 20s, consistent with earlier WSL/Next local access issue
```

当前限制：

- 本轮没有引入真实 backend audit endpoint；`getAuditLog()` / `getAuditLogItem()` 仍使用本地 mock，保持 CP1 API-shaped boundary。
- 前端 dev server 当前监听 `http://localhost:3000`，用户可在浏览器打开 `/audit` 做手动 QA。

### 2026-06-04 前端计划同步：后端 CAW + agentic API 变更

- 已检查后端 worktree：
  - 路径：`/home/admini/sentinel-backend`
  - 分支：`feature/backend-risk-pipeline`
  - 最新提交：`b314d3c Add minimal execute API`
  - 本地分支与 `origin/feature/backend-risk-pipeline` 对齐。
- 后端当前 minimal FastAPI 已有：
  - `GET /health`
  - `POST /api/execute`
- `/api/execute` 当前返回：
  - `tx_id`
  - `status`
  - `decision`
  - `decision_reason`
  - `attempts[]`
  - `decision_chain` legacy compatibility shape
  - `execution`
- 后端计划已调整：
  - CAW 是 Cobo demo 主执行路径。
  - `SmartAccount.sol` 降级为 baseline / fallback / 技术展示。
  - `attempts[]` 记录 bounded agentic loop 每轮 proposal、rules、agent reviews、decision、rejection source。
  - `execution` 后续承载 CAW wallet / pact / request id / tx hash / policy deny reason。
- 前端计划已同步调整：
  - 新增 CP4.5：后端契约重新对齐。
  - CP5 Audit 页展开区改为 attempts timeline + execution evidence。
  - 顶部状态栏后续应优先展示 CAW execution context，SmartAccount 状态作为 secondary / fallback。
  - demo presets 需要更新：
    - `Swap 0.01 ETH to USDC` -> safe path。
    - `Swap 0.2 ETH to USDC` -> agentic retry path。
    - `Swap 1 ETH to USDC` -> hard rule reject。
    - `Send 0.03 ETH to 0x742d...` -> confirm path。
  - 旧 `Send 0.08 ETH to 0x742d...` 在当前后端会经 retry 后 executed，不再适合作为稳定 confirm preset。

当前状态判断：

- 本次只更新文档，不改前端代码。
- 下一步进入 CP5 Audit 页：接 `getAuditLog()` / `getAuditLogItem()`，展开区复用 attempts timeline + execution evidence。

### 2026-06-04 前端 Checkpoint 4.5：后端契约重新对齐

- 开始时间：2026-06-04 22:02。
- 完成时间：2026-06-04 22:36。
- 已完成：
  - 前端数据层对齐后端 minimal `/api/execute`。
  - 新增 `attempts[]`、`execution`、suggestions / CAW evidence 相关类型。
  - 新增 `backendMapper.ts`，负责后端 snake_case DTO -> 前端 camelCase view model。
  - 新增 Next proxy route：`/api/sentinel/execute` -> `http://127.0.0.1:8000/api/execute`，避免浏览器 CORS 问题。
  - `executeIntent()` 优先调用本地 Next proxy；失败时回退 mock 数据。
  - 更新 demo presets：
    - `Safe swap`：`Swap 0.01 ETH to USDC`
    - `Agent retry`：`Swap 0.2 ETH to USDC`
    - `Blocked swap`：`Swap 1 ETH to USDC`
    - `Manual review`：`Send 0.03 ETH to 0x742d...`
  - `DecisionChain` 增加 compact attempts timeline，展示 bounded reproposal history。
  - `DecisionChain` 的 Transaction / Audit Result 区域增加 execution backend/status/request/CAW evidence 展示。
  - 顶部状态栏主叙事调整为 CAW / FastAPI execution context，SmartAccount 作为 baseline/fallback 信息保留。
- 已确认：
  - 开始实现时后端 FastAPI 服务在 `127.0.0.1:8000` 可访问。
  - 当时 `GET /health` 返回 `{"status":"ok"}`。
  - 当时直接请求后端 `POST /api/execute` with `Swap 0.2 ETH to USDC` 返回 2 个 attempts：
    - attempt 1：RiskAnalyst reject，suggestion `amount -> 0.01`。
    - attempt 2：revised proposal executed。

验证命令：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
git diff --check
curl --max-time 10 -sS http://127.0.0.1:8000/health
curl --max-time 10 -sS -X POST http://127.0.0.1:8000/api/execute -H 'Content-Type: application/json' -d '{"intent":"Swap 0.2 ETH to USDC"}'
```

当前测试结果：

```text
check-types: passed
lint: passed, no ESLint warnings or errors
git diff --check: passed
backend /health: passed earlier with {"status":"ok"}, but final rerun failed to connect to 127.0.0.1:8000
backend /api/execute: returned 2 attempts for Swap 0.2 ETH to USDC earlier in the checkpoint
```

当前限制：

- Next dev server 进程已启动，但 CLI 请求 `http://127.0.0.1:3000` 和 `/api/sentinel/execute` 仍持续 timeout；这与 CP3/CP4 记录过的本地 WSL/Next dev server 访问问题一致。
- 最终复查时 `127.0.0.1:8000/health` 连接失败，后端服务可能已停止；前端 `executeIntent()` 已实现 backend-unavailable fallback 到 mock。
- 因 3000 端口 CLI timeout，本轮未完成浏览器自动点击验收；需要用户在浏览器手动检查页面。

提交 / push 记录：

- 时间：2026-06-05 01:47。
- 范围：CP4.5 代码改动与文档记录放在同一个提交中。
- 目标分支：`feature/frontend-risk-console`。
- 提交信息计划：`feat(frontend): align console with backend attempts`。

### 2026-06-01 前端 Checkpoint 1：类型、mock 数据、API 封装

- 已新增 `frontend/packages/nextjs/lib/sentinel/types.ts`：
  - `ExecutionStatus`
  - `ExecuteResponse`
  - `DecisionChain`
  - `RuleCheck`
  - `AgentReview`
  - `AuditLogItem`
- 已新增 `frontend/packages/nextjs/lib/sentinel/mockData.ts`：
  - 成功 swap：`Swap 0.01 ETH to USDC`
  - 拦截 swap：`Swap 1 ETH to USDC`
  - 确认转账：`Send 0.08 ETH to 0x742d...`
  - failed 超时示例：`Quote WETH to USDC`
- 已新增 `frontend/packages/nextjs/lib/sentinel/api.ts`：
  - `executeIntent(intent)`
  - `confirmExecution(txId, approved)`
  - `getAuditLog()`
  - `getAuditLogItem(txId)`
- 验收口径已调整：CP1 是不可视化的数据 contract 层，不要求项目作者靠读 TypeScript 代码验收；真正体验验收放到 CP3 的可点击页面。

验证命令：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
```

当前状态判断：

- 类型检查和 lint 已通过。
- 代码保持 API-shaped mock，后端完成后优先只替换 `api.ts` 内部实现。

### 2026-06-01 前端 Checkpoint 2：真实链上状态栏接入

- 已新增 `frontend/packages/nextjs/components/sentinel/SmartAccountStatusBar.tsx`：
  - 使用 `useBalance` 读取 SmartAccount ETH balance。
  - 使用 `useScaffoldReadContract` 读取 `owner`、`agent`、`dailyLimit`、`dailySpent`。
  - 使用 `useDeployedContractInfo` 从 Scaffold-ETH contract config 获取 `SmartAccount` 地址，避免硬编码。
- 已更新 `frontend/packages/nextjs/components/sentinel/SentinelShell.tsx`：
  - `SentinelShell` 继续负责布局和导航。
  - 链上读取逻辑集中放在 `SmartAccountStatusBar`，不散落到 `/` 或 `/audit`。
- 状态栏展示 Network、Smart Account、Balance、Daily Limit、Spent、Agent、Owner。
- RPC 或合约读取出错时，右侧状态显示 `RPC CHECK`，不阻塞页面主体 demo。

验证命令：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
```

当前测试结果：

```text
check-types: passed, exit 0
lint: passed, no ESLint warnings or errors
```

当前状态判断：

- 后台 dev server 已启动并监听 `0.0.0.0:3000`。
- CLI 侧 `curl http://127.0.0.1:3000` 曾持续 timeout，但用户侧浏览器已经加载成功。
- CP2 代码层验证已完成；视觉验收可在浏览器页面中补看顶部状态栏。

### 2026-06-01 前端 Checkpoint 3：首页执行控制台接入 mock API

- 已新增 `frontend/packages/nextjs/components/sentinel/DecisionChain.tsx`：
  - 接收 `ExecuteResponse` 并动态展示 Agent A proposal、Hard Rules、Agent B、Agent C、Final Decision、Transaction / Audit Result。
  - 运行中展示 loading skeleton。
  - API 返回后按步骤 stagger reveal，模拟“逐步检查”的演示效果。
  - 有 tx hash 时展示 Sepolia Etherscan 和 Blockscout 链接。
  - `confirm_needed` 状态只展示确认原因和占位按钮；真实 Approve / Reject 交互留到 CP4。
- 已更新 `frontend/packages/nextjs/app/page.tsx`：
  - 首页改为 client component。
  - textarea 改为受控输入。
  - 三个 preset 点击后直接调用 `executeIntent` mock。
  - Run 按钮调用当前输入内容。
  - Recent Decisions 会把最新执行结果插到顶部。
  - 基础异常 catch 显示 `Connection failed. Try again.`。

验证命令：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
```

当前测试结果：

```text
check-types: passed
lint: passed, no ESLint warnings or errors
```

当前验收状态：

- Codex in-app browser 插件连接失败，错误来自本地 Windows sandbox，不是项目代码错误。
- `curl.exe -I http://localhost:3000` 已返回 `200 OK`；此前 `500` 根因是 `frontend/packages/nextjs/lib/sentinel/` 数据层文件缺失，已恢复。
- WSL 侧 Playwright 截图链路已恢复：
  - 命令：`npx playwright screenshot --wait-for-timeout=5000 http://127.0.0.1:3000 /home/admini/sentinel/output/playwright/sentinel-cp3-autocheck.png`
  - 结果：截图生成成功，可作为后续视觉验收路径。
- CP3 仍建议用户在浏览器中手动检查三个 preset：
  - `Safe swap` -> `EXECUTED`
  - `Blocked swap` -> `REJECTED`
  - `Manual review` -> `CONFIRM NEEDED`

### 2026-06-02 前端 Checkpoint 4：`confirm_needed` 与错误态

- 已更新 `frontend/packages/nextjs/app/page.tsx`：
  - 接入 `confirmExecution(txId, approved)`。
  - `Manual review` 进入 `CONFIRM NEEDED` 后，Approve / Reject 会更新主 decision chain 和 Recent Decisions。
  - 执行错误按 `network`、`timeout`、`execution_failed` 分类展示：
    - `network` -> `Connection failed. Try again.`
    - `timeout` -> `Request timed out.`
    - `execution_failed` -> 展示 parsed reason，例如 `daily limit exceeded`
- 已更新 `frontend/packages/nextjs/components/sentinel/DecisionChain.tsx`：
  - Confirm action bar 的 Approve / Reject 从 disabled 占位按钮改为可点击按钮。
  - 按钮 pending 时显示 `Approving` / `Rejecting`。
  - Approve 后展示 audit-only 结果，不伪造真实链上 tx hash。
- 已更新 `frontend/packages/nextjs/lib/sentinel/api.ts`：
  - `executeIntent` mock 增加错误触发分支：输入包含 `network`、`timeout`、`daily limit` / `revert`。
  - `confirmExecution` mock 只记录确认状态，不暗示真实链上执行。

验证命令：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
curl.exe --max-time 60 -I http://localhost:3000
npx playwright screenshot --wait-for-timeout=3000 http://127.0.0.1:3000 /home/admini/sentinel/output/playwright/sentinel-cp4-page.png
```

当前测试结果：

```text
check-types: passed, exit 0
lint: passed, no ESLint warnings or errors
curl: HTTP/1.1 200 OK
playwright screenshot: passed, screenshot generated
```

当前验收状态：

- 自动点击验收未完成：临时 Playwright test 受缺少 `@playwright/test` 影响，Codex wrapper 受 WSL 内缺少系统 Chrome 影响。
- 页面截图已生成：`/home/admini/sentinel/output/playwright/sentinel-cp4-page.png`。
- 需要用户手动检查：
  - `Manual review` -> `CONFIRM NEEDED` -> `Approve` -> `EXECUTED` / audit-only confirmation result。
  - `Manual review` -> `CONFIRM NEEDED` -> `Reject` -> `REJECTED` / operator rejected reason。
  - 在 textarea 输入包含 `timeout`、`network`、`daily limit` 的 intent，分别检查错误文案。

QA 修复：

- 时间：2026-06-02 05:10。
- 问题：点击 `Safe swap` 后中间 decision chain 显示 `REJECTED`。
- 根因：旧 mock 分类逻辑使用 `includes("1 eth to usdc")`，`Swap 0.01 ETH to USDC` 中的 `0.01 ETH to USDC` 也包含这个子串。
- 修复：`executeIntent` 的 mock 分类改为先解析 `swap <amount> ETH to USDC` 的数值，再用 `amount >= 1` 判断 blocked swap。
- 验证：
  - `Swap 0.01 ETH to USDC` -> amount `0.01`，不触发 blocked。
  - `Swap 1 ETH to USDC` -> amount `1`，触发 blocked。
  - `check-types` passed。
  - `lint` passed, no ESLint warnings or errors。
