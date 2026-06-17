# Sentinel 开发准则

> 更新时间：2026-06-18 02:00 Asia/Shanghai

## 协作方式

- 项目讨论、规划、review、内部文档默认中文。
- 代码 identifier、API 名、commit message、对外 README/case study 可以英文。
- 当用户明确说“实现”时，直接实现；不要只停留在建议。
- 当用户想学习时，默认 coach mode：先讲概念和 tradeoff，再让用户尝试，再 review。
- 每次改动都要保持 scope 小而清楚。
- 不因为“看起来更高级”而添加新功能。
- 如果用户开始陷入过度规划，要把讨论拉回当前 checkpoint 和完成标准。

## 项目 owner 背景

- Solidity：中级。已完成 Speedrun Ethereum 和 Foundry FundMe。
- Python：中级。有自动化经验，但 web3.py/API integration 经验有限。
- Frontend：基础 React 和 Scaffold-ETH 2 经验。
- AI integration：这是第一个使用 LLM API 的完整项目。
- 偏好：希望自己能学会和复述，不只是收到生成代码。
- 风险：容易过度规划；需要具体、可验证的 checkpoint。

## 技术约束

- 合约工具链继续使用 Foundry，不切 Hardhat。
- 默认网络是 Sepolia，不做 mainnet。
- CAW 是当前已验证的钱包执行路径。
- SmartAccount 是历史 baseline，不应重新包装成当前主执行路径。
- LLM 层保持 OpenAI-compatible client / DeepSeek-compatible 配置。
- 不默认引入 LangChain、AgentKit、多链、复杂 custody、完整 auth。
- 前端基于现有 Next.js / Scaffold-ETH 结构，不从零搭 UI 框架。
- 真实 secret、private key、CAW 原始凭据、私人截图、录屏、实际简历不得提交。

## Scope 规则

- Stage 0：只做资产化、文档、证据、讲解、简历材料。
- Stage 1 以后：按 `docs/private/career/checkpoints/` 的当前 checkpoint 做，不一次性扩展大功能。
- 改代码前先确认任务属于哪个 stage。
- 如果任务只是整理资料，不顺手重构代码。
- 如果要改 API 或 frontend mapper，再查 `hackathon/docs/shared-api-contract.md`。

## 公开证据规则

可以公开：

- GitHub repo link。
- Demo video link。
- Public tx hash。
- Public wallet address。
- Pact ID（如果它不是 secret）。
- CI badge / workflow link。
- 架构图和脱敏 audit 示例。

不要公开：

- API key、private key、seed phrase。
- CAW 原始 response 里可能包含的敏感字段。
- 未脱敏截图。
- 公司定制简历和面试复盘。
- 任何无法验证但听起来更强的 claim。

## 默认验证命令

文档改动：

```bash
git diff --check
rg -n "api_key|private_key|secret|credential|authorization" docs README.md
git status --short
```

Backend 改动：

```bash
python -m pytest
```

Frontend 改动：

```bash
yarn lint
yarn test
```

合约改动：

```bash
forge build
forge test
```

如果某个命令当前环境跑不了，最终回复必须说明原因，不能假装通过。
