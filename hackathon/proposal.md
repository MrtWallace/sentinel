# Sentinel — 让 AI Agent 安全地参与链上经济活动

> **赛道**: Cobo — Agentic Economy × Cobo Agentic Wallet
> **方向**: 04｜Autonomous Trading — 带风控的自主交易 Agent
> **学员**: Mr Wallace (#3752)
> **时间**: 2026-06-01 ~ 2026-06-14

---

## 1. 目标用户

使用 AI Agent 自主执行链上交易（swap、transfer）的个人投资者和 DAO 金库管理者。

他们想要的：把交易意图告诉 Agent，Agent 安全地替他们完成链上操作。
他们害怕的：Agent 决策错误、被 prompt injection 攻击、超授权操作，导致资金不可逆损失。

## 2. 问题定义

**场景**: 用户让 AI Agent 自主执行 DeFi 操作，Agent 需要同时具备「执行能力」和「安全边界」。

- **没有 AI**: 用户手动监控价格、手动发交易、手动判断滑点/合约安全性 → 效率低、反应慢
- **没有 Web3**: AI 可以给交易建议，但无法自主执行、无法保证权限边界、无法留下不可篡改的审计记录 → 执行链路断裂
- **没有安全层**: Agent 直接控制资金，一个错误决策就是真金白银损失 → 不敢用

**核心问题**: AI Agent 控制真实资金时，如何让它「能做事」的同时「不出事」？

## 3. 解决方案

Sentinel = **AI 风控层** + **Cobo Agentic Wallet (CAW)**，实现受控边界内的自主交易。

- **Sentinel** 负责执行前的 AI 风险判断（该不该做、值不值得做、有没有异常）
- **CAW** 负责资金权限边界和 infrastructure-enforced policy 兜底（做多少、在哪做）
- 两层互补：AI 风控拦逻辑风险，CAW Pact 拦资金越权

**一句话 pitch**: Sentinel 让 AI Agent 在受控边界内自主执行链上交易 — 多 Agent 风控 + 智能账户权限 + 完整审计链路。

## 4. MVP Demo 链路

```
用户意图 ("swap 0.1 ETH to USDC")
  → Agent A 解析为结构化 TxProposal
  → 硬规则层（滑点/金额/白名单/频率）
  → Agent B (Security) + Agent C (Risk) 并行审查
  → DecisionEngine 决策（execute / confirm / reject）
  → Bounded Retry Loop（最多 2 次，reject 时根据建议重生成）
  → CAW Pact 执行（受 pact 资金边界约束）
  → 完整审计日志
```

**Demo 展示三个场景：**
1. ✅ **正常执行**: 低风险 swap，通过所有检查，CAW 自动执行
2. 🚫 **被拦截**: 高滑点/超限额交易，被硬规则或 Agent 审查拒绝
3. ⚠️ **人工确认**: 中风险交易，等待用户确认后执行

## 5. 技术架构

### 双层防护架构

```text
┌─────────────────────────────────────────────┐
│              Sentinel (AI 风控层)              │
│                                               │
│  Agent A (Executor)                           │
│    ├── 解析用户意图 → 结构化 TxProposal        │
│    └── Bounded Retry: 最多 2 次重生成          │
│                                               │
│  RiskPipeline (硬规则，零 LLM 成本)            │
│    ├── 滑点 > 5%? → 拦                        │
│    ├── 金额 > 上限? → 拦                       │
│    ├── 合约不在白名单? → 拦                     │
│    └── 频率异常? → 拦                          │
│                                               │
│  Agent B (Security) + Agent C (Risk) 并行      │
│    ├── B: 该不该做（prompt injection / 越权）   │
│    └── C: 值不值得做（滑点 / 市场 / 金额）      │
│                                               │
│  DecisionEngine → execute / confirm / reject   │
│  AuditLogger → 完整决策链路记录                 │
└──────────────────────┬────────────────────────┘
                       │ approved
                       ▼
┌─────────────────────────────────────────────┐
│        CAW (Cobo Agentic Wallet)              │
│                                               │
│  Pact (预先审批的资金权限边界)                  │
│    ├── 金额上限                                │
│    ├── 合约 allowlist                          │
│    ├── 频率限制                                │
│    └── function selector 约束                  │
│                                               │
│  执行层                                       │
│    ├── transfer_tokens                         │
│    ├── contract_call                           │
│    └── 返回 tx hash + execution result         │
└─────────────────────────────────────────────┘
```

### AI 层
- **Agent A (Executor)**: DeepSeek，理解用户意图，输出结构化 JSON 交易方案
- **Agent B (Security Auditor)**: 同 LLM 不同 Prompt，检查 prompt injection、越权指令、可疑合约
- **Agent C (Risk Analyst)**: 同 LLM 不同 Prompt，评估滑点、金额风险、市场条件
- B 和 C **并行调用**，耗时 = max(B, C)
- **Bounded Retry Loop**: reject + suggestions 时，Agent A 最多重生成 2 次 TxProposal

### Web3 层
- **主执行路径**: CAW — Agent 的资金账户，受 Pact policy 约束
- **Fallback / 技术展示**: SmartAccount.sol (ERC-4337) — Foundry 测试 + Sepolia 部署
- Uniswap V3 exactInputSingle 作为 swap 执行
- CAW Pact 在 demo 前预先提交并由 owner 审批

### 风控层
- **硬规则** (代码，零 LLM 成本): 滑点/金额/白名单/频率
- **Agent 审查** (B + C 并行): 安全审计 + 风险分析
- **投票决策**: B+C 通过→执行；任一拒绝→拒绝；矛盾→拒绝（保守）
- **CAW Policy**: infrastructure-enforced 资金边界，兜底防护

## 6. 风险边界

| 维度 | 处理方式 |
|------|----------|
| 涉及资金 | 测试网 ETH (Sepolia)，不上主网 |
| Agent 自治边界 | 最多重试 2 次，不做无限自治 |
| 不可逆动作 | Sentinel 风控 + CAW Pact 双层拦截 |
| 自动化边界 | 低风险自动执行，高风险拒绝，中风险人工确认 |
| LLM 失败 | 返回非法 JSON/超时 → 拒绝或要求人工确认 |
| 最大技术风险 | 多 Agent 一致性延迟导致交易时机错过 |
| Fallback | Agent 分歧时降级为规则引擎；CAW 不可用时降级为 SmartAccount |

## 7. 当前进度

| 模块 | 状态 | 详情 |
|------|------|------|
| SmartAccount 合约 | ✅ 完成 | Sepolia 部署 + 验证 + 14 Foundry 测试 |
| Agent A (Intent Parser) | ✅ 完成 | 结构化 JSON 输出 + 6 个 intent 测试 |
| RiskPipeline 硬规则 | ✅ 完成 | 5 条规则 + 37 个单元测试 |
| DecisionEngine | 🔨 进行中 | skeleton 完成，正在补 Agent B/C mock |
| CAW 集成 | ⏳ 待开始 | CP6，预计 5-8h |
| FastAPI 后端 | ⏳ 待开始 | CP5，4 个 API |
| 前端 UI | 🔨 进行中 | 独立 worktree 开发中 |
| E2E Demo | ⏳ 待开始 | CP8 |

**测试覆盖**: 49 个单元测试通过 (intent + risk rules + pipeline + decision)

## 8. 验证方式

- 测试网交易记录：≥5 笔正常 swap + ≥3 笔被风控拦截
- CAW Pact 演示：展示 pact 预设 → 运行时执行 → policy denied 场景
- Demo 视频：完整展示"正常执行"、"被拦截"、"人工确认"三个场景
- Repo：README 说明架构、部署步骤、风控逻辑、CAW 集成
- 审计日志：每笔交易的完整决策链路（intent → rules → agents → decision → execution）

## 9. 赛道匹配理由

Cobo 赛道核心要求：**Agent 在受控边界内参与经济活动**。

| 赛道要求 | Sentinel 对应 |
|----------|---------------|
| Agent 资金操作流程 | 完整链路：意图 → 解析 → 风控 → CAW 执行 → 审计 |
| 权限边界 + 安全控制 | Sentinel 硬规则 + Agent 审查 + CAW Pact 资金约束 |
| 链上或测试网证据 | Sepolia 部署 + CAW tx hash + Etherscan 验证 |
| 用户理解和复现 | 审计日志 + 前端决策链路展示 + README 部署文档 |

**最对口方向**: 「自主交易 / 资金调度」+「安全控制」

**叙事角度**: Sentinel 让 AI Agent **安全地参与**链上经济活动。风控是手段，让 Agent 自主执行经济活动才是目的。

## 10. 评审维度对照

| 维度 | 分值 | Sentinel 得分点 |
|------|------|----------------|
| **Innovation 创新性** | 10 | 多 Agent 风控 + CAW 双层防护 + Bounded AgenticLoop（LLM 想 + 代码验的 MutationGuard）。不是单 LLM 多 prompt，而是 Agent 审查 → 建议 → 自动修正 → 代码验证的完整闭环 |
| **Technical Execution 技术实现** | 10 | 后端 49+ 单元测试（intent/risk/pipeline/decision）、合约 14 Foundry 测试、Sepolia 真实部署 + 验证、FastAPI 4 API、CAW 真实集成。核心功能全部可运行 |
| **User Experience 用户体验** | 10 | NL 输入 → Agent 推理可视化 → 决策链路展示 → 审计日志。用户路径清晰：输入意图 → 看到 Agent 如何决策 → 理解为什么通过/拒绝 → 查看链上证据 |
| **Ecosystem Impact 生态影响** | 10 | Sentinel 定义了"AI Agent 安全参与链上经济活动"的基础设施范式。后续可扩展：多链支持、更多 DeFi 协议、DAO 金库自动化、Agent 市场准入标准 |
| **Demo Quality 演示质量** | 10 | 三个场景完整覆盖：✅ 正常执行（低风险 swap 自动完成）→ 🚫 风控拦截（超限额被拒 + Agent 给出修正建议）→ ⚠️ CAW 双层防护（Sentinel 通过但 CAW Pact 拒绝）|

## 11. 技术栈

- **AI**: DeepSeek API (多 Agent 同 LLM 不同 Prompt)
- **后端**: Python + FastAPI + Pydantic
- **合约**: Solidity + Foundry (SmartAccount.sol, baseline/fallback)
- **钱包**: Cobo Agentic Wallet (CAW) — Pact + MPC
- **前端**: Next.js + Scaffold-ETH 2 hooks (Claude Code 生成)
- **DeFi**: Uniswap V3 (Sepolia)
- **测试**: pytest (49 tests) + Foundry (14 tests)

---

> **Last updated**: 2026-06-02
