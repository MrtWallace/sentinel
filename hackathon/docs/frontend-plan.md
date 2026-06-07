# Sentinel 前端 MVP 更新计划

> 最后更新：2026-06-06

## 总结

前端做成 **AI 风控执行控制台**：打开页面后直接演示自然语言意图如何经过 AI 提案、硬规则、Agent 审查、bounded agentic reproposal、确认/执行/拦截，并留下审计记录。

后端在 2026-06-04 已切到 Cobo 赛道主线：**CAW 是 Cobo demo 的主资金执行路径**，`SmartAccount.sol` 保留为 baseline / fallback / 技术展示。因此前端后续计划也要从“SmartAccount dashboard + 单条 decision chain”调整为“Sentinel 风控 + CAW execution evidence + attempts audit”的 demo 叙事。

Post-MVP 新路线采用 **Cobo-first execution platform + Agent evidence layer**：前端优先把 CAW wallet、Pact、policy、execution evidence 做成评委第一眼能看懂的主线；Agent tool calling、memory anomaly、MCP 作为证据层展示，证明 Sentinel 不只是 if-else 风控。

前后端继续分支/worktree 分离开发：后端在 `feature/backend-risk-pipeline`，前端在 `feature/frontend-risk-console`。每个后端功能先产出 API contract，前端按 contract 做 mock/mapper；最后再开 integration branch 做联调和 demo polish。

同时新增一个专门的 **前端理解层**：让项目作者能讲清楚每个组件在干什么、接口传什么数据、数据如何从 API 变成页面展示。这个部分用于内部学习和项目介绍，不进入评委 demo 主流程。按 2026-06-05 的收尾决策，Checkpoint 6 可以顺延到前端 MVP 之后，不阻塞真实后端联调和 demo 主路径。

给项目作者看的开发计划和文档用中文；前端 UI 和对外 demo 文案用英文。

## 进度记录

前端实时进度、checkpoint 时间戳、测试结果和当前阻塞统一记录在 `hackathon/docs/frontend-progress.md`。

本文件只记录相对稳定的前端目标、范围、接口和 checkpoint 定义。除非计划本身变化，否则后续 checkpoint 默认只更新 `frontend-progress.md`，减少上下文和 token 消耗。

## 核心页面

### 首页 `/`

首页是执行控制台。

- 顶部状态栏优先展示 Cobo demo 需要的 execution context：network、execution backend、CAW wallet、pact status / pact id、real-tx mode。SmartAccount 余额、daily limit、daily spent、agent 可作为 baseline / fallback 的 secondary 信息保留。
- 左侧输入 intent，提供 demo 快捷按钮：成功 swap、被拦截 swap、需要确认的大额操作。
- 右侧展示 decision chain：先显示 loading skeleton，再逐步 reveal 每个步骤；如果后端返回 `attempts[]`，优先展示 attempts timeline，而不是只展示 legacy `decision_chain`。

### Audit 页 `/audit`

Audit 页用于展示审计记录。

- 表格列：time、intent、status、reason、tx hash。
- 点击行展开完整 decision chain / attempts timeline / execution evidence。
- Audit v1 使用 API/mock audit record，暂不直接读取链上 `Executed` 事件。
- Cobo demo 相关记录需要展示 CAW wallet、pact、request id / transaction id、policy deny reason。

### 内部讲解页 `/frontend-map`

`/frontend-map` 是内部学习页。

- 不放进主导航，不影响 demo。
- 中文展示前端数据流、接口含义、组件职责、mock/API 替换点。
- 用于项目作者复习和介绍项目时快速讲清楚前端。

## 数据与接口

新增类型：

- `ExecutionStatus = "executed" | "rejected" | "confirm_needed" | "failed"`
- `ExecuteResponse`
- `DecisionChain`
- `RuleCheck`
- `AgentReview`
- `AuditLogItem`
- `AttemptRecord`
- `Suggestion`
- `ExecutionResult`
- `CawExecutionEvidence`

新增 API 封装：

- `executeIntent(intent: string)`：提交自然语言意图，返回一次执行决策结果。
- `confirmExecution(txId: string, approved: boolean)`：处理需要二次确认的交易；对应后端 `POST /api/confirm`，MVP 只更新审计状态，不假设会触发真实链上执行。
- `getAuditLog()`：获取审计列表。
- `getAuditLogItem(txId: string)`：获取单条完整审计记录。

第一版 `api.ts` 使用同真实接口形状一致的 mock 数据。后端 API 完成后，优先只替换 `api.ts` 内部实现和 mapper，页面组件不直接写后端 DTO 解析逻辑。

后端 2026-06-04 最小 `/api/execute` 已返回以下关键字段：

- `tx_id`
- `status`
- `decision`
- `decision_reason`
- `attempts[]`
- `decision_chain`（legacy compatibility）
- `execution`

前端后续类型应把 `attempts[]` 和 `execution` 当作一等字段；`decision_chain` 可以作为单 attempt / legacy UI 的兼容来源，但不应继续成为唯一展示源。

当前可用 demo 输入需要更新：

