# Sentinel — AI Agent for DeFi Operations

> 这是项目的核心上下文文档。Claude Code和其他AI助手在协助本项目时,应先读完此文档。

---

## 1. 项目一句话定位

**Sentinel是AI驱动的DeFi执行层。** 用户用自然语言下达DeFi指令,AI agent在安全护栏内自动解析、构造交易、上链执行,用户随时可介入或撤销。

> 定位调整说明(2026-05-01)：原定位"AI-Operated Smart Account"调整为"AI Agent for DeFi Operations"，以精准匹配Binance AI Agent Engineer岗位JD。合约代码无需改动，只影响README描述、Demo故事线和简历措辞。

> Hackathon/Cobo方向补充(2026-06-06)：当前赛道优先级调整为 **Cobo Agentic Wallet (CAW) 优先的DeFi执行层**。SmartAccount仍是历史MVP和本地/降级执行基线，但评审Demo应尽量完整展示CAW钱包生命周期、CAW Pact护栏、CAW执行证据和策略拒绝链路。

---

## 2. 项目的"为什么"

### 真实痛点
- Web3用户每天花1-2小时盯行情、检查钱包、做rebalance — 时间成本巨大
- 现有自动化工具(Defender、Gelato)对普通用户门槛极高,需要写脚本
- AI Agent + Crypto是2025-2026最热叙事,Coinbase/Anthropic/Virtuals等公司大量投入,但消费级产品稀缺

### 解决方案
让AI agent持有一个受限钱包(Smart Account),用户用自然语言下指令("ETH < $2000时买0.1个"、"每周一付水电费"),AI在限额范围内自动执行,所有操作链上可审计,用户可随时取消。

### 核心差异化
- vs MultiSig钱包:Sentinel的"另一个签名者"是AI而非人类
- vs 现有自动化工具:用自然语言而非脚本配置
- vs 中心化AI Bot:钱包逻辑全部链上,资金永远不离开用户合约

---

## 3. 开发者背景(写给AI助手:理解我的水平,不要假设过高或过低)

- **Solidity水平**:已完成 SpeedrunEthereum 1-5 全部挑战 + Foundry Fund Me 完整教程(含Mock、HelperConfig、8测试全绿)。**已掌握**:基础语法、ERC20/721、Foundry测试结构、Cheatcodes、Fork测试、forge script。**未深入**:Yul、Diamond Pattern、UUPS、复杂Invariant testing。
- **Python水平**:CS本科基础,有Playwright爬虫和自动化经验。从未用过web3.py或Anthropic API。
- **TypeScript/前端**:有React基础,Scaffold-ETH 2用过。**未深入**:wagmi/viem直接调用、Next.js 14 App Router。
- **AI集成经验**:零。这是第一次写"调用LLM API"的代码。
- **认证**:BuidlGuidl Certified Builder。
- **执行特征**:ADHD,需要明确的"完成标志",倾向先跑通再优化,**反感"一次性完美"的诱惑**。

---

## 4. 技术栈选择(已锁定,不要建议替代方案)

| 层 | 技术 | 备注 |
|----|------|------|
| 智能合约 | Solidity 0.8.20+ | 不要用旧版本 |
| 合约工具链 | Foundry (forge/cast/anvil) | **不用Hardhat**,这是练习Foundry的项目 |
| Agent | Python 3.11+ | FastAPI + 风险/执行流水线；历史MVP曾用web3.py脚本 |
| AI模型 | DeepSeek API / OpenAI-compatible client | deepseek-chat；原计划Claude，因国内支付限制改用DeepSeek |
| Cobo CAW | cobo-agentic-wallet / Cobo WaaS | Post-MVP主执行钱包、Pact策略护栏和审计证据 |
| 前端 | Next.js 14 + Scaffold-ETH 2 | 不要从零搭Next |
| 链交互 | wagmi v2 + viem | Scaffold-ETH 2自带 |
| 部署链 | Sepolia testnet | 不要部署主网 |
| 私钥管理 | .env文件 (MVP) | 生产级方案非MVP范围 |

**关键纪律**:
- ❌ 不要建议用LangChain、AI SDK、Coinbase AgentKit等重型框架(MVP/Post-MVP都优先轻量可控)
- ❌ 不要建议EIP-4337 / Account Abstraction标准实现(MVP是简化版)
- ❌ 不要建议多链支持
- ❌ 不要建议复杂的私钥管理方案

---

## 5. MVP范围(锁定边界)

> 本节保留历史MVP边界，主要用于理解项目来源和SmartAccount基线。当前Hackathon扩展以 Cobo/CAW 为优先级最高的Post-MVP方向，具体拆分以 `hackathon/docs/backend-plan.md`、`hackathon/docs/frontend-plan.md` 和 `hackathon/docs/shared-api-contract.md` 为准。

