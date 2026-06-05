# Sentinel 前端进度记录

> 最后更新：2026-06-06 00:03

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

当前整体判断：

- 前端 MVP 约完成 60%-70%，首页执行控制台、确认流、CAW/attempts 后端契约对齐、Audit 页展开详情已完成。
- CP5 已把 Audit 页从静态 mock 表格改为调用 `getAuditLog()` / `getAuditLogItem()`，并在展开区复用首页 `DecisionChain` 展示 attempts timeline 与 execution evidence。
- 当前后端 FastAPI 已在 `http://127.0.0.1:8000` 启动，`GET /health` 返回 `{"status":"ok"}`。
- CP5.5 已完成真实后端 audit/confirm 联调。
- CP6 前端理解层按用户要求顺延，不阻塞 MVP。
- CP7 已完成前端 MVP 验证：真实后端 smoke、Next proxy、首页/Audit 页面、typecheck、lint、production build 均已跑过。
- CP7.1 已按用户 review 反馈处理 quick wins。
- 当前还需要用户做浏览器侧主观 QA：检查页面视觉、文案和 demo 讲述是否符合预期。

## 当前进度详情

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