- `Swap 0.01 ETH to USDC`：safe path，1 个 attempt，最终 `executed`。
- `Swap 0.2 ETH to USDC`：agentic retry path，attempt 1 被 Risk Analyst 拒绝并给出 suggestion，ReproposalAgent 降额到 `0.01`，attempt 2 执行。
- `Swap 1 ETH to USDC`：hard rule reject，1 个 attempt，Agent B/C skipped，不触发 CAW。
- `Send 0.03 ETH to 0x742d...`：confirm path，`confirm_needed`。

旧的 `Send 0.08 ETH to 0x742d...` 在当前后端最小 API 中会进入 agentic retry 后 executed，不再适合作为稳定 confirm preset。

## 前端理解层

新增中文文档：`hackathon/docs/frontend-implementation-guide.md`。

文档需要解释：

- 页面结构：`/`、`/audit`、`/frontend-map` 分别负责什么。
- 数据流：用户输入 -> `executeIntent` -> `ExecuteResponse` -> 页面状态 -> `DecisionChain` 展示。
- 接口解释：每个 API 函数传什么、返回什么、为什么需要。
- 类型解释：`DecisionChain`、`RuleCheck`、`AgentReview` 等字段的业务含义。
- 新增解释：`attempts[]` 为什么存在、`Suggestion` 如何驱动 reproposal、`MutationGuard` 负责什么、`execution` 如何承载 CAW evidence。
- 组件地图：每个组件职责、输入 props、输出 UI。
- mock 到真实 API 的替换方式。

在关键类型和 API 函数旁写少量中文注释，解释“这个数据为什么存在”，不写大段废话。

`/frontend-map` 页面复用同一份解释结构，像一张内部前端地图，方便 demo 前快速过一遍。

## 关键交互

### `confirm_needed`

`confirm_needed` 不能停在展示状态。

- UI 显示确认原因、风险说明、Approve / Reject 按钮。
- 第一版按钮调用 mock `confirmExecution`。
- Approve 后展示“用户已批准，审计状态已更新”的终态；如果 mock 需要演示完整链路，可显示 simulated executed result，但文案不能暗示后端 v1 已真实发交易。
- Reject 后进入 rejected / user rejected 终态。

### 错误态

错误态单独处理，不混进业务状态。

- 网络错误：`Connection failed. Try again.`
- API 超时：`Request timed out.`
- 合约 revert / execution failed：展示 parsed reason，例如 daily limit exceeded。

### Explorer 链接

- tx hash 默认链接到 Sepolia Etherscan。
- 同时提供 Blockscout 备用链接。
- demo 前验证两者可打开。
- 如果后端只返回 CAW request id / transaction id 而没有 testnet tx hash，UI 显示 CAW request evidence，不伪造 explorer 链接。

## 展示细节

### 状态栏数据来源

- Cobo demo 主状态栏优先从 API/mock config 展示 CAW execution context：
  - execution backend：`mock` / `caw` / `local`
  - CAW wallet address / wallet id
  - pact status / pact id
  - real-tx mode：dry-run / real tx enabled
  - network：Sepolia
- SmartAccount baseline 状态仍可保留：
  - `useBalance` 读取 SmartAccount ETH balance。
  - `useScaffoldReadContract` 读取 `owner`、`agent`、`dailyLimit`、`dailySpent`。
  - 合约地址统一来自 Scaffold-ETH contract config，不再硬编码。
- UI 文案必须避免让评委误解 SmartAccount 是 Cobo 主执行钱包。

### Decision chain 展示层级

- 如果只有 legacy `decision_chain`：继续展示 Agent A Proposal、Hard Rules、Agent Reviews、Final Decision、Transaction / Audit Result。
- 如果有 `attempts[]`：展示 attempts timeline：
  - Attempt header：attempt index、decision、rejection source。
  - Proposal：action、amount、token pair、target contract / recipient、slippage、deadline。
  - Hard Rules：每条 rule 显示 passed / confirm / rejected / skipped、rule name、reason、severity。
  - Agent Reviews：Agent B / Agent C 各自显示 passed、risk level、findings、reasoning、suggestions。
  - Reproposal evidence：从上一轮 suggestions 到下一轮 revised proposal 的关键变化，例如 amount `0.2 -> 0.01`。
  - Final Decision：executed/rejected/confirm_needed、decision reason。
  - Execution：CAW/mock/local backend、status、request id、tx hash、policy reason。

Audit 展开区复用同一个 decision/attempts 展示组件，避免首页和 audit 页两套展示逻辑不一致。

## 执行拆解

前端实现不要一次性生成所有代码。按下面 checkpoint 顺序推进，每一步完成后先让项目作者审查，再进入下一步。这样可以把代码 diff 控制在可学习、可 review 的范围内。

### Checkpoint 0：确认现有前端基线（已完成）

产物：

- 确认 `frontend/packages/nextjs` 当前页面、Header/Footer、contract config、Scaffold hooks 的真实结构。
- 记录当前首页硬编码合约地址与 `deployedContracts.ts` 地址是否一致。

审查重点：

- 只做阅读和总结，不改代码。
- 明确哪些现有 Scaffold-ETH 代码会保留，哪些会替换。