### MVP必须包含
1. **SmartAccount合约**:持有资金,有owner和agent两个角色
2. **每日限额机制**:agent单日花费不能超过owner设置的上限
3. **Foundry测试**:核心函数覆盖率>80%,至少2个Fuzz测试
4. **Python Agent脚本**:接收用户自然语言→Claude API解析→构造交易→签名上链
5. **简易前端**:基于Scaffold-ETH 2,显示余额/限额/历史
6. **Sepolia部署 + Etherscan verified**
7. **2分钟Demo视频**(Loom)

### 阶段3新增模块(2026-05-01更新)

**A. DeFi Swap支持**（Day 6-8）
- 支持Uniswap V3 swap指令："Swap 100 USDC to ETH"
- Agent解析 → encode calldata → 调用execute() → Sepolia真实swap
- 技术前提：execute()需要增加`bytes calldata data`参数（当前技术债）

**B. Evaluation Framework**（Day 3-4，对应Binance JD"测试评估"）
- 20个测试case：自然语言输入 → 期望解析结果
- Python脚本批量跑，统计Claude API解析准确率
- 目标输出："20/20 cases, 90%+ accuracy"

**C. Guardrails**（Day 3-4，对应Binance JD"护栏"）
- 危险地址blacklist（agent拒绝向这些地址转账）
- 超阈值金额需用户输入"yes"二次确认

**D. Latency/Cost Log**（Day 3-4，加分项）
- 每次Claude API调用记录：延迟时间、token消耗
- 面试可说出"avg 2.3s, ~$0.01/action"这种数据

**执行顺序**：A基础转账(Day1-2) → B+C+D扩展(Day3-4) → Mock DEX swap(Day5，降级方案)

> ⚠️ Uniswap V3 直连方案调试失败（SmartAccount→Uniswap 路径有未知错误，直接调 Uniswap 成功但通过合约转发失败）。已切换 Mock DEX 方案，可在 v2 版本再攻 Uniswap。

### MVP明确不包含(防止scope creep)
- ❌ 复杂规则引擎(只支持daily limit)
- ❌ 多agent管理
- ❌ 用户Override时间锁(MVP用直接撤销agent权限替代)
- ❌ 多链
- ❌ 美观UI
- ❌ 真正的Account Abstraction (EIP-4337)

### 阶段6：面试前修复清单（下一阶段）

**P1 必修（Bug）**
- [x] `execute_via_contract` 缺第三个参数 `b""` → 已修复
- [x] 错误处理/重试：`intent.py` + `executor.py` + `main.py` → 已完成
- [ ] 合约缺 `setAgent()` — "owner随时撤销agent权限"在JD里是卖点

**P2 值得加（下次部署一起做）**
- [ ] 合约补全 `Executed` 事件（前端可展示历史记录）
- [ ] `receive()` 函数（支持直接转账到合约）
- [ ] 重部署后 re-verify + 更新前端合约地址

**MVP最后一项**
- [ ] Demo 视频（Loom，2分钟）→ 链接放入 README

**P3 暂不做**
- ENS 链上解析（DeepSeek能解析文本，但实际执行需接 ENS SDK）
- 动态 gas 估算（Sepolia 硬编码够用）
- pause 机制（v2 再加）

### 已知技术债
- `bytes calldata` → `bytes memory` 是关键修复，详见 notes/2026-05-02-uniswap-debug.md
- Uniswap V3 已通过 SmartAccount 成功执行（0.001 ETH → 8.02 USDC on Sepolia）✅

### 当前Hackathon Cobo + Agent路线(2026-06-06)

**总原则**：Cobo/CAW功能尽量全做，Agent功能做成可解释的证据层；高Demo风险的Agent自动化能力后置。

**Cobo优先(P1)**：
- 用户CAW设置拆成两条路径：已有CAW钱包直接连接/导入；没有CAW钱包则注册并创建新的CAW钱包。
- 新创建的CAW钱包不是一次性临时钱包，应持久化到后端数据库，并维护 `wallet_status`、`pairing_status`、`pact_status`。
- 后端执行优先走CAW；CAW Pact策略拒绝必须直接拒绝，不能静默fallback到SmartAccount。
- CAW timeout/API不可用可以进入pending或明确fallback，但必须在审计证据里标出原因。
- Demo必须展示：CAW active、Pact active、CAW request/transaction id、policy denied、Sentinel reject。

**Agent优先(P1/P2)**：
- P1做基础tool calling、只读MCP工具、memory anomaly evidence，让项目不只停留在单轮loop。
- P2再考虑planner/reflection、多步自动化、写操作MCP等Demo风险更高的能力。

