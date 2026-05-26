# Sentinel Hackathon — 前端技术规格

> **给 Claude Code CLI 的上下文文档**
> **目标**: 为 Sentinel 构建一个简洁的 demo 前端，展示交易执行和风控拦截的完整流程

---

## 项目背景

Sentinel 是一个 AI Agent DeFi 执行系统，核心链路：

```
用户输入意图 → AI Agent 生成交易方案 → 风控 Pipeline 审查 → 执行或拦截 → 审计日志
```

前端需要展示这条完整链路，让用户看到每一步的决策过程。

## 后端 API（前端需要对接的）

后端会暴露以下接口（FastAPI / Flask）：

```
POST /api/execute
  Body: { "intent": "Swap 0.1 ETH to USDC" }
  Response: {
    "tx_id": "uuid",
    "status": "executed" | "rejected" | "confirm_needed",
    "decision_chain": {
      "agent_a": { "proposal": {...} },
      "hard_rules": [
        { "rule": "SlippageRule", "passed": true, "reason": "OK" },
        { "rule": "AmountRule", "passed": true, "reason": "OK" }
      ],
      "agent_b": { "passed": true, "risk_level": "low", "findings": [], "reasoning": "..." },
      "agent_c": { "passed": true, "risk_level": "low", "findings": [], "reasoning": "..." },
      "decision": "executed",
      "decision_reason": "双 Agent 通过",
      "simulation": { "success": true, "gas_estimate": 150000 },
      "tx_hash": "0x..." | null
    }
  }

GET /api/audit-log
  Response: [
    { "tx_id": "...", "timestamp": "...", "intent": "...", "decision": "...", "tx_hash": "..." },
    ...
  ]

GET /api/audit-log/{tx_id}
  Response: { 完整的单条审计记录 }
```

## 页面设计

### 页面 1：交易执行页（主页面）

布局：单页面，左侧输入，右侧结果展示

**左侧面板 — 用户输入：**
- 文本输入框：用户输入自然语言意图（如 "Swap 0.1 ETH to USDC"）
- 发送按钮
- 快捷按钮（预设常用操作）：
  - "Swap 0.01 ETH to USDC"
  - "Swap 0.1 ETH to USDC"
  - "Swap 1 ETH to USDC"（这个应该被风控拦截，用于 demo）

**右侧面板 — 决策链路展示：**

发送后，右侧逐步展示决策链路，每一步用卡片展示：

```
┌─────────────────────────────────────┐
│ Step 1: Agent A — 交易方案           │
│ ✅ 生成完成                          │
│ Action: swap                         │
│ From: 0.1 ETH → To: USDC            │
│ Contract: 0x... (Uniswap V3 Router) │
│ Slippage: 3%                         │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Step 2: 硬规则检查                   │
│ ✅ SlippageRule — 通过 (3% < 5%)    │
│ ✅ AmountRule — 通过 (0.1 < 1 ETH)  │
│ ✅ WhitelistRule — 通过              │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Step 3: Agent B + C 并行审查         │
│                                     │
│ B (Security Auditor):               │
│ ✅ 通过 — 无注入风险，合约可信       │
│                                     │
│ C (Risk Analyst):                   │
│ ✅ 通过 — 市场正常，滑点合理         │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Step 4: 决策                         │
│ ✅ 执行 — 双 Agent 通过              │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Step 5: 链上执行                     │
│ TX: 0xabcd...1234                   │
│ Block: 12345678                     │
│ Gas: 150,000                        │
│ [View on Etherscan ↗]               │
└─────────────────────────────────────┘
```

**被拦截的场景展示（重要！这是亮点）：**

```
┌─────────────────────────────────────┐
│ Step 1: Agent A — 交易方案           │
│ ✅ 生成完成                          │
│ Action: swap                         │
│ From: 1 ETH → To: USDC              │
│ Slippage: 8%                         │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Step 2: 硬规则检查                   │
│ ❌ SlippageRule — 拦截 (8% > 5%)    │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Step 3-5: 跳过（已被硬规则拦截）     │
└─────────────────────────────────────┘

❌ 交易被拦截
原因: 滑点 8% 超过阈值 5%
```

### 页面 2：审计日志页

- 表格展示所有历史交易记录
- 列：时间、意图、决策（✅/❌）、原因、TX Hash
- 点击行展开完整决策链路（同主页面的展示格式）

## 技术栈

