# Sentinel 前端进度记录

> 最后更新：2026-06-01 05:37

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
| CP3 | 首页执行控制台接入 mock API | 2-4h | 待开始 | 待开始 | Todo | 让成功、拦截、确认路径可以在浏览器里点击验证 |
| CP4 | `confirm_needed` 与错误态 | 2-3h | 待开始 | 待开始 | Todo | Approve / Reject 和异常提示 |
| CP5 | Audit 页接入 mock API | 2-3h | 待开始 | 待开始 | Todo | 点击行展开完整 decision chain |
| CP6 | 前端理解层 | 2-4h | 待开始 | 待开始 | Todo | `frontend-implementation-guide.md` + `/frontend-map` |
| CP7 | 验证与小修 | 1-3h | 待开始 | 待开始 | Todo | 类型检查、lint、关键路径手动验收 |

当前整体判断：

- 前端 MVP 约完成 35%-45%，视觉骨架和数据 contract 已完成，真实链上状态栏代码已接入。
- 本地 dev server 之前出现过监听后 `curl` timeout，但用户侧浏览器现已能加载页面。
- 下一步可以进入 CP3，但开始时需要先更新本文件的 CP3 开始时间和状态。

## 当前进度详情

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
check-types: passed
lint: passed, no ESLint warnings or errors
```

当前状态判断：

- 后台 dev server 已启动并监听 `0.0.0.0:3000`。
- CLI 侧 `curl http://127.0.0.1:3000` 曾持续 timeout，但用户侧浏览器已经加载成功。
- CP2 代码层验证已完成；视觉验收可在浏览器页面中补看顶部状态栏。