**输入安全**：
- 前端做UX层输入检测：长度、明显非法字符、危险格式提示、按钮禁用和错误文案。
- 后端才是安全边界：Pydantic/schema校验、sanitize、LLM prompt injection提示、risk/anomaly判断、rate limit。

**工作流**：
- 继续使用后端/前端分离的两个分支和worktree开发；通过 `shared-api-contract.md` 作为联调契约。
- 每个跨端功能完成前，需要先更新shared contract和对应plan，再进入代码实现。

---

## 6. 项目结构

```
sentinel-backend/
├── PROJECT_CONTEXT.md          # 本文档
├── README.md                    # 项目说明(对外)
├── .gitignore
│
├── contracts/                   # Foundry项目
│   ├── src/
│   │   └── SmartAccount.sol
│   ├── test/
│   │   └── SmartAccount.t.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── foundry.toml
│
├── agent/                       # Python AI Agent
│   ├── main.py                  # 主循环
│   ├── intent.py                # LLM意图解析
│   ├── executor.py              # 链上交易执行
│   ├── requirements.txt
│   ├── .env.example
│   └── venv/                    # 虚拟环境(gitignore)
│
└── hackathon/                   # Hackathon planning/docs
    ├── README.md
    ├── CLAUDE-backend.md
    ├── CLAUDE-frontend.md
    ├── proposal.md              # External-facing proposal, keep concise
    └── docs/
        ├── backend-plan.md
        ├── frontend-plan.md
        ├── shared-api-contract.md
        ├── mvp-spec.md          # Historical MVP archive, not active source of truth
        └── post-mvp-requirements.md

frontend worktree:
/home/admini/sentinel-frontend   # branch feature/frontend-risk-console
```

---

## 7. 开发路线图(历史MVP，更新于2026-05-01)

> 下面表格是原始SmartAccount MVP路线。当前Cobo/Agent Post-MVP路线不要在这里继续扩展，统一维护到 `hackathon/docs/backend-plan.md`、`hackathon/docs/frontend-plan.md` 和 `hackathon/docs/shared-api-contract.md`。

| 阶段 | 任务 | 完成标志 | 状态 |
|------|------|---------|------|
| 0 | 项目骨架 + GitHub | repo已push | ✅ |
| 1 | SmartAccount合约 + 限额机制 | `forge build`通过 | ✅ |
| 2 | Foundry测试套件 | `forge test`全绿,coverage>80% | ✅ |
| 3-Day1-2 | Python连接Sepolia + 基础ETH转账 | 终端打印余额；"发0.001 ETH"真实执行 | ✅ |
| 3-Day3-4 | Evaluation Framework + Guardrails + Cost Log | 20 cases准确率输出；危险地址被拦截 | ✅ |
| 3-Day5-6 | Uniswap V3 Swap支持 | "Swap 0.001 ETH to USDC"Sepolia执行成功，收到8.02 USDC | ✅ |
| 4 | Scaffold-ETH 2前端 | 浏览器能看到合约状态 | ⬅️ 下一步 |
| 5 | Sepolia部署 + Demo视频 | Etherscan verified + Loom链接 | 待做 |

---

## 8. 演示视频脚本(更新于2026-05-01)

```
[0:00-0:20] 痛点
"DeFi操作复杂，普通人根本不会用Uniswap。"

[0:20-0:50] 方案
"Sentinel = AI-driven DeFi assistant. 自然语言下指令，AI在护栏内执行。"

[0:50-1:20] 演示1：自然语言Swap
[终端]
> Swap 100 USDC to ETH
[Claude解析] → [encode calldata] → [Sepolia执行]
→ Etherscan显示Uniswap V3 swap成功

[1:20-1:50] 演示2：Guardrail保护
[终端]
> Send 10 ETH to 0x危险地址...
[Agent] ❌ Blocked: address on blacklist
> Send 5 ETH to 0x朋友...
[Agent] ⚠️ Amount exceeds threshold. Confirm? (yes/no)

[1:50-2:00] 收尾
"From intent to execution. Sepolia today, mainnet next."
```

**备用方案**（如Uniswap做不通）：改用自己部署的Mock DEX合约演示swap。故事和定位不降级，技术可简化。

---

## 9. 给AI助手的协作准则(重要!)

### 我希望你这样帮我

✅ **教练模式优先**:除非我明确说"帮我写完",否则你应该:
1. 先解释概念和设计思路
2. 让我自己尝试写
3. 我卡住时给提示而不是直接答案
4. 我写完后review,指出问题

✅ **解释设计权衡**:每次提出方案时,简短说明"为什么这样而不是那样"