学习点：

- Scaffold-ETH 2 的 Next.js 包结构。
- `deployedContracts.ts` 为什么是合约地址和 ABI 的前端来源。

记录：

- 结果见 `hackathon/docs/frontend-checkpoint-0.md`。

### Checkpoint 0.5：Stitch 风格 UI skeleton（视觉框架确认，已完成）

目标：

- 在正式接 API、类型和链上读取之前，先做一个静态 UI skeleton，用来确认视觉方向、信息架构和 demo 叙事是否成立。
- 这个 checkpoint 是设计确认点，不是业务实现点。允许写前端页面和组件，但只使用页面内静态示例数据。
- 完成后先给项目作者 review，再进入 Checkpoint 1 的类型、mock 数据和 API 封装。

参考输入：

- 参考目录：`hackathon/stitch_sentinel_defi_command_center/`
- 视觉系统：`obsidian_emerald/DESIGN.md`
- Console 参考图：`sentinel_console_optimized_sidebar_proportions/screen.png`
- Audit 参考图：`sentinel_audit_optimized_sidebar_proportions/screen.png`

采用方向：

- 使用 **Obsidian Emerald Command Center** 作为视觉参考。
- 保留深色 command center、muted emerald accent、monospace data、顶部状态栏、左侧窄导航、紧凑卡片和高密度表格风格。
- 采用 Stitch 的整体信息密度和专业 DeFi 操作台气质，但页面语义必须服务 Sentinel 的 AI 风控执行流程。
- Audit table 的表格密度、status badge、expanded row 风格可作为实现参考。

后续 coding 产物：

- `/` 首页静态框架：
  - 左侧窄导航：只暴露 Execute / Audit 两个 demo 入口。
  - 顶部状态栏：先用静态占位展示 Network、SmartAccount、Balance、Daily Limit、Daily Spent、Agent；真实读取留到 Checkpoint 2。
  - Intent 区：自然语言输入框、Run 按钮、三个 demo preset。
  - Decision Chain 区：用静态示例展示完整六段链路。
  - Recent Decisions 区：只展示 3 条轻量记录，不放完整 audit table。
- `/audit` 静态框架：
  - 同一套 Sentinel shell。
  - 高密度 audit table，占位列为 time、intent、status、reason、tx hash。
  - 默认展示一条 expanded row 的视觉样式，占位内容复用 decision chain 结构。
- 暂不做 `/frontend-map`；内部讲解页仍放在 Checkpoint 6。

首页信息结构：

- 第一层：顶部状态栏说明“当前被风控保护的 SmartAccount 状态”。
- 第二层：左侧 intent 输入说明“用户想做什么 DeFi 操作”。
- 第三层：右侧 decision chain 说明“AI 和规则如何判断这笔操作”。
- 第四层：底部或侧边 recent decisions 说明“每次判断都会留下审计痕迹”。

Decision chain skeleton 必须包含：

- Agent A Proposal：action、amount、token pair、target contract、slippage、expected output。
- Hard Rules：至少三条规则，展示 passed/rejected、rule name、reason。
- Agent B Security Review：passed、risk level、findings、reasoning。
- Agent C Risk Review：passed、risk level、findings、reasoning。
- Final Decision：executed / rejected / confirm_needed / failed 的 badge 视觉。
- Transaction / Audit Result：tx hash、simulation、explorer links 或 audit-only result。

状态视觉规则：

- `executed`：emerald / success，用于“检查通过并产生 tx hash”。
- `rejected`：red / danger，用于“硬规则或 agent 审查明确拦截”。
- `confirm_needed`：amber / warning，用于“需要用户二次确认”，必须预留风险说明和 Approve / Reject 按钮位置。
- `failed`：rose 或 neutral danger，用于“网络、API、revert 等异常”，不要和业务拒绝混在一起。

必须调整 Stitch 的地方：

- 首页不要放完整 audit table，只保留轻量 recent decisions；完整日志放 `/audit`。
- Preset 文案改为真实 demo：
  - `Swap 0.01 ETH to USDC`
  - `Swap 1 ETH to USDC`
  - `Send 0.08 ETH to 0x742d...`
- Decision chain 必须补齐 Sentinel 的真实审查层级，不沿用 Stitch 的泛化交易终端文案。
- 不使用 `AUTO-EXECUTING / HALT EXECUTION` 作为默认语义；MVP 后端 `confirm_needed` 是终态，`/api/confirm` 只更新审计状态，不假设真实链上执行。
- 顶部右侧移除容易误导的钱包产品元素，例如 portfolio value、wallet icon、power icon。
- `confirm_needed` 不能只是黄色 badge，必须能看出后续会有 Approve / Reject 交互。

实现原则：

- Stitch HTML 只作为视觉参考，不直接复制到 Next.js。
- 不引入 CDN Tailwind、Google Fonts runtime 或 Material Symbols 作为核心依赖。
- 在 Scaffold-ETH 现有 Next.js / Tailwind / DaisyUI 结构里复刻必要的视觉语言。
- 若需要图标，优先使用项目已有 icon 依赖或现有 Scaffold-ETH 组件，不为了视觉稿新增大依赖。
- 卡片只用于独立信息块，不做卡片套卡片；页面区域用 full-width layout 或 grid，不包装成营销页。
- UI 文案保持英文；本计划、checkpoint 汇报和内部学习文档保持中文。