- **框架**: Next.js（Sentinel 前端已有 Scaffold-ETH 2 基础，直接复用）
- **样式**: TailwindCSS
- **组件**: shadcn/ui 或简单的自定义组件
- **状态管理**: React useState 就够，不需要 Redux/Zustand
- **API 调用**: fetch 或 axios

## 关键组件

```
frontend/
├── app/
│   ├── page.tsx                  # 主页面（交易执行）
│   ├── audit/
│   │   └── page.tsx              # 审计日志页
│   └── layout.tsx
├── components/
│   ├── IntentInput.tsx           # 输入框 + 快捷按钮
│   ├── DecisionChain.tsx         # 决策链路展示（核心组件）
│   ├── StepCard.tsx              # 单步决策卡片
│   ├── AuditTable.tsx            # 审计日志表格
│   ├── StatusBadge.tsx           # ✅通过 / ❌拦截 / ⚠️待确认
│   └── TxHashLink.tsx            # Etherscan 链接
├── lib/
│   └── api.ts                    # API 调用封装
└── styles/
    └── globals.css
```

## 交互细节

1. **逐步加载动画**: 决策链路每一步依次出现（模拟真实的执行过程），间隔 500ms-1s
2. **状态颜色**: 通过=绿色，拦截=红色，待确认=黄色，执行中=蓝色动画
3. **拦截时重点展示**: 红色边框 + 拦截原因高亮 + 被拦截的规则名
4. **TX Hash 可点击**: 链接到 Sepolia Etherscan

## Demo 故事线（给评委展示用）

1. 输入 "Swap 0.01 ETH to USDC" → 全链路通过 → 展示 TX Hash → "正常执行"
2. 输入 "Swap 1 ETH to USDC" → 被硬规则拦截 → "风控生效"
3. 切换到审计日志页 → 展示历史记录 → "完整可审计"

整个 demo 控制在 2-3 分钟内。

## 注意事项

- 不需要复杂的动画库，CSS transition 够用
- 不需要 wallet connect（demo 用模拟数据 + 真实后端 API）
- 移动端不用管，评委用电脑看
- 暗色主题更适合技术 demo
- 如果后端 API 还没好，先用 mock 数据开发（hardcode 几条决策链路 JSON）

## Mock 数据（后端没好之前用这个）

```json
{
  "tx_id": "demo-001",
  "status": "executed",
  "decision_chain": {
    "agent_a": {
      "proposal": {
        "action": "swap",
        "from_token": "ETH",
        "to_token": "USDC",
        "amount": "0.01",
        "to_contract": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        "slippage": 0.03,
        "expected_output": "24.69 USDC"
      }
    },
    "hard_rules": [
      { "rule": "SlippageRule", "passed": true, "reason": "3% < 5% threshold" },
      { "rule": "AmountRule", "passed": true, "reason": "0.01 ETH < 1 ETH limit" },
      { "rule": "WhitelistRule", "passed": true, "reason": "Uniswap V3 Router whitelisted" }
    ],
    "agent_b": {
      "passed": true,
      "risk_level": "low",
      "findings": [],
      "reasoning": "No prompt injection detected. Target contract is verified Uniswap V3 Router. No suspicious authorization patterns."
    },
    "agent_c": {
      "passed": true,
      "risk_level": "low",
      "findings": [],
      "reasoning": "Slippage 3% is within normal range. Amount 0.01 ETH is well within budget. Market conditions are stable."
    },
    "decision": "executed",
    "decision_reason": "All checks passed. Both agents approved.",
    "simulation": { "success": true, "gas_estimate": 152340 },
    "tx_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  }
}
```

拦截场景 mock:

```json
{
  "tx_id": "demo-002",
  "status": "rejected",
  "decision_chain": {
    "agent_a": {
      "proposal": {
        "action": "swap",
        "from_token": "ETH",
        "to_token": "USDC",
        "amount": "1",
        "to_contract": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        "slippage": 0.08,
        "expected_output": "2469 USDC"
      }
    },
    "hard_rules": [
      { "rule": "SlippageRule", "passed": false, "reason": "8% > 5% threshold" }
    ],
    "agent_b": null,
    "agent_c": null,
    "decision": "rejected",
    "decision_reason": "Hard rule violation: SlippageRule",
    "simulation": null,
    "tx_hash": null
  }
}
```

---

> **Last updated**: 2026-05-26
