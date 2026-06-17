# Sentinel 私人文档区

这个目录用于存放不适合公开到 GitHub 的材料。

`docs/private/README.md` 会被提交，用来保留目录和说明规则；除此之外，
`docs/private/**` 默认被 `.gitignore` 忽略。

## 可以放在这里

- 公司定制简历。
- 自我介绍和面试复盘。
- 录音/录像后的文字总结。
- 私人 demo checklist。
- 未脱敏 evidence notes。
- 个人求职计划。
- 个人 requirements、stage plan、active contract 和 checkpoint。
- JD analysis 和 mastery notes。

## 不应该放在这里

即使这个目录被 ignore，也不要把这些内容长期放进 repo：

- Private key。
- Seed phrase。
- 真实 API token。
- 可以直接登录或转移资产的凭据。

这类内容应该放密码管理器或安全 secret store。

## 推荐子目录

```text
docs/private/
  career/
    personal_career_requirements_zh.md
    long_term_stage_plan_zh.md
    active_learning_contract_zh.md
    policies/
    checkpoints/
    jd_analysis/
    mastery/
  resume/
  interview/
  evidence/
```

这些子目录不需要提前创建；需要时再建即可。