此 checkpoint 不做：

- 不创建正式 `api.ts`、`types.ts`、`mockData.ts`。
- 不调用 `executeIntent`、`confirmExecution`、`getAuditLog`。
- 不读取真实链上数据。
- 不实现 stagger reveal、confirm 按钮逻辑或错误处理逻辑。
- 不改动合约、agent、backend 代码。

审查重点：

- 是否一眼能看出这是 Sentinel 的 AI 风控执行控制台，而不是普通钱包或投资组合 dashboard。
- 首页是否能支撑 2-3 分钟 demo 的第一屏讲解。
- `/audit` 是否能支撑“可审计”的叙事。
- 四种状态颜色是否清晰，尤其是 `confirm_needed` 是否不会卡住评委理解。
- 信息密度是否接近 Stitch，但没有牺牲可读性。

学习点：

- 为什么先做 UI skeleton：先确认页面承载的信息和叙事，再让数据层接入，避免后面边写业务边大改布局。
- 为什么 skeleton 阶段只能用静态数据：这一阶段验证的是视觉和信息结构，不验证 API contract。
- 为什么状态栏后续要接真链上数据，而 decision chain 第一版仍然可以来自 API-shaped mock。

### Checkpoint 1：类型、mock 数据、API 封装（已完成，待审查）

产物：

- 新增前端类型文件：`frontend/packages/nextjs/lib/sentinel/types.ts`。
- 新增 mock 数据文件：`frontend/packages/nextjs/lib/sentinel/mockData.ts`。
- 新增 API 封装文件：`frontend/packages/nextjs/lib/sentinel/api.ts`。
- 实现 `executeIntent`、`confirmExecution`、`getAuditLog`、`getAuditLogItem` 的 mock 版本。

当前实现说明：

- `types.ts` 定义前端与后端/API 之间的 contract，包括 `ExecutionStatus`、`ExecuteResponse`、`DecisionChain`、`RuleCheck`、`AgentReview`、`AuditLogItem`。
- `mockData.ts` 提供四类 demo 数据：`executed` 成功 swap、`rejected` 被硬规则拦截的大额 swap、`confirm_needed` 需要确认的转账、`failed` API 超时示例。
- `api.ts` 是页面未来唯一应该直接依赖的数据入口；后端完成后优先只替换这里的内部实现，页面组件不直接写 mock 逻辑。
- `confirmExecution` 遵守后端 MVP 语义：记录用户 Approve / Reject 的审计状态，不默认假设真实链上执行。

审查重点：

- 每个接口传什么、返回什么。
- `DecisionChain` 的字段能不能对应 demo 叙事。
- mock 数据是否覆盖 executed、rejected、confirm_needed 三种场景。
- `confirmExecution` 的文案和返回值是否不会误导为真实链上执行。
- Audit 列表摘要是否和单条详情区分清楚：`getAuditLog()` 返回轻量列表，`getAuditLogItem(txId)` 返回完整 `decisionChain`。

验收口径：

- Checkpoint 1 是数据 contract 层，本身不可视化；项目作者不需要通过阅读 TypeScript 代码来判断实现是否正确。
- Codex 负责保证类型检查和 lint 通过，并解释 mock 场景和接口语义。
- 项目作者只需要确认三条 demo 场景和接口语义是否符合项目叙事。
- 真正的体验验收放到 Checkpoint 3：页面接入 mock API 后，可以直接在浏览器点击 preset 检查成功、拦截、确认三条路径。
- 不建议等完整后端完成再继续前端；前端先用 API-shaped mock 做可点击 demo，后端只要对齐同一套 API contract，之后替换 `api.ts` 内部实现即可。

审查方法：

1. 先看 `types.ts`，确认这些类型能支撑你讲清楚前端数据流：
   - `ExecuteResponse` 是一次 intent 执行的总结果。
   - `DecisionChain` 是页面右侧审查链的核心数据。
   - `RuleCheck` 对应硬规则。
   - `AgentReview` 对应 Agent B / Agent C 审查。
   - `AuditLogItem` 对应 Audit 表格的一行。
2. 再看 `mockData.ts`，按三条 demo intent 检查叙事是否成立：
   - `Swap 0.01 ETH to USDC` 应该走 `executed`。
   - `Swap 1 ETH to USDC` 应该走 `rejected`，并且在硬规则阶段结束。
   - `Send 0.08 ETH to 0x742d...` 应该走 `confirm_needed`，并保留确认原因和风险说明。
3. 最后看 `api.ts`，确认页面以后只需要调用函数，不需要知道 mock 数据在哪里：
   - `executeIntent(intent)`：自然语言 intent -> `ExecuteResponse`。
   - `confirmExecution(txId, approved)`：确认选择 -> 新的终态结果。
   - `getAuditLog()`：Audit 表格摘要。
   - `getAuditLogItem(txId)`：展开某一条时拿完整详情。

