# Frontend Checkpoint 0 — 当前基线确认

Last updated: 2026-05-28

## 目标

Checkpoint 0 只做阅读和记录，不进入前端实现。目标是确认当前 `frontend/packages/nextjs` 的真实结构、可复用部分、需要替换部分，以及已发现的地址/文档不一致问题。

## 已检查文件

- `frontend/packages/nextjs/app/page.tsx`
- `frontend/packages/nextjs/app/layout.tsx`
- `frontend/packages/nextjs/components/ScaffoldEthAppWithProviders.tsx`
- `frontend/packages/nextjs/components/Header.tsx`
- `frontend/packages/nextjs/components/Footer.tsx`
- `frontend/packages/nextjs/contracts/deployedContracts.ts`
- `frontend/packages/nextjs/scaffold.config.ts`
- `frontend/packages/nextjs/styles/globals.css`
- `frontend/AGENTS.md`
- `frontend/package.json`
- `frontend/packages/nextjs/package.json`

## 当前前端结构

当前前端是 Scaffold-ETH 2 的 Foundry flavor：

```text
frontend/
├── package.json                 # workspace scripts
└── packages/
    ├── foundry/                 # Scaffold-ETH bundled Foundry package
    └── nextjs/                  # Next.js frontend app
```

Next.js app 使用：

- Next.js App Router
- React 19
- TypeScript
- wagmi v2
- viem
- RainbowKit
- React Query
- DaisyUI/Tailwind
- Scaffold-ETH hooks under `~~/hooks/scaffold-eth`

## 当前首页

`frontend/packages/nextjs/app/page.tsx` 目前是简单状态 dashboard。

它已经读取：

- SmartAccount ETH balance via `useBalance`
- `owner` via `useScaffoldReadContract`
- `agent` via `useScaffoldReadContract`
- `dailyLimit` via `useScaffoldReadContract`
- `dailySpent` via `useScaffoldReadContract`

它展示：

- Sentinel 标题
- Contract Balance
- Daily Limit / Spent Today progress
- Owner / Agent addresses

它还没有：

- intent 输入
- demo 快捷按钮
- decision chain
- `confirm_needed`
- audit table
- `/audit`
- `/frontend-map`
- API/mock transport layer

## 地址不一致

当前首页硬编码：

```text
0xad7C1EBe561C9359C657FA36a156Cd213C8E6d7c
```

当前 `deployedContracts.ts` 配置：

```text
0x3350A693619209193B01399e78d5897766c44074
```

后续 Checkpoint 2 必须移除首页硬编码地址，并从 Scaffold-ETH contract config 获取 SmartAccount 地址。

## Provider 与基础设施

`ScaffoldEthAppWithProviders.tsx` 当前负责：

- `WagmiProvider`
- `QueryClientProvider`
- `RainbowKitProvider`
- Progress bar
- Toast
- `Header`
- `Footer`

后续实现应保留 provider 基础设施。可替换可见的 `Header` / `Footer` 内容，但不要移除 wagmi、React Query、RainbowKit、ThemeProvider 等链交互基础设施。

## 当前 Header/Footer

当前 `Header` 显示：

- Scaffold-ETH branding
- Home
- Debug Contracts
- RainbowKit wallet connect button
- local network faucet button

当前 `Footer` 显示：

- native currency price
- local faucet/block explorer
- theme switch
- Fork me / BuidlGuidl / Support links

这些对开发有用，但对 hackathon demo 有噪音。Checkpoint 2 应替换成 Sentinel demo shell：

- Sentinel
- Execute
- Audit
- Network/status indicator

Debug/Block explorer 可以保留为开发入口，但不应抢占 demo 主导航。

## Contract Config

`frontend/packages/nextjs/contracts/deployedContracts.ts` 已有 `SmartAccount`：

- chain id: `11155111`
- address: `0x3350A693619209193B01399e78d5897766c44074`
- ABI includes:
  - `owner`
  - `agent`
  - `dailyLimit`
  - `dailySpent`
  - `deposit`
  - `execute(address,uint256,bytes)`
  - `setAgent`
  - `setDailyLimit`
  - `withdraw`
  - `Deposited`
  - `Executed`

`frontend/packages/nextjs/scaffold.config.ts` targets Sepolia.

## Correct Hook Names

Use these hook names:

- `useScaffoldReadContract`
- `useScaffoldWriteContract`
- `useScaffoldEventHistory`
- `useDeployedContractInfo`

Do not use outdated names such as `useScaffoldContractRead`.

## Styling Baseline

Current global styling uses Tailwind v4 plus DaisyUI themes. The current colors are Scaffold-ETH defaults with blue/dark-blue dominance.

Checkpoint 2/3 should keep styling practical:

- Do not introduce a full design system.
- Use DaisyUI classes where possible.
- Add only the minimal Sentinel-specific classes/tokens needed for the demo console.

## What To Keep

- Next.js App Router structure.
- Scaffold-ETH provider setup.
- wagmi/viem/RainbowKit/React Query wiring.
- Existing `useScaffoldReadContract` pattern for `owner`, `agent`, `dailyLimit`, `dailySpent`.
- Sepolia target network config.
- `deployedContracts.ts` as contract ABI/address source of truth.

## What To Replace Or Add Later

Replace:

- Visible Scaffold-ETH header/footer shell.
- Hardcoded `CONTRACT_ADDRESS` in `page.tsx`.
- Current homepage-only dashboard layout.

Add:

- `lib/sentinel/types.ts`
- `lib/sentinel/mockData.ts`
- `lib/sentinel/api.ts`
- `IntentInput`
- `DecisionChain`
- `StatusBadge`
- `AuditTable`
- `/audit`
- `/frontend-map`
- `hackathon/docs/frontend-implementation-guide.md`

## Checkpoint 0 Conclusion

Frontend implementation can proceed to Checkpoint 1. The main technical risk found in Checkpoint 0 is the hardcoded old balance address in `page.tsx`. The main scope risk is accidentally editing provider infrastructure while replacing the visible demo shell; keep providers intact and limit shell changes to visible navigation/footer behavior.
