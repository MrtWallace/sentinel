# Sentinel — AI Agent for DeFi Operations

> 这是项目的核心上下文文档。Claude Code和其他AI助手在协助本项目时,应先读完此文档。

---

## 1. 项目一句话定位

**Sentinel是AI驱动的DeFi执行层。** 用户用自然语言下达DeFi指令,AI agent在安全护栏内自动解析、构造交易、上链执行,用户随时可介入或撤销。

> 定位调整说明(2026-05-01)：原定位"AI-Operated Smart Account"调整为"AI Agent for DeFi Operations"，以精准匹配Binance AI Agent Engineer岗位JD。合约代码无需改动，只影响README描述、Demo故事线和简历措辞。

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
| Agent | Python 3.11+ | 用web3.py + anthropic SDK |
| AI模型 | DeepSeek API | deepseek-chat；原计划Claude，因国内支付限制改用DeepSeek |
| 前端 | Next.js 14 + Scaffold-ETH 2 | 不要从零搭Next |
| 链交互 | wagmi v2 + viem | Scaffold-ETH 2自带 |
| 部署链 | Sepolia testnet | 不要部署主网 |
| 私钥管理 | .env文件 (MVP) | 生产级方案非MVP范围 |

**关键纪律**:
- ❌ 不要建议用LangChain、AI SDK、Coinbase AgentKit(MVP不需要,后续可加)
- ❌ 不要建议EIP-4337 / Account Abstraction标准实现(MVP是简化版)
- ❌ 不要建议多链支持
- ❌ 不要建议复杂的私钥管理方案

---

## 5. MVP范围(锁定边界)

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

### 已知技术债
- Uniswap V3 通过 SmartAccount 调用失败，根本原因未查明。Mock DEX 可演示同等链路，Uniswap 集成留 v2。
- execute(address,uint256,bytes) 已支持 calldata 转发，合约和测试均已更新。

---

## 6. 项目结构

```
sentinel/
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
│   ├── intent.py                # Claude意图解析
│   ├── executor.py              # 链上交易执行
│   ├── requirements.txt
│   ├── .env.example
│   └── venv/                    # 虚拟环境(gitignore)
│
└── frontend/                    # Scaffold-ETH 2 (Day 9-10建)
    └── ... (暂不细化)
```

---

## 7. 开发路线图(更新于2026-05-01)

| 阶段 | 任务 | 完成标志 | 状态 |
|------|------|---------|------|
| 0 | 项目骨架 + GitHub | repo已push | ✅ |
| 1 | SmartAccount合约 + 限额机制 | `forge build`通过 | ✅ |
| 2 | Foundry测试套件 | `forge test`全绿,coverage>80% | ✅ |
| 3-Day1-2 | Python连接Sepolia + 基础ETH转账 | 终端打印余额；"发0.001 ETH"真实执行 | 进行中 |
| 3-Day3-4 | Evaluation Framework + Guardrails + Cost Log | 20 cases准确率输出；危险地址被拦截 | 待做 |
| 3-Day5-6 | Uniswap V3 Swap支持 | "Swap 100 USDC to ETH"Sepolia执行成功 | 待做 |
| 4 | Scaffold-ETH 2前端 | 浏览器能看到合约状态 | 待做 |
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
最后更新：2026-05-02
当前阶段：阶段3-Day3（Guardrails + Cost Log）
本日目标：SmartAccount部署Sepolia成功，agent通过合约execute()发交易，Evaluation Framework 95%准确率
卡点：无
合约地址：0xbB5dA66c1D164050FaFf7A0165Cf7808e0C616DF（Sepolia）
作息：10:00-13:00 Deep Work（驾校16:00-20:00）
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

**成功不是**:
- 完美的代码
- 美观的UI
- 复杂的功能
- "感觉很厉害"

---

## 12. 目标投递岗位(写给AI助手)

主要目标：**Binance Applied AI Agent Developer (BAP)** / **Binance AI Agent Engineer**

JD关键词 → Sentinel对应功能：
| JD关键词 | Sentinel功能 |
|---------|------------|
| AI Agent工作流 | intent.py → executor.py 流水线 |
| 工具集成 | web3.py + Anthropic SDK |
| 测试评估 | Evaluation Framework（20 cases准确率） |
| 护栏 | Guardrails（blacklist + 二次确认） |
| 人工接管 | owner随时撤销agent权限 |
| 延迟/成本 | Latency/Cost Log |

**每个功能的README描述和Demo措辞都应能对应JD里的某个关键词。**

---

*This document is the source of truth. When in conflict with my verbal request, ask before deviating.*
