# Sentinel 开发日志

## 2026-06-18 01:21 - 新增 root docs

- 新增 root `docs/` 作为当前项目文档层。
- 新增 requirements、spec、plan、current progress、agent contract。
- 新增 case study、evidence checklist、interview scripts、resume bullets、
  mastery note、future roadmap。
- 保留 `hackathon/docs/*` 作为历史实现记录。

## 2026-06-18 01:21 - 公开/私人文档边界

- 新增 `docs/publishing-policy.md`。
- 新增 `docs/private/README.md`。
- 更新 `.gitignore`，忽略 private docs、raw evidence、screenshots、recordings、
  generated resumes、PDF/DOCX resume exports。

## 2026-06-18 02:00 - 删除 PROJECT_CONTEXT.md

- 将 `PROJECT_CONTEXT.md` 中仍有用的内容迁移到 root docs。
- 将协作方式和技术约束放入 `docs/development-guidelines.md`。
- 将当前 agent 执行边界放入 `docs/agent-contract.md`。
- 将当前技术规格放入 `docs/spec.md`。
- 简化 `AGENTS.md`，让它不再默认读取旧黑客松流程。
- 删除 `PROJECT_CONTEXT.md`。

## 2026-06-18 02:00 - 调整文档语言规则

- 你自己常读的内部文档改为中文。
- 对外 GitHub 资产保留英文或中英混合。
- Agent 专用文档可以继续英文。

## 2026-06-18 04:39 - 拆分私人学习与求职文档

- 将个人 requirements 压缩为 300-600 行内的稳定索引型文档。
- 将项目准入、AI ownership、技能等级、更新规则和非目标拆到 private policies。
- 将 Stage 0-7、active learning contract、当前 checkpoints、JD analysis 和 mastery notes
  统一归入 `docs/private/career/`。
- 将公开 Sentinel 需求改名为 `docs/product-requirements.md`，避免与个人 requirements 混淆。
- 删除已完成使命且包含私人背景的 `docs/require-prompt.md`。