建议验收命令：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
```

已执行结果：

- `yarn workspace @se-2/nextjs check-types` 通过。
- `yarn workspace @se-2/nextjs lint` 通过。
- 已尝试启动本地 Next dev server 验证页面，但当前环境中 server 监听 `0.0.0.0:3000` 后请求持续超时；临时移除新状态栏引用后仍复现，因此暂按环境/dev server 问题记录，不作为 Checkpoint 2 代码阻断。

学习点：

- “API contract first” 是什么意思。
- 为什么页面只依赖 `api.ts`，后端 ready 后只换这一层。

### Checkpoint 2：真实链上状态栏接入（已完成）

产物：

- Sentinel demo shell 已在 Checkpoint 0.5 完成；本 checkpoint 不再重做页面外壳。
- 将 Checkpoint 0.5 顶部状态栏中的静态占位替换为真实链上数据：
  - `useBalance` 读 SmartAccount ETH balance。
  - `useScaffoldReadContract` 读 `owner`、`agent`、`dailyLimit`、`dailySpent`。
  - 合约地址从 Scaffold-ETH contract config 获取，不再硬编码。

当前实现说明：

- 新增 `frontend/packages/nextjs/components/sentinel/SmartAccountStatusBar.tsx`，集中处理链上状态栏读取。
- `SentinelShell` 只负责全局布局和导航；链上读取逻辑不散落到 `/` 或 `/audit` 页面里。
- 状态栏展示 Network、Smart Account、Balance、Daily Limit、Spent、Agent、Owner。
- 如果 RPC 或合约读取出错，右侧状态从 `PROTECTED` 切换为 `RPC CHECK`，但不阻塞页面主体 demo。

审查重点：

- 状态栏是否只展示 demo 需要的信息，不恢复无关 wallet/debug/footer 噪音。
- 是否仍保留开发时需要的最小导航：Execute / Audit。
- 合约地址是否统一来自 Scaffold-ETH contract config。

已执行结果：

- `yarn workspace @se-2/nextjs check-types` 通过。
- `yarn workspace @se-2/nextjs lint` 通过。

学习点：

- wagmi 的 `useBalance` 和 Scaffold-ETH 的 `useScaffoldReadContract` 分别解决什么问题。
- 为什么状态栏是真链上数据，而 decision chain 第一版是 API/mock 数据。

### Checkpoint 3：首页执行控制台

产物：

- 新增 `IntentInput`。
- 新增 `DecisionChain`。
- 新增 `StatusBadge` 和 explorer link 展示。
- 首页 `/` 连接 `executeIntent`，支持成功和拦截 demo。
- Decision chain 使用 skeleton + stagger reveal，不做真实 streaming。

审查重点：

- 输入区是否足够简单。
- 成功和拦截两条 demo 路径是否清楚。
- Decision chain 的层级是否能让你讲清楚“AI 提案 -> 硬规则 -> Agent 审查 -> 最终决策”。

学习点：

- React state 如何保存一次执行结果。
- `ExecuteResponse` 如何映射到 UI 卡片。

### Checkpoint 4：`confirm_needed` 与错误态

产物：

- `confirm_needed` 状态显示确认原因、风险说明、Approve / Reject 按钮。
- Approve / Reject 调用 `confirmExecution` mock，并更新页面为最终审计状态；MVP 不把确认后真实链上执行作为前端假设。
- 错误态组件或页面区域：
  - 网络错误。
  - API 超时。
  - 合约 revert / execution failed。

审查重点：

- confirm 流程是否不会卡住 demo。
- 错误提示是否足够直白，不需要解释很多背景。

学习点：

- 业务状态和异常状态的区别。
- 为什么 `confirm_needed` 属于 agent/API flow，不是合约里的显式状态。

### Checkpoint 4.5：后端契约重新对齐（新增）

背景：

- 后端在 2026-06-04 已完成 minimal FastAPI `/api/execute`。
- 后端返回结构从单条 `decision_chain` 扩展为 `attempts[] + execution + legacy decision_chain`。
- Cobo demo 主资金路径从 SmartAccount 调整为 CAW，前端状态栏和 audit evidence 需要同步。

产物：

- 更新 `frontend/packages/nextjs/lib/sentinel/types.ts`：
  - 新增 `AttemptRecord`。
  - 新增 `Suggestion`。
  - 新增 `ExecutionResult`。
  - 新增 `CawExecutionEvidence` 或等价字段。
  - 保留现有 `DecisionChain` 作为 legacy / single-attempt view model。
- 更新 `frontend/packages/nextjs/lib/sentinel/mockData.ts`：
  - 新增 `Swap 0.2 ETH to USDC` agentic retry 场景。
  - 将 confirm preset 从 `Send 0.08 ETH...` 调整为 `Send 0.03 ETH...`。
  - 增加 mock execution block：`backend`、`status`、`requestId`、`txHash`、`policyReason`、`reason`。
- 更新 `frontend/packages/nextjs/lib/sentinel/api.ts`：
  - 继续导出 `executeIntent`、`confirmExecution`、`getAuditLog`、`getAuditLogItem`。
  - 增加后端 DTO 到前端 view model 的 mapper。
  - 页面组件不直接依赖后端 snake_case 字段。
- 更新首页 preset 文案：
  - `Safe swap` -> `Swap 0.01 ETH to USDC`
  - `Agent retry` -> `Swap 0.2 ETH to USDC`
  - `Blocked swap` -> `Swap 1 ETH to USDC`
  - `Manual review` -> `Send 0.03 ETH to 0x742d...`

审查重点：

- 后端实际 `/api/execute` response shape 是否能被前端类型完整表达。
- `attempts[]` 是否不会破坏已有单链路 UI。
- 新 demo presets 是否和后端当前行为一致。
- `execution.status = "not_submitted"` 时 UI 是否明确表示“CP5 minimal API 尚未提交 CAW 交易”，不伪造 tx hash。

学习点：

- 为什么要在 `api.ts` 做 DTO mapper，而不是让页面组件直接处理后端原始 JSON。
- 为什么 `attempts[]` 是 agentic demo 的核心证据。
- 为什么 CAW evidence 属于 execution result，不属于 AI decision 本身。

### Checkpoint 5：Audit 页

产物：

- 新增 `/audit` 页面。
- 新增 `AuditTable`。
- 表格展示 audit log。
- 点击行展开复用 decision / attempts 展示组件。
- 展开区展示：
  - final status 和 decision reason。
  - attempts timeline。
  - 每轮 proposal、rules、agent reviews、suggestions。
  - CAW/mock execution evidence。

审查重点：

- Audit 页是否能讲清“可审计”。
- 展开区是否和首页 decision / attempts 展示保持一致。
- agentic retry 是否能看出“先拒绝，再降风险重提案，再执行”。
- tx hash 存在时是否同时提供 Etherscan 和 Blockscout 链接。
- 只有 CAW request id / transaction id 时是否展示为 CAW evidence，不伪造 explorer 链接。

学习点：

- 列表数据和单条详情数据的区别。
- 为什么 Audit v1 先展示 API/mock audit record，而不是链上 `Executed` 事件。
- 为什么 CAW request id、pact id、policy deny reason 也是审计证据。

### Checkpoint 5.5：真实后端联调

背景：

- 后端在 2026-06-05 已启动 FastAPI，并提供完整 MVP API：
  - `GET /health`
  - `POST /api/execute`
  - `GET /api/audit-log`
  - `GET /api/audit-log/{tx_id}`
  - `POST /api/confirm`
- 前端 CP4.5 已接入 `/api/execute`，CP5 已让 Audit UI 具备展开完整 detail 的能力。
- 当前 checkpoint 只做联调和 contract 收敛，不新增主 demo 页面。

产物：

- 将后端 base URL 收敛到 `SENTINEL_BACKEND_URL`，默认 `http://127.0.0.1:8000`。
- 通过 Next proxy 对接后端：
  - `/api/sentinel/execute` -> `/api/execute`
  - `/api/sentinel/audit-log` -> `/api/audit-log`
  - `/api/sentinel/audit-log/[txId]` -> `/api/audit-log/{tx_id}`
  - `/api/sentinel/confirm` -> `/api/confirm`
