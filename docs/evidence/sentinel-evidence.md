# Sentinel Evidence Checklist

> Updated: 2026-06-18 01:21 Asia/Shanghai
>
> Rule: use only evidence already present in the repo or explicitly verified.
> Do not invent tx hashes, Pact IDs, wallet IDs, screenshots, or CI results.

## Public Links

| Evidence | Value |
|---|---|
| GitHub repo | https://github.com/MrtWallace/sentinel |
| Demo video | https://www.loom.com/share/40a7046329fd420086694951f5081570 |
| Project deck | https://htmlpreview.github.io/?https://github.com/MrtWallace/sentinel/blob/main/hackathon/readme-deck.html |
| GitHub Actions CI | https://github.com/MrtWallace/sentinel/actions/workflows/ci.yml |

## CAW Demo Evidence

| Evidence | Value | Source |
|---|---|---|
| CAW wallet address | `0x927f175c85d61237f817b499f739336b498384fe` | `README.md`, CP14 notes |
| Primary recorded Pact ID | `e71f5662-5e23-4990-bf22-f6161c779cdd` | `README.md`, CP14 notes |
| Chain | Sepolia | `README.md` |
| Transfer CAW tx ID | `f56d37ca-7475-4349-a964-c9755027a2c0` | `README.md` |
| Transfer tx hash | `0xc1bffdc320c41e9a4d23969fcdeb2dfdb9874808317a3bfe81f873e127f9fd5d` | `README.md` |
| Wrap tx | `0x4d9c59ece554a869305334212e39733062a0552317be88a9aec5aaa8c3fa4104` | `README.md`, CP14 notes |
| Approve tx | `0x22d6cbf36b0e5b9e9f0ceee639f5b11ec4a8dede0cf0d565b8a808fecbee83e0` | `README.md`, CP14 notes |
| Swap tx | `0x6b2940e1810b39d5a0e08f47344038fd052e015b1c82939147c87e55ffdb66f4` | `README.md`, CP14 notes |
| Swap block | `11018833` | `README.md`, CP14 notes |
| Swap result | `5.499668 USDC` received | `README.md`, CP14 notes |
| Policy deny example | `matched_pact_transfer_deny_if` | `README.md`, shared API contract |

Note: `backend-progress.md` also records a later local repair Pact ID used while
stabilizing pairing and demo status. For public Stage 0 materials, use the
primary recorded Pact ID from the README unless the README is intentionally
updated.

## Evaluation Evidence

| Evidence | Value | Source |
|---|---|---|
| E2E eval | `31/32 (97%)` | `README.md` |
| Trajectory eval | `32/32 (100%)` | `README.md` |
| Safety eval | `20/20 (100%)` | `README.md` |
| Reference eval | `15/15 (100%)` | `README.md` |
| Fuzz eval | `10/10 (100%)` | `README.md` |
| Total eval | `108/109 (99%)` | `README.md` |
| Backend unit test count | README documents `466 tests` through `make test` | `README.md` |

## Architecture Evidence

| Evidence | Location |
|---|---|
| Text architecture diagram | `README.md` "How It Works" |
| Mermaid architecture diagram | `docs/case-study-sentinel.md` |
| API contract | `hackathon/docs/shared-api-contract.md` |
| CAW swap implementation record | `hackathon/docs/cp14-contract-call-swap.md` |
| Backend checkpoint history | `hackathon/docs/backend-progress.md` |
| Frontend checkpoint history | `hackathon/docs/frontend-progress.md` |

## Before Sending Applications

Check these manually:

- GitHub Actions latest run is green.
- Demo video link is public.
- README evidence section still matches the tx hashes above.
- Resume wording says "completed project" and does not imply production custody.
