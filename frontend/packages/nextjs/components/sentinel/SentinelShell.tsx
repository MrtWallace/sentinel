import type { ReactNode } from "react";
import Link from "next/link";
import { ChartBarSquareIcon, CommandLineIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

type SentinelShellProps = {
  active: "execute" | "audit";
  children: ReactNode;
};

const statusItems = [
  ["NETWORK", "SEP_NET_LIVE"],
  ["SMART ACCOUNT", "0x3350...4074"],
  ["BALANCE", "0.0000 ETH"],
  ["DAILY LIMIT", "0.1000 ETH"],
  ["SPENT", "0.0000 ETH"],
  ["AGENT", "0x6F8a...A119"],
] as const;

const primaryStatusItems = statusItems.slice(0, 4);
const secondaryStatusItems = statusItems.slice(4);

const navItems = [
  {
    key: "execute",
    href: "/",
    label: "Execute",
    Icon: CommandLineIcon,
  },
  {
    key: "audit",
    href: "/audit",
    label: "Audit",
    Icon: ChartBarSquareIcon,
  },
] as const;

export const SentinelShell = ({ active, children }: SentinelShellProps) => {
  return (
    <div className="min-h-screen bg-[#0c0e12] text-[#e2e2e8]">
      <header className="flex h-12 items-center justify-between border-b border-white/10 bg-[#0c0e12] px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link className="flex items-center gap-2 text-[#88d6b6]" href="/">
            <ShieldCheckIcon className="h-5 w-5" />
            <span className="text-lg font-bold">SENTINEL.AI</span>
          </Link>
          <div className="hidden min-w-0 items-center gap-4 border-l border-white/10 pl-4 lg:flex">
            {primaryStatusItems.map(([label, value]) => (
              <div className="flex items-center gap-2" key={label}>
                <span className="font-mono text-[10px] text-[#89938d]">{label}</span>
                <span className="font-mono text-xs text-[#e2e2e8]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 xl:flex">
          {secondaryStatusItems.map(([label, value]) => (
            <div className="flex items-center gap-2 opacity-65" key={label}>
              <span className="font-mono text-[10px] text-[#68726d]">{label}</span>
              <span className="font-mono text-xs text-[#89938d]">{value}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-md border border-[#88d6b6]/30 bg-[#88d6b6]/10 px-2 py-1 font-mono text-xs text-[#a4f3d1]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#88d6b6]" />
            PROTECTED
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-48px)]">
        <aside className="hidden w-[72px] shrink-0 border-r border-white/10 bg-[#111318] px-3 py-4 sm:block">
          <nav className="flex flex-col items-center gap-3">
            {navItems.map(({ key, href, label, Icon }) => {
              const isActive = active === key;

              return (
                <Link
                  aria-label={label}
                  className={`group relative flex h-12 w-12 items-center justify-center rounded-lg border transition ${
                    isActive
                      ? "border-[#88d6b6]/60 bg-[#88d6b6]/10 text-[#a4f3d1]"
                      : "border-transparent text-[#89938d] hover:border-white/10 hover:bg-[#1e2024] hover:text-[#e2e2e8]"
                  }`}
                  href={href}
                  key={key}
                >
                  <Icon className="h-5 w-5" />
                  <span className="pointer-events-none absolute left-14 z-20 rounded-md border border-white/10 bg-[#1e2024] px-2 py-1 text-xs text-[#e2e2e8] opacity-0 transition group-hover:opacity-100">
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
};
