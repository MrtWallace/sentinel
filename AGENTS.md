# AGENTS.md - Sentinel Instructions For Codex

## Read Order

When working on this project, always read:

1. `docs/current-progress.md`
2. `docs/agent-contract.md`
3. `docs/development-guidelines.md`
4. When present locally, `docs/private/career/active_learning_contract_zh.md`
5. The task-specific spec or current checkpoint
6. Local package instructions when editing inside a nested project, especially `frontend/AGENTS.md`

## Project Mode

Sentinel is now in completed-project assetization and staged learning mode.

Current priority:

- Maintain Sentinel as a completed flagship project asset.
- Keep README, case study, evidence, interview scripts, and resume bullets clear.
- Start future work only from the current private career checkpoint or an explicitly approved product checkpoint.

## Collaboration Rules

- Default to coach mode when the user is trying to learn:
  - Explain the concept and design tradeoff first.
  - Let the user attempt when they explicitly want practice.
  - Review their work with direct technical feedback.
- When the user explicitly says to implement, implement. Still keep changes staged by checkpoint when the plan requires review points.
- Respect MVP scope. Do not add new features because they are interesting.
- Ask before refactoring code outside the requested scope.
- Push back on scope creep or planning loops. Use the project docs as the boundary.
- Use Chinese for project discussion, planning, review, and internal docs by default. Code identifiers, APIs, and commit messages can remain English.
- Development continues on `main`.

## Checkpoint Tracking

For future work:

- Work checkpoint by checkpoint.
- At the start of a checkpoint, update `docs/current-progress.md` with status,
  start time, scope, and intended validation.
- At the end of a checkpoint, update `docs/current-progress.md` with completion
  time, files changed, validation result, remaining issues, and next action.
- Update `docs/private/career/long_term_stage_plan_zh.md` only when stage definitions change.
- Update only the current/next file under `docs/private/career/checkpoints/` for execution changes.
- Add to `docs/logs/dev-log.md` only for meaningful historical notes.
- Create or update `docs/decisions/ADR-*.md` when a technical decision affects
  future implementation.
- Use Asia/Shanghai timestamps accurate to the minute in `YYYY-MM-DD HH:MM`
  format.

## User Context

- Solidity: intermediate. Completed Speedrun Ethereum and Foundry FundMe.
- Python: intermediate. Has automation experience, limited web3.py/API integration background.
- Frontend: basic React and Scaffold-ETH 2 experience.
- AI integration: first project using an LLM API.
- Preference: wants to learn and review, not only receive generated code.
- Risk: prone to over-planning; keep execution concrete and checkpointed.

## Current Documentation Notes

- `README.md` is the external-facing project summary.
- `docs/README.md` is the current documentation map.
- `docs/current-progress.md` is the short current handoff file.
- `docs/agent-contract.md` is the active execution contract for future Codex work.
- `docs/development-guidelines.md` stores collaboration style, technical constraints, and default validation rules.
- `docs/publishing-policy.md` defines what is public-safe vs private/ignored.
- `docs/case-study-sentinel.md`, `docs/evidence/sentinel-evidence.md`, `docs/interview/sentinel-pitches.md`, and `docs/resume/sentinel-bullets.md` are the Stage 0 assetization outputs.
- `docs/private/career/` is the local, ignored source of truth for personal requirements, stages, checkpoints, policies, JD analysis, and mastery notes.