✅ **检查我的理解**:写完一个函数后问我"你能复述一下这段代码做了什么吗?"

✅ **诚实反馈**:代码烂就说烂,不要为了照顾情绪给假表扬

### 我不希望你这样

❌ **一次输出100行代码让我accept**:这等于剥夺了我学习机会

❌ **建议Scope之外的优化**:MVP锁死,不要"顺便加个feature吧"

❌ **过度工程化**:不要建议设计模式、抽象层、Mock框架,除非我问

❌ **假设我懂或不懂**:不确定时,直接问"你之前写过XX吗?"

### 当我说这些话时,你应该这样反应

| 我说 | 你应该 |
|------|--------|
| "Claude帮我写XX" | 先反问:"你想让我直接写,还是先讨论思路?" |
| "我不会" | 给提示,不给完整答案,除非我说"直接给答案" |
| "这个能不能再加个功能" | 反问:"这是MVP必需的吗?能放到v2吗?" |
| "我看不懂" | 拆解到更小颗粒度,不要重复同样的解释 |
| "再调研一下其他方案" | **警报!这是规划成瘾** — 提醒我:"你已经选定技术栈,不要再换" |

---

## 10. 当前状态(每次更新)
```
最后更新：2026-06-08
当前阶段：Hackathon Post-MVP / Security Hardening + Eval Framework
当前分支：
- backend worktree: /home/admini/sentinel-backend @ feature/backend-risk-pipeline
- frontend worktree: /home/admini/sentinel-frontend @ feature/frontend-risk-console
本轮目标：
- Security Hardening：已修复 input_guard 注入检测、AmountRule 负数/零值、unknown action 拦截、Agent B/C prompt 加强
- Eval Framework：已新建 eval_pipeline.py 3层评估（E2E/Trajectory/Safety），总分 93%
- 后续：CP14 CAW contract_call 或 CP15 Read-only MCP Server
卡点：
- 剩余 5 个 eval FAIL 是 demo parser 限制（中文解析、JSON payload、无金额 transfer），非安全漏洞
- CAW contract_call swap 待 transfer 主线稳定后再做
合约地址：0xad7C1EBe561C9359C657FA36a156Cd213C8E6d7c（Sepolia，历史SmartAccount MVP版本）
```

---

## 11. 项目成功的定义

**最低成功**(11天后必须达到):
- ✅ GitHub有完整repo,README清晰
- ✅ Sepolia有部署+verified的SmartAccount
- ✅ 至少能演示"自然语言→链上交易"的流程
- ✅ 2分钟Loom demo视频

**理想成功**(锦上添花):
- 🌟 投递到至少1个黑客松
- 🌟 在Twitter/X发build in public推文
- 🌟 GitHub README有架构图、测试覆盖率截图、demo链接
- 🌟 Demo能展示完整CAW链路：CAW wallet active、Pact active、CAW execution evidence、policy deny、Sentinel risk reject
- 🌟 Agent证据层能展示tool calling、只读MCP调用和memory anomaly，而不是只有单轮LLM loop

**成功不是**:
- 完美的代码
- 美观的UI
- 复杂的功能
- "感觉很厉害"

---

## 12. 目标投递岗位(写给AI助手)

**岗位：Pioneer Talent Program - AI Agent Developer（Binance Tech Seeds 2026）**
链接：https://jobs.lever.co/binance/8a4660a3-28de-41e6-bcaf-ef404c481338

JD关键词 → Sentinel对应功能：
| JD关键词 | Sentinel功能 |
|---------|------------|
| AI agent workflows / LLM-powered systems | intent.py → guardrails.py → executor.py 流水线 |
| Tool integration (APIs, services) | web3.py + DeepSeek API |
| Testing, evaluation, iteration | Evaluation Framework（20 cases，95%准确率） |
| Safety / guardrails | Guardrails（blacklist + 二次确认） |
| Latency, reliability, cost | Latency/Cost Log（avg ~1.5s, ~$0.00004/action） |
| Human handoff flows | owner随时撤销agent权限 / dailyLimit护栏 |
| Backend + lightweight interfaces | Python agent + Scaffold-ETH 2前端 |
| Prompt structures, orchestration | system prompt设计，intent解析链路 |

**候选人加分项覆盖：**
- ✅ Personal project involving AI agents（Sentinel就是）
- ✅ Anthropic/DeepSeek API 使用经验
- ✅ Backend systems（Python + web3.py）
- ✅ Crypto/blockchain exposure（Solidity + Sepolia）

**每个功能的README描述和Demo措辞都应能对应JD里的某个关键词。**

---

*This document is the source of truth. When in conflict with my verbal request, ask before deviating.*
