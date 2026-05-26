# Sentinel — AI Agent DeFi 执行的安全护栏

> **赛道**: Wallet / Permission / Safe Execution
> **学员**: Mr Wallace (#3752)
> **时间**: Week 3-4 (2026-06-01 ~ 2026-06-14)

---

## 1. 目标用户

使用 AI Agent 自动执行 DeFi 操作（swap、approve、deposit）的个人投资者和 DAO 金库管理者。

## 2. 问题定义

**场景**: 用户让 AI Agent 自动执行链上交易，一旦 Agent 决策错误或被 prompt injection 攻击，资金直接损失且不可逆。

- **没有 AI**: 用户需要手动监控价格、手动发交易、手动判断滑点/合约安全性 → 效率低、反应慢
- **没有 Web3**: AI 可以给出交易建议，但无法自主执行、无法保证权限边界、无法留下不可篡改的审计记录 → 执行链路断裂

**核心问题**: AI Agent 控制真实资金时，谁来保证它的每一步决策都是安全的？

## 3. MVP（Week 4 交付）

**最小 demo 链路**:

```
用户意图 → Agent A (Executor) 生成交易方案
  → 硬规则检查（滑点/金额/白名单）
  → Agent B (Security Auditor) + Agent C (Risk Analyst) 并行审查
  → 代码投票决策（执行/人工确认/拒绝）
  → eth_call 模拟 → SmartAccount 链上执行
  → 审计日志记录
```

- **真实调用**: DeepSeek API、同 LLM 多 Agent（不同 Prompt）、Uniswap V3 (Sepolia)、SmartAccount 合约
- **mock**: 前端 UI（Claude Code 生成）、部分风控规则（初期覆盖滑点 + 可疑合约 + 重复授权）

## 4. 技术路径

### AI 层
- **Agent A (Executor)**: DeepSeek，理解用户意图，规划交易路径，输出结构化 JSON 交易方案
- **Agent B (Security Auditor)**: 同 LLM 不同 Prompt，检查 prompt injection、越权指令、可疑合约、异常授权
- **Agent C (Risk Analyst)**: 同 LLM 不同 Prompt，评估滑点、金额风险、市场条件、重复交易模式
- B 和 C **并行调用**，耗时 = max(B, C)

### Web3 层
- ERC-4337 SmartAccount 作为执行层
- 权限策略限制：预算上限、可调用合约白名单、单笔金额限制
- Uniswap V3 exactInputSingle 作为 swap 执行

### 风控层（Pipeline 架构）
```
硬规则层（代码，零成本）
  ├── 滑点 > 5%? → 直接拦
  ├── 金额 > 上限? → 直接拦
  ├── 合约不在白名单? → 直接拦
  └── 通过 → 进入 Agent 审查

Agent 审查层（B + C 并行）
  ├── B: 安全审查（该不该做）
  └── C: 风险审查（值不值得做）

代码投票决策
  ├── B 通过 + C 通过 → 自动执行
  ├── B 拒绝 或 C 拒绝 → 自动拒绝
  ├── B 和 C 矛盾 → 拒截（保守策略）
  └── 中风险 → 人工确认

eth_call 模拟 → SmartAccount 执行 → 审计日志
```

### 复用代码
- Sentinel 现有 Agent → SmartAccount → Uniswap swap 链路，100% 复用

## 5. 风险边界

| 维度 | 处理方式 |
|------|----------|
| 涉及资金 | 测试网 ETH，不上主网 |
| 不可逆动作 | 交叉验证层必须在执行前拦截 |
| 自动化边界 | 低风险自动执行，高风险暂停，中风险人工确认 |
| 最大技术风险 | 多 Agent 一致性判断延迟导致交易时机错过 |
| Fallback | Agent 分歧时降级为规则引擎结果 |

## 6. 验证方式

- 测试网交易记录：≥5 笔正常 swap + ≥3 笔被风控拦截
- Demo 视频：完整展示"正常执行"和"被拦截"两个场景
- Repo：README 说明架构、部署步骤、风控逻辑
- 审计日志：每笔交易的完整决策链路

## 7. 赛道选择理由

Wallet/Permission/Safe Execution 直接对应 Sentinel 核心能力：AI Agent 通过智能账户执行链上操作时的安全保障。在已有基础上加深安全层，不是做新东西。

## 8. 方向 Backlog

- ~~Agentic Commerce / Payment~~: Sentinel 不涉及服务购买和支付闭环
- ~~Dev Tooling~~: 跟 Sentinel 关联弱
- ~~Governance~~: 需要 DAO 治理知识，不在能力范围内

## 9. Week 3 下一步

1. 选定 Agent B/C 的 Prompt 设计
2. 实现多 Agent 交叉审核原型
3. 设计风控 Pipeline 框架 + 初始规则集
4. 修补 Sentinel 已有 5 个 bug
5. 准备 Week 4 sprint plan

---

> **Last updated**: 2026-05-26
