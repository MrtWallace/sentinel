# ADR-001 - 引入 Root Docs 作为当前文档层

> 日期：2026-06-18

## 背景

黑客松阶段产生了很多有用文档，主要放在 `hackathon/docs/`。这些文档记录了
checkpoint、实现过程、调试路径和历史决策，但它们也包含许多当时状态下的
"in progress" 语句。

黑客松结束后，Sentinel 需要从提交项目转为长期项目资产。继续让未来读者默认
读取旧进度文档，会造成上下文混乱。

## 决策

新增 root `docs/` 作为当前文档层：

- `hackathon/docs/` 保留为历史实现证据。
- `docs/` 负责当前 requirements、spec、plan、progress、case study、evidence、
  interview、resume、roadmap。
- `AGENTS.md` 默认读取 root docs。
- `PROJECT_CONTEXT.md` 中仍有用的内容迁移到 root docs 后删除。

## 影响

好处：

- 未来 agent 不需要读完大量历史文件才能开始工作。
- README 和求职资产有清楚入口。
- 旧黑客松材料仍保留为证据，不会丢失。
- 你自己读的内部文档可以中文化，降低维护成本。

代价：

- 文档数量变多，需要用 `docs/README.md` 做入口。
- 某些信息在旧文档和当前文档之间会有重复；当前文档优先。

## 当前规则

如果当前文档和 `hackathon/docs/*` 冲突，优先相信 root `docs/` 和 `README.md`。
只有在查历史实现细节时，才回到旧黑客松文档。
