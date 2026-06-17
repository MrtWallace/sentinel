# 当前进度

> 更新时间：2026-06-18 04:39 Asia/Shanghai

## 当前状态

Sentinel 黑客松实现已经完成，项目处于长期求职学习模式。Stage 0 的公开资产第一轮已
完成；个人 requirements 已确认并按 private career 文档体系拆分。

## 最近完成

- 完成 Sentinel case study、evidence、pitch 和 resume bullet 第一轮整理；
- 将个人 requirements 压缩为稳定索引型文档；
- 将详细规则拆到 private policies；
- 将 Stage 0-7 拆到 private long-term stage plan；
- 仅保留 Stage 0 和 Stage 1 两个 private checkpoints；
- 将 mastery notes 和 JD analysis 归入 `docs/private/career/`；
- 将公开 Sentinel 产品需求明确命名为 `docs/product-requirements.md`；
- 删除完成使命的 `docs/require-prompt.md`，避免私人背景留在公开文档层；
- 保留 `hackathon/docs/*` 作为实现历史。

## 当前执行入口

本地个人学习按以下顺序读取：

1. `docs/private/career/personal_career_requirements_zh.md`；
2. `docs/private/career/active_learning_contract_zh.md`；
3. `docs/private/career/checkpoints/stage-0-sentinel-assetization.md`；
4. `docs/private/career/checkpoints/stage-1-backend-sql-current.md`。

## 下一步

1. 完成 Stage 0 的无 AI 5 分钟讲解和实际简历更新；
2. 按 Stage 1 checkpoint 启动最小 backend + SQL L3 slice；
3. 达到 endpoint、DB field、test 和 error-path 门槛后转入 Chain Risk Monitor。

## 已知边界

- Private career 文档不会提交 GitHub；
- GitHub README 不链接 ignored 文件；
- CI 状态和外部 evidence 在投递前仍需重新核验；
- 不给 Sentinel 添加未通过 Project / Feature Admission Rule 的 major feature。
