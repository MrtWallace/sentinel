"use client";

import { useCawWallet } from "~~/components/sentinel/CawWalletContext";
import { CawWalletMenu } from "~~/components/sentinel/CawWalletMenu";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { getCawHeaderStatusItems } from "~~/lib/sentinel/walletViewModel";

type StatusItem = {
  label: string;
  value: string;
};

export const SmartAccountStatusBar = () => {
  const { targetNetwork } = useTargetNetwork();
  const { isLoading: isWalletLoading, walletBinding } = useCawWallet();
  const cawHeaderItems = getCawHeaderStatusItems(walletBinding);

  const primaryStatusItems: StatusItem[] = [
    { label: "NETWORK", value: targetNetwork.name.toUpperCase() },
    { label: "EXECUTION", value: "CAW PRIMARY" },
    ...cawHeaderItems.map(item => ({
      label: item.label,
      value: isWalletLoading ? "Loading" : item.value,
    })),
  ];

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 lg:hidden">
        <CompactStatusPill label="NET" value={targetNetwork.name.toUpperCase()} />
        <CompactStatusPill label="PACT" value={isWalletLoading ? "..." : (cawHeaderItems[0]?.value ?? "none")} />
      </div>

      <div className="hidden min-w-0 flex-1 items-center gap-4 overflow-hidden border-l border-white/10 pl-4 lg:flex">
        {primaryStatusItems.map(item => (
          <StatusPair item={item} key={item.label} />
        ))}
      </div>

      <div className="ml-auto shrink-0">
        <CawWalletMenu />
      </div>
    </div>
  );
};

const CompactStatusPill = ({ label, value }: StatusItem) => {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-[#111318] px-2 py-1 font-mono text-[10px] text-[#bec9c2]">
      <span className="text-[#68726d]">{label}</span>
      <span className="ml-1 text-[#a4f3d1]">{value}</span>
    </div>
  );
};

const StatusPair = ({ item, muted = false }: { item: StatusItem; muted?: boolean }) => {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${muted ? "opacity-65" : ""}`}>
      <span className={`shrink-0 font-mono text-[10px] ${muted ? "text-[#68726d]" : "text-[#89938d]"}`}>
        {item.label}
      </span>
      <span className={`truncate font-mono text-xs ${muted ? "text-[#89938d]" : "text-[#e2e2e8]"}`}>{item.value}</span>
    </div>
  );
};
