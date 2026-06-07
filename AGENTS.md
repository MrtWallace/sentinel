# AGENTS.md — Persistent Instructions for Codex

## Read Order

When working on this project, always read:

1. `PROJECT_CONTEXT.md`
2. The task-specific document under `hackathon/docs/` when the task is part of the hackathon extension:
   - Frontend: `hackathon/docs/frontend-plan.md` and `hackathon/docs/frontend-progress.md`
   - Backend: `hackathon/docs/backend-plan.md` and `hackathon/docs/backend-progress.md`
   - Shared API work: `hackathon/docs/shared-api-contract.md`
3. Local package instructions when editing inside a nested project, especially `frontend/AGENTS.md`

## Project Mode

Sentinel currently has two layers:

- **Baseline Sentinel**: Solidity SmartAccount, Python CLI agent, DeepSeek intent parsing, guardrails, Uniswap/Sepolia execution, simple Scaffold-ETH status dashboard.
- **Hackathon extension**: multi-agent risk-control demo surface, decision-chain API shape, audit log UI, and frontend learning/explainer layer.

Do not mix these states. If a document says "frontend done", verify whether it means the simple dashboard or the planned risk-control console.

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
- Integration branch `integration/caw-demo` has been merged. Post-MVP development continues on `main`.

## Checkpoint Tracking

For both frontend and backend work:

- Work checkpoint by checkpoint in coach mode: explain the target, let the user write suitable core logic when appropriate, then review and test.
- At the start of each checkpoint, update the relevant progress-tracking document with status, start time, and notes.
- At the end of each checkpoint or before committing, update completion time, status, test result, and progress details in the relevant progress-tracking document.
- Use Asia/Shanghai timestamps accurate to the minute in `YYYY-MM-DD HH:MM` format.
- The user should not need to repeat "update progress details" or "record timestamp"; do this by default unless asked to skip.
- Keep stable plan/spec documents separate from high-frequency progress updates to reduce context and token usage.

Tracking file mapping:

- Backend/contracts: update `hackathon/docs/backend-progress.md` for checkpoint status. Only update `hackathon/docs/backend-plan.md` when the stable plan or checkpoint definitions change.
- Frontend: update `hackathon/docs/frontend-progress.md` by default. Update `hackathon/docs/frontend-plan.md` only when the plan, scope, checkpoint definitions, or architecture decisions change.

## Backend-Specific Workflow

For backend and contract work:

- Follow `hackathon/docs/backend-plan.md`, `hackathon/docs/backend-progress.md`, and `hackathon/docs/shared-api-contract.md`.
- Backend work continues on `main` after integration merge.

## Frontend-Specific Workflow

For the current frontend work:

- Follow `hackathon/docs/frontend-plan.md`.
- Use `hackathon/docs/frontend-progress.md` for checkpoint status, timestamps, latest test results, and current blockers.
- Implement by checkpoint, not as one large diff.
- Frontend work continues on `main` after integration merge.
- After each checkpoint, report:
  - Files changed
  - What the code/data does
  - What the user should review
  - Next checkpoint
- Frontend UI copy should be English for external demo.
- Internal docs and explanations for the user should be Chinese.
- Do not add wallet connect, auth, Redux/Zustand, i18n, charts, mobile polish, or chain-event audit reads unless the plan is explicitly updated.

## User Context

- Solidity: intermediate. Completed Speedrun Ethereum and Foundry FundMe.
- Python: intermediate. Has automation experience, limited web3.py/API integration background.
- Frontend: basic React and Scaffold-ETH 2 experience.
- AI integration: first project using an LLM API.
- Preference: wants to learn and review, not only receive generated code.
- Risk: prone to over-planning; keep execution concrete and checkpointed.

## Current Documentation Notes

- `PROJECT_CONTEXT.md` is the root source of truth.
- `README.md` is the external-facing project summary.
- `hackathon/docs/frontend-plan.md` is the current frontend implementation plan.
- `hackathon/docs/frontend-progress.md` is the short, frequently updated frontend checkpoint tracker.
- `hackathon/docs/frontend-checkpoint-0.md` records the current frontend baseline before implementation.
