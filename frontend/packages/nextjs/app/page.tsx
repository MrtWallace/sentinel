"use client";

import type { NextPage } from "next";
import { formatEther } from "viem";
import { useBalance } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const CONTRACT_ADDRESS = "0xad7C1EBe561C9359C657FA36a156Cd213C8E6d7c";

const Home: NextPage = () => {
  const { data: balance } = useBalance({ address: CONTRACT_ADDRESS });

  const { data: owner } = useScaffoldReadContract({
    contractName: "SmartAccount",
    functionName: "owner",
  });

  const { data: agent } = useScaffoldReadContract({
    contractName: "SmartAccount",
    functionName: "agent",
  });

  const { data: dailyLimit } = useScaffoldReadContract({
    contractName: "SmartAccount",
    functionName: "dailyLimit",
  });

  const { data: dailySpent } = useScaffoldReadContract({
    contractName: "SmartAccount",
    functionName: "dailySpent",
  });

  const limitEth = dailyLimit ? parseFloat(formatEther(dailyLimit)) : 0;
  const spentEth = dailySpent ? parseFloat(formatEther(dailySpent)) : 0;
  const usedPct = limitEth > 0 ? Math.round((spentEth / limitEth) * 100) : 0;

  return (
    <div className="flex flex-col items-center pt-10 px-4 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Sentinel</h1>
        <p className="text-gray-500 mt-1">AI Agent for DeFi Operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">

        <div className="card bg-base-100 shadow-md p-6 col-span-2">
          <h2 className="text-sm text-gray-500 mb-1">Contract Balance</h2>
          <p className="text-3xl font-mono font-bold">
            {balance ? parseFloat(balance.formatted).toFixed(4) : "..."} ETH
          </p>
          <p className="text-xs text-gray-400 mt-1">{CONTRACT_ADDRESS}</p>
        </div>

        <div className="card bg-base-100 shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-2">Daily Limit</h2>
          <p className="text-2xl font-mono font-bold">{limitEth.toFixed(4)} ETH</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Spent today: {spentEth.toFixed(4)} ETH</span>
              <span>{usedPct}%</span>
            </div>
            <progress className="progress progress-primary w-full" value={usedPct} max="100" />
          </div>
        </div>

        <div className="card bg-base-100 shadow-md p-6">
          <h2 className="text-sm text-gray-500 mb-2">Roles</h2>
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-xs text-gray-400">Owner</span>
              {owner && <span className="font-mono text-xs break-all">{owner}</span>}
            </div>
            <div>
              <span className="text-xs text-gray-400">Agent</span>
              {agent && <span className="font-mono text-xs break-all">{agent}</span>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