- `getAuditLog()` 优先读取真实后端 audit summary，失败时回退 mock。
- `getAuditLogItem(txId)` 优先读取真实后端 audit detail，失败时回退 mock。
- `confirmExecution(txId, approved)` 优先调用真实后端 confirm API，失败时回退 mock。
- 增加后端 audit summary/detail 的 DTO mapper 和类型契约测试。

审查重点：

- 首页四个 demo presets 是否仍和后端真实行为一致。
- Audit 页是否显示后端真实 audit records，而不是静态 mock。
- confirm approve/reject 是否能在 UI 中显示“operator decision recorded”，但不暗示真实链上执行。
- 后端返回 `execution.status = "skipped" | "dry_run" | "policy_denied"` 时，前端是否能稳定展示。

学习点：

- 为什么浏览器不直接访问 FastAPI，而是通过 Next proxy。
- 为什么联调阶段保留 mock fallback。
- 为什么 audit list summary 不能直接当作 detail 展示。

### Checkpoint 6：前端理解层

状态说明：

- 这是 post-MVP 学习层，可在前端 MVP 验证完成后补做。
- 不阻塞首页执行控制台、Audit 页、真实后端联调和最终 demo。

产物：

- 新增 `hackathon/docs/frontend-implementation-guide.md`。
- 新增内部页面 `/frontend-map`。
- 文档和页面都用中文解释：
  - 页面结构。
  - 数据流。
  - API 函数。
  - 类型含义。
  - 组件职责。
  - mock 到真实 API 的替换方式。
  - 后端 DTO -> 前端 view model 的 mapper。
  - `attempts[]`、`Suggestion`、`MutationGuard`、`execution`、CAW evidence 的关系。

审查重点：

- 你能否看着这份文档复述前端数据流。
- `/frontend-map` 是否适合作为 demo 前复习材料。

学习点：

- 前端不是“页面代码”，而是“数据 -> 状态 -> 组件 -> UI”的转换链路。

### Checkpoint 7：验证与小修

产物：

