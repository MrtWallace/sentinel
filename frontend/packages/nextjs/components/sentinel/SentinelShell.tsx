import type { ReactNode } from "react";
import Link from "next/link";
import { ChartBarSquareIcon, CommandLineIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { SmartAccountStatusBar } from "~~/components/sentinel/SmartAccountStatusBar";

type SentinelShellProps = {
  active: "execute" | "audit";
  children: ReactNode;
};

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
      <header className="flex h-12 items-center gap-4 border-b border-white/10 bg-[#0c0e12] px-4">
        <Link className="flex shrink-0 items-center gap-2 text-[#88d6b6]" href="/">
          <ShieldCheckIcon className="h-5 w-5" />
          <span className="text-lg font-bold">SENTINEL.AI</span>
        </Link>
        <SmartAccountStatusBar />
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
