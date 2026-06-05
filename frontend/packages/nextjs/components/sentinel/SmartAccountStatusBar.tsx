"use client";

import { formatEther } from "viem";
import { useBalance } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useTargetNetwork } from "~~/hooks/scaffold-eth";

type StatusItem = {
  label: string;
  value: string;
};

const CAW_CONTEXT: StatusItem[] = [
  { label: "BACKEND", value: "FASTAPI :8000" },
  { label: "EXECUTION", value: "CAW PRIMARY" },
  { label: "CAW WALLET", value: "PENDING" },
  { label: "PACT", value: "PENDING" },
];

export const SmartAccountStatusBar = () => {
  const { targetNetwork } = useTargetNetwork();
  const { data: smartAccount } = useDeployedContractInfo({ contractName: "SmartAccount" });
  const smartAccountAddress = smartAccount?.address;

  const balanceRead = useBalance({
    address: smartAccountAddress,
    chainId: targetNetwork.id,
    query: {
      enabled: Boolean(smartAccountAddress),
    },
  });

  const ownerRead = useScaffoldReadContract({
    contractName: "SmartAccount",
    functionName: "owner",
  });

  const agentRead = useScaffoldReadContract({
    contractName: "SmartAccount",
    functionName: "agent",
  });

  const dailyLimitRead = useScaffoldReadContract({
    contractName: "SmartAccount",
    functionName: "dailyLimit",
  });

  const dailySpentRead = useScaffoldReadContract({
    contractName: "SmartAccount",
    functionName: "dailySpent",
  });

  const hasReadError =
    balanceRead.isError || ownerRead.isError || agentRead.isError || dailyLimitRead.isError || dailySpentRead.isError;

  const primaryStatusItems: StatusItem[] = [
    { label: "NETWORK", value: targetNetwork.name.toUpperCase() },
    ...CAW_CONTEXT,
  ];

  const secondaryStatusItems: StatusItem[] = [
    ["SMART ACCOUNT", shortenAddress(smartAccountAddress)],
    ["BALANCE", formatEth(balanceRead.data?.value, balanceRead.isLoading)],
    ["LIMIT", formatEth(dailyLimitRead.data, dailyLimitRead.isLoading)],
    ["AGENT", shortenAddress(agentRead.data, agentRead.isLoading)],
    ["SPENT", formatEth(dailySpentRead.data, dailySpentRead.isLoading)],
  ].map(([label, value]) => ({ label, value }));

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 lg:hidden">
        <CompactStatusPill label="NET" value={targetNetwork.name.toUpperCase()} />
        <CompactStatusPill label="EXEC" value="CAW" />
        <CompactStatusPill label="API" value=":8000" />
      </div>

      <div className="hidden min-w-0 flex-1 items-center gap-4 border-l border-white/10 pl-4 lg:flex">
        {primaryStatusItems.map(item => (
          <StatusPair item={item} key={item.label} />
        ))}
      </div>

      <div className="hidden shrink-0 items-center gap-3 xl:flex">
        {secondaryStatusItems.map(item => (
          <StatusPair item={item} key={item.label} muted />
        ))}
        <div
          className={`flex items-center gap-2 rounded-md border px-2 py-1 font-mono text-xs ${
            hasReadError
              ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
              : "border-[#88d6b6]/30 bg-[#88d6b6]/10 text-[#a4f3d1]"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${hasReadError ? "bg-amber-200" : "bg-[#88d6b6]"}`} />
          {hasReadError ? "BASELINE RPC CHECK" : "CAW READY"}
        </div>
      </div>
    </>
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

function formatEth(value: bigint | undefined, isLoading: boolean): string {
  if (isLoading) {
    return "Loading";
  }

  if (typeof value !== "bigint") {
    return "Unavailable";
  }

  const ethValue = Number(formatEther(value));

  if (ethValue > 0 && ethValue < 0.0001) {
    return "<0.0001 ETH";
  }

  return `${ethValue.toFixed(4)} ETH`;
}

function shortenAddress(address: string | undefined, isLoading = false): string {
  if (isLoading) {
    return "Loading";
  }

  if (!address) {
    return "Unavailable";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