- 运行类型检查和 lint。
- 手动过一遍成功、拦截、确认、Audit、frontend-map。
- 手动过一遍 agentic retry 和 CAW evidence 展示。
- 根据验证结果做小修，不做新功能。

审查重点：

- 是否满足计划里的手动验收项。
- 是否有明显 demo 阻断问题。

学习点：

- 前端完成标志不是“看起来差不多”，而是类型检查、lint、关键路径手动验收都过。

### Checkpoint 8：Shared Contract / Docs 对齐

背景：

- 后端 Post-MVP 将进入 per-user CAW、Settings、SQLite audit、MCP、tool calling、memory anomaly。
- 前端不直接等待后端代码完成，而是先按 shared API contract 更新类型、mock 和 mapper。

产物：

- 更新前端类型和 mock，覆盖：
  - `WalletStatus`
  - `CawWalletBinding`
  - `RiskConfig`
  - `ConfigSyncStatus`
  - `IntentValidationResult`
  - `ToolCallEvidence`
  - `MemoryAnomaly`
  - `McpEvaluationResult`
- 更新 API 封装预期：
  - `getWalletStatus()`
  - `connectExistingCawWallet()`
  - `createCawWallet()`
  - `refreshWalletStatus()`
  - `getRiskConfig()`
  - `updateRiskConfig()`
  - `validateIntentInput()`
- 和后端共同确认 `/api/wallet/*`、`/api/config`、`/api/execute`、`/api/audit-log` 的 response examples。

审查重点：

- 前端字段是否只依赖稳定 contract，不直接散落后端 snake_case DTO。
- mock 是否能覆盖 active wallet、pairing pending、pact pending、needs pact update、policy deny。
- 首页、Settings、Audit 后续都能复用同一组 mapper。

学习点：

- 为什么前端先做 contract/mock/mapper，可以降低前后端并行开发的摩擦。

### Checkpoint 9：CAW Account Lifecycle UI

目标：

- 把 User CAW Setup 拆成两条真实产品路径：已有 CAW 钱包连接，新用户创建 CAW 钱包。
- 新创建的钱包不是临时钱包，前端文案要表达“persisted user CAW wallet”，状态由后端数据库和 CAW status 驱动。

产物：

- 顶部 CAW status bar 增强：
  - connected user address。
  - CAW wallet address / wallet id。
  - pairing status。
  - pact status / pact id。
  - config sync status。
- 未绑定状态显示两个入口：
  - `Connect existing CAW`
  - `Create CAW wallet`
- 状态流：
  - `none`
  - `pairing_pending`
  - `paired`
  - `pact_pending`
  - `active`
  - `revoked`
  - `expired`
- 增加 `Refresh status` 操作，调用后端刷新 pairing/pact 状态。

审查重点：

- 评委能否看懂这是 per-user CAW account model，而不是共享 demo wallet。
- Demo 使用预创建 active wallet 时，UI 是否仍保留完整真实产品路径。
- SmartAccount baseline 信息不能抢 CAW 主叙事。

学习点：

- 为什么 wallet create 和 wallet connect 是两个不同用户路径。
- 为什么 pairing/pact approval 不是即时后端动作，需要单独状态流。

### Checkpoint 10：Intent Input Guard UX

目标：

- 前端做体验层输入校验，减少用户误输入；安全边界仍在后端。

产物：

- `validateIntentInput(intent)`：
  - 空输入不能提交。
  - 长度限制，例如 500 字符。
  - 明显控制字符提示 `Unsupported characters detected`。
  - 常见 prompt-injection 文本提示为 high-risk input，不在前端声称“完全防护”。
- Run 按钮在前端校验失败时禁用或显示 inline error。
- 后端返回 sanitizer/anomaly rejection 时，DecisionChain 显示为 security rejection，不混成网络错误。

审查重点：

- 错误文案是否直白，不教育用户写 prompt。
- 前端校验不会让人误以为浏览器是安全边界。

学习点：

- 前端 validation 是 UX，后端 validation 才是 security boundary。

### Checkpoint 11：Settings Page + Pact Sync Status

目标：

- 用户可以调整 Sentinel 风控配置，并看懂这些配置与 CAW Pact 是否同步。

产物：

- 新增 `/settings` 页面。
- 配置区：
  - swap pass / confirm threshold。
  - transfer pass / confirm threshold。
  - slippage pass / confirm threshold。
  - frequency limit。
  - whitelist mode。
  - custom whitelist。
  - auto approve low risk。
- 保存后显示：
  - `Sentinel config updated`
  - `CAW Pact synced` 或 `CAW Pact update required`
- 如果 `config_status = needs_pact_update`，首页和 Settings 都显示轻量 warning。

审查重点：

- 用户不会误以为改了 Sentinel config 就自动改了 CAW Pact。
- Settings 页面保持工具型、紧凑，不做营销页。

学习点：

- Sentinel config 和 CAW Pact policy 是双层控制，不是同一个状态。

### Checkpoint 12：CAW Evidence Audit + Policy Deny Visual

目标：

- Audit 页展示 Cobo 评委关心的 CAW 证据链。

产物：

