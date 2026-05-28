# Sentinel 前端 MVP 更新计划

## 总结

前端做成 **AI 风控执行控制台**：打开页面后直接演示自然语言意图如何经过 AI 提案、硬规则、Agent 审查、确认/执行/拦截，并留下审计记录。

同时新增一个专门的 **前端理解层**：让项目作者能讲清楚每个组件在干什么、接口传什么数据、数据如何从 API 变成页面展示。这个部分用于内部学习和项目介绍，不进入评委 demo 主流程。

给项目作者看的开发计划和文档用中文；前端 UI 和对外 demo 文案用英文。

## 核心页面

### 首页 `/`

首页是执行控制台。

- 顶部状态栏读取真实链上状态：SmartAccount 余额、daily limit、daily spent、agent、network。
- 左侧输入 intent，提供 demo 快捷按钮：成功 swap、被拦截 swap、需要确认的大额操作。
- 右侧展示 decision chain：先显示 loading skeleton，再逐步 reveal 每个步骤。

### Audit 页 `/audit`

Audit 页用于展示审计记录。

- 表格列：time、intent、status、reason、tx hash。
- 点击行展开完整 decision chain。
- Audit v1 使用 API/mock `decision_chain`，暂不直接读取链上 `Executed` 事件。

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

新增 API 封装：

- `executeIntent(intent: string)`：提交自然语言意图，返回一次执行决策结果。
- `confirmExecution(txId: string, approved: boolean)`：处理需要二次确认的交易；对应后端 `POST /api/confirm`，MVP 只更新审计状态，不假设会触发真实链上执行。
- `getAuditLog()`：获取审计列表。
- `getAuditLogItem(txId: string)`：获取单条完整审计记录。

第一版 `api.ts` 使用同真实接口形状一致的 mock 数据。后端 API 完成后，只替换 `api.ts` 内部实现，页面和组件不改。

## 前端理解层

新增中文文档：`hackathon/docs/frontend-implementation-guide.md`。

文档需要解释：

- 页面结构：`/`、`/audit`、`/frontend-map` 分别负责什么。
- 数据流：用户输入 -> `executeIntent` -> `ExecuteResponse` -> 页面状态 -> `DecisionChain` 展示。
- 接口解释：每个 API 函数传什么、返回什么、为什么需要。
- 类型解释：`DecisionChain`、`RuleCheck`、`AgentReview` 等字段的业务含义。
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

## 展示细节

### 状态栏数据来源

- `useBalance` 读取 SmartAccount ETH balance。
- `useScaffoldReadContract` 读取 `owner`、`agent`、`dailyLimit`、`dailySpent`。
- 合约地址统一来自 Scaffold-ETH contract config，不再硬编码。

### Decision chain 展示层级

- Agent A Proposal：action、amount、token pair、target contract、slippage、expected output。
- Hard Rules：每条 rule 显示 passed/rejected、rule name、reason。
- Agent Reviews：Agent B / Agent C 各自显示 passed、risk level、findings、reasoning。
- Final Decision：executed/rejected/confirm_needed、decision reason、simulation、tx hash。

Audit 展开区复用同一个 `DecisionChain` 组件，避免两套展示逻辑不一致。

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

### Checkpoint 1：类型、mock 数据、API 封装

产物：

- 新增前端类型文件，例如 `lib/sentinel/types.ts`。
- 新增 mock 数据文件，例如 `lib/sentinel/mockData.ts`。
- 新增 API 封装文件，例如 `lib/sentinel/api.ts`。
- 实现 `executeIntent`、`confirmExecution`、`getAuditLog`、`getAuditLogItem` 的 mock 版本。

审查重点：

- 每个接口传什么、返回什么。
- `DecisionChain` 的字段能不能对应 demo 叙事。
- mock 数据是否覆盖 executed、rejected、confirm_needed 三种场景。

学习点：

- “API contract first” 是什么意思。
- 为什么页面只依赖 `api.ts`，后端 ready 后只换这一层。

### Checkpoint 2：Sentinel demo 外壳与状态栏

产物：

- 替换 Scaffold-ETH 默认 Header/Footer 为 Sentinel demo shell。
- 新增顶部状态栏组件。
- 状态栏使用真实链上数据：
  - `useBalance` 读 SmartAccount ETH balance。
  - `useScaffoldReadContract` 读 `owner`、`agent`、`dailyLimit`、`dailySpent`。
  - 合约地址从 Scaffold-ETH contract config 获取，不再硬编码。

审查重点：

- 页面是否去掉无关的 wallet/debug/footer 噪音。
- 状态栏是否只展示 demo 需要的信息。
- 是否仍保留开发时需要的最小导航：Execute / Audit。

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

### Checkpoint 5：Audit 页

产物：

- 新增 `/audit` 页面。
- 新增 `AuditTable`。
- 表格展示 audit log。
- 点击行展开复用 `DecisionChain`。

审查重点：

- Audit 页是否能讲清“可审计”。
- 展开区是否和首页 decision chain 保持一致。
- tx hash 是否同时提供 Etherscan 和 Blockscout 链接。

学习点：

- 列表数据和单条详情数据的区别。
- 为什么 Audit v1 先展示 API/mock decision chain，而不是链上 `Executed` 事件。

### Checkpoint 6：前端理解层

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

审查重点：

- 你能否看着这份文档复述前端数据流。
- `/frontend-map` 是否适合作为 demo 前复习材料。

学习点：

- 前端不是“页面代码”，而是“数据 -> 状态 -> 组件 -> UI”的转换链路。

### Checkpoint 7：验证与小修

产物：

- 运行类型检查和 lint。
- 手动过一遍成功、拦截、确认、Audit、frontend-map。
- 根据验证结果做小修，不做新功能。

审查重点：

- 是否满足计划里的手动验收项。
- 是否有明显 demo 阻断问题。

学习点：

- 前端完成标志不是“看起来差不多”，而是类型检查、lint、关键路径手动验收都过。

## 范围边界

- 不做 wallet connect。
- 不做认证。
- 不做 Redux / Zustand。
- 不做 i18n。
- 不做图表。
- 不做移动端精修。
- 不做页面上的 mock/API 切换按钮。
- 不做链上事件审计读取；后续可以作为增强。
- 不做真实 streaming；第一版 API 返回完整结果，前端用 skeleton 和 stagger reveal 模拟检查过程。
- `/frontend-map` 是内部学习页，不作为产品功能包装。

## 测试计划

运行：

```bash
yarn workspace @se-2/nextjs check-types
yarn workspace @se-2/nextjs lint
```

手动验收：

- 成功场景：`Swap 0.01 ETH to USDC` 展示完整通过链路和 tx hash。
- 拦截场景：`Swap 1 ETH to USDC` 展示硬规则拒绝，并跳过后续执行。
- 确认场景：大额操作进入 `confirm_needed`，Approve / Reject 都能走到终态。
- Audit 页面能展开成功、拦截、确认后的记录。
- 顶部状态栏读取真实 Sepolia SmartAccount 状态。
- `/frontend-map` 能用中文讲清楚接口、类型、组件、数据流。
- Etherscan 和 Blockscout 链接 demo 前可打开。
