# Sentinel 文档地图

> 更新时间：2026-06-18 04:39 Asia/Shanghai

根目录 `docs/` 是 Sentinel 当前公开项目文档层；黑客松实现历史保留在
`hackathon/docs/`。个人学习、求职、JD 和 mastery 文档统一放在 ignored 的
`docs/private/career/`，不提交 GitHub。

## 正常阅读顺序

1. `README.md` - 对外项目介绍和 demo evidence。
2. `docs/current-progress.md` - 当前项目状态和交接。
3. `docs/agent-contract.md` - Agent 执行边界。
4. `docs/development-guidelines.md` - 协作与验证规则。
5. `docs/spec.md` - 当前技术架构和模块边界。
6. 与当前任务直接相关的公开文档。

本地个人学习任务还应读取 `docs/private/career/active_learning_contract_zh.md` 和当前
checkpoint。只有查历史实现、旧 API contract 或旧 checkpoint 时才读 `hackathon/docs/*`。

## 公开项目文档

| 文件 | 用途 |
|---|---|
| `docs/product-requirements.md` | Sentinel 产品目的、范围和非目标。 |
| `docs/spec.md` | Sentinel 技术架构、模块和执行边界。 |
| `docs/current-progress.md` | 当前高频交接状态。 |
| `docs/agent-contract.md` | Codex / Agent 的公开执行契约。 |
| `docs/development-guidelines.md` | 协作、技术约束和默认验证。 |
| `docs/publishing-policy.md` | 公开与私人内容边界。 |
| `docs/case-study-sentinel.md` | 对外英文技术 case study。 |
| `docs/evidence/sentinel-evidence.md` | Demo 证据清单。 |
| `docs/interview/sentinel-pitches.md` | 可复用 pitch 与 demo walkthrough。 |
| `docs/resume/sentinel-bullets.md` | 简历 bullet 与措辞边界。 |
| `docs/roadmap/future-additions.md` | 公开的后续产品增强候选。 |
| `docs/decisions/ADR-*.md` | 重要技术/文档决策。 |
| `docs/logs/dev-log.md` | 关键历史记录。 |

## Private Career 文档

本地结构：

```text
docs/private/career/
  personal_career_requirements_zh.md
  long_term_stage_plan_zh.md
  active_learning_contract_zh.md
  policies/
  checkpoints/
  jd_analysis/
  mastery/
```

职责边界：

| 类型 | 责任 |
|---|---|
| Requirements | 稳定定义方向、岗位池、能力边界和索引。 |
| Policy | 解释项目准入、AI ownership、技能写入、非目标和更新规则。 |
| Stage plan | 定义 Stage 0-7 的目标、退出条件和证据。 |
| Active contract | 定义当前学习与执行边界。 |
| Checkpoint | 定义当前/下一阶段可验证项目行为。 |
| Mastery note | 记录掌握、测试、no-AI 修改和薄弱点。 |
| JD analysis | 记录单个岗位和重复市场信号。 |

`docs/private/**` 默认由 `.gitignore` 忽略，公开 README 不应链接这些文件。

## 语言规则

- 个人经常阅读的规划、复盘和学习文档默认中文。
- GitHub 外部读者会读的项目资产可以英文。
- Agent 专用规则可以英文。
- 简历和面试材料可保留可复用英文原句，使用说明用中文。

## 历史文档

- `hackathon/README.md` 和 `hackathon/proposal.md` 保留提交历史。
- `hackathon/docs/backend-*`、`frontend-*`、`shared-api-contract.md` 等只在追溯实现时读取。
- `PROJECT_CONTEXT.md` 的有效信息已迁移后删除。
- 不为“看起来干净”重写或删除仍有历史价值的 hackathon 文档。
