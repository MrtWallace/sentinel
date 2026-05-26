# CLAUDE.md — Sentinel Hackathon (Frontend)

## 你在做什么

为 Sentinel 构建 demo 前端，展示 AI Agent DeFi 交易的完整决策链路。

先读 `docs/frontend-spec.md` 了解完整设计规格。

## 项目位置

- 前端代码: `sentinel/frontend/` (已有 Scaffold-ETH 2 基础)
- 后端 spec: `docs/frontend-spec.md`

## 核心页面

### 页面 1: 交易执行页
- 左侧: 自然语言输入 + 快捷按钮
- 右侧: 决策链路逐步展示（Step 1-5 卡片）
- 两种场景都要支持: 正常执行（绿色）和被拦截（红色）

### 页面 2: 审计日志页
- 表格展示历史交易
- 点击展开完整决策链路

## 技术约束

- 用 Next.js + TailwindCSS（已有基础）
- 不需要 wallet connect（用 mock 数据或后端 API）
- 暗色主题
- 移动端不用管
- 不要加复杂动画库，CSS transition 够用

## 开发顺序

1. 先用 mock 数据开发（后端 API 可能还没好）
2. 页面 1: IntentInput 组件
3. 页面 1: DecisionChain 组件（核心）
4. 页面 2: AuditTable 组件
5. 对接后端 API（替换 mock）

## Mock 数据

`docs/frontend-spec.md` 底部有完整的 mock JSON，直接用。

## 不要做的事

- 不要加 wallet connect / MetaMask
- 不要做用户认证
- 不要加 Redux / Zustand
- 不要做移动端适配
- 不要加 i18n

## Demo 故事线

1. "Swap 0.01 ETH to USDC" → 全链路通过 → 展示 TX Hash
2. "Swap 1 ETH to USDC" → 被硬规则拦截 → 展示拦截原因
3. 切换审计日志 → 展示历史记录

整个 demo 2-3 分钟。