- Audit list 支持 user-scoped records、status filter、分页。
- Audit detail 展开区显示：
  - user address。
  - CAW wallet id/address。
  - pact id/status。
  - request id。
  - transaction id。
  - tx hash / explorer links。
  - policy deny reason。
  - execution backend。
- 单独处理 CAW policy deny 视觉：
  - 不和普通 Sentinel reject 混在一起。
  - 文案强调 `Sentinel allowed, CAW Pact blocked execution`。

审查重点：

- 能否讲清 “Sentinel AI risk control + CAW infrastructure-enforced policy”。
- 没有 tx hash 时只展示 CAW request/transaction evidence，不伪造 explorer 链接。

学习点：

- 为什么 CAW request id / pact id 也是审计证据。

### Checkpoint 13：CAW contract_call Demo UI

目标：

- 在前端展示 CAW 不只支持 transfer，也能执行受控 contract_call。

产物：

- 增加一个稳定 preset，例如 whitelisted MockDEX / controlled contract call。
- DecisionChain / Audit evidence 显示：
  - target contract。
  - function selector 或 action label。
  - CAW contract_call request id。
  - policy result。
- 如果后端选择 dry-run 或 mock evidence，UI 必须明确标注，不暗示真实链上执行。

审查重点：

- contract_call 不抢 safe transfer 主线。
- UI 文案不把 MockDEX 伪装成 Uniswap 实盘。

学习点：

- 为什么 Cobo 赛道展示 contract_call 能力有价值，但 demo 稳定性优先。

### Checkpoint 14：Agent Evidence UI（Tools + Memory + MCP）

目标：

- 让 “Agent 项目” 不只展示 loop，还能展示工具调用、用户记忆和 MCP 互操作证据。

产物：

- Agent B/C 区块增加 tool evidence：
  - `check_contract_verified`
  - `check_gas_price`
  - `get_token_price` 或 mock/static price provider
- Memory anomaly 区块：
  - average amount。
  - current amount multiplier。
  - unusual target / common target。
  - resulting finding or confirm reason。
- MCP evidence panel：
  - 显示外部 Agent 调用 `evaluate_transaction` 的一条示例结果。
  - 先作为 read-only evidence，不做前端编辑 MCP config。

审查重点：

- Agent evidence 是辅助层，不打断 CAW 主 demo 流。
- 不把外部 API 不稳定性暴露给 demo 主路径；必要时使用 mock/static evidence。

学习点：

- Tool calling 解决“Agent 会查证据”，memory 解决“Agent 记得用户模式”，MCP 解决“Sentinel 可被其他 Agent 调用”。

### Checkpoint 15：Auth UX + Rate Limit Error

目标：

- 配合后端 minimal auth，避免 per-user CAW API 看起来只靠裸传地址。

产物：

- Connect wallet 后签名登录。
- 保存 JWT，后续 API 调用自动携带。
- 401 时显示重新签名提示。
- 429 时显示 `Too many requests. Try again shortly.`。

范围边界：

- 不做完整账户系统。
- 不做复杂 session management。

### Checkpoint 16：Deferred Advanced Agent UI

- Planner 多步执行 UI 后放，等后端 `ExecutionPlan` 稳定后再做。
- Reflection UI 后放，可先进入 README roadmap。
- Pending queue UI 后放，等后端真的有 pending/retry worker 再做。

## 范围边界

- 当前 MVP 不做 wallet connect；Post-MVP CAW lifecycle 需要 wallet connect / signature login。
- 当前 MVP 不做认证；Post-MVP per-user CAW API 需要 minimal auth UX。
- 不做 Redux / Zustand。
- 不做 i18n。
- 不做图表。
- 不做移动端精修。
- 不做页面上的 mock/API 切换按钮。
- 不做链上事件审计读取；后续可以作为增强。
- 不做真实 streaming；第一版 API 返回完整结果，前端用 skeleton 和 stagger reveal 模拟检查过程。
- 不做前端 CAW wallet 操作、pact approval、签名或资金提交；前端只展示后端返回的 CAW evidence。
- `/frontend-map` 是内部学习页，不作为产品功能包装。

## 测试计划

运行：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
```

手动验收：

- 成功场景：`Swap 0.01 ETH to USDC` 展示完整通过链路和 tx hash。
- Agentic retry 场景：`Swap 0.2 ETH to USDC` 展示 attempt 1 reject、suggestion、revised proposal、attempt 2 executed。
- 拦截场景：`Swap 1 ETH to USDC` 展示硬规则拒绝，并跳过后续执行。
- 确认场景：`Send 0.03 ETH to 0x742d...` 进入 `confirm_needed`，Approve / Reject 都能走到终态。
- Audit 页面能展开成功、agent retry、拦截、确认后的记录。
- 顶部状态栏能清楚区分 CAW 主执行上下文和 SmartAccount baseline/fallback 状态。
- `/frontend-map` 能用中文讲清楚接口、类型、组件、数据流、attempts、CAW evidence。
- Etherscan 和 Blockscout 链接 demo 前可打开。
- 如果后端没有 tx hash，只展示 CAW request / transaction evidence，不生成 explorer 链接。
