# Sentinel 公开/私人文档规则

> 更新时间：2026-06-18 02:00 Asia/Shanghai

## 目标

这个文件用于防止两类问题：

1. 把应该公开展示的项目资产藏在私人笔记里。
2. 把不该公开的凭据、截图、录屏、简历和公司定制材料提交到 GitHub。

## 可以公开提交

这些内容可以放到 GitHub：

- `README.md`
- `docs/README.md`
- `docs/product-requirements.md`
- `docs/spec.md`
- `docs/current-progress.md`
- `docs/agent-contract.md`
- `docs/development-guidelines.md`
- `docs/case-study-sentinel.md`
- `docs/evidence/sentinel-evidence.md`
- `docs/interview/sentinel-pitches.md`
- `docs/resume/sentinel-bullets.md`
- `docs/roadmap/future-additions.md`
- `docs/decisions/ADR-*.md`
- `docs/logs/dev-log.md`

前提是这些文件只包含公开安全的信息。

## 应该私人保存

这些内容不要提交：

- API key、private key、seed phrase、bearer token。
- 原始 CAW API response，如果其中包含内部 id、token 或敏感字段。
- 未脱敏截图和录屏。
- 实际投递简历、PDF/DOCX、公司定制简历。
- 面试录音、自我复盘、公司定制回答。
- 任何包含个人隐私、邮箱、电话号码、地址的材料。
- 个人 career requirements、stage plan、checkpoint、JD analysis 和 mastery notes。

## 推荐目录

| 用途 | 目录 | Git 状态 |
|---|---|---|
| 私人总目录 | `docs/private/` | ignored，除了 `docs/private/README.md` |
| 个人学习与求职体系 | `docs/private/career/` | ignored |
| 原始 CAW / demo 输出 | `docs/evidence/raw/` | ignored |
| 截图 | `docs/evidence/screenshots/` | ignored |
| 录屏 | `docs/evidence/recordings/` | ignored |
| 面试私人笔记 | `docs/interview/private/` | ignored |
| 面试录音/录像 | `docs/interview/recordings/` | ignored |
| 实际简历版本 | `docs/resume/private/` | ignored |
| 生成版简历 | `docs/resume/generated/` | ignored |
| PDF/DOCX 简历 | `docs/resume/*.pdf`, `docs/resume/*.docx` | ignored |

## 提交前检查

提交文档前跑：

```bash
git status --short
git diff --check
rg -n "api_key|private_key|secret|credential|authorization|COBO_PACT_API_KEY|AGENT_WALLET_API_KEY" docs README.md
```

如果 `rg` 命中的是 `.env.example` 或说明性 placeholder，可以保留；如果是真实值，
必须移到私人目录或环境变量中。

## 证据写法

可以写：

- Public transaction hash。
- Public Sepolia wallet address。
- Public GitHub Actions badge。
- Public demo video URL。
- Pact ID，如果它不是 secret。
- 脱敏 audit JSON 示例。

不要写：

- “production custody system”。
- “mainnet-ready trading bot”。
- “guaranteed safe LLM execution”。
- 没有真实证据支撑的 tx hash、Pact ID、CI 状态。

## 语言规则

- 你自己读的内部文档优先中文。
- 面向 GitHub/面试官的项目资产可以英文。
- 简历 bullet 和 pitch 可以保留英文原句，但解释和使用说明用中文。
- Agent 专用执行规则可以英文，以降低未来工具误解成本。
