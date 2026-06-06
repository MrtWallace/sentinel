"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { connectExistingCawWallet, createCawWallet, getWalletStatus, refreshWalletStatus } from "~~/lib/sentinel/api";
import { DEMO_USER_ADDRESS } from "~~/lib/sentinel/mockData";
import type { CawWalletBinding } from "~~/lib/sentinel/types";

type WalletAction = "connect" | "create" | "refresh";

type CawWalletContextValue = {
  action: WalletAction | null;
  error: string | null;
  isLoading: boolean;
  userAddress: string;
  walletBinding: CawWalletBinding | null;
  connectExisting: (cawWalletId: string) => Promise<void>;
  createWallet: () => Promise<void>;
  refreshStatus: () => Promise<void>;
};

const CawWalletContext = createContext<CawWalletContextValue | null>(null);

export const CawWalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [action, setAction] = useState<WalletAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBinding, setWalletBinding] = useState<CawWalletBinding | null>(null);
  const userAddress = DEMO_USER_ADDRESS;

  const loadWalletStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setWalletBinding(await getWalletStatus(userAddress));
    } catch {
      setError("CAW wallet status is unavailable.");
      setWalletBinding(null);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    void loadWalletStatus();
  }, [loadWalletStatus]);

  const connectExisting = useCallback(
    async (cawWalletId: string) => {
      setAction("connect");
      setError(null);

      try {
        setWalletBinding(await connectExistingCawWallet({ userAddress, cawWalletId }));
      } catch {
        setError("Could not connect the existing CAW wallet.");
      } finally {
        setAction(null);
      }
    },
    [userAddress],
  );

  const createWallet = useCallback(async () => {
    setAction("create");
    setError(null);

    try {
      setWalletBinding(await createCawWallet({ userAddress }));
    } catch {
      setError("Could not create a CAW wallet.");
    } finally {
      setAction(null);
    }
  }, [userAddress]);

  const refreshStatus = useCallback(async () => {
    setAction("refresh");
    setError(null);

    try {
      setWalletBinding(await refreshWalletStatus({ userAddress }));
    } catch {
      setError("Could not refresh CAW status.");
    } finally {
      setAction(null);
    }
  }, [userAddress]);

  const value = useMemo<CawWalletContextValue>(
    () => ({
      action,
      error,
      isLoading,
      userAddress,
      walletBinding,
      connectExisting,
      createWallet,
      refreshStatus,
    }),
    [action, connectExisting, createWallet, error, isLoading, refreshStatus, userAddress, walletBinding],
  );

  return <CawWalletContext.Provider value={value}>{children}</CawWalletContext.Provider>;
};

export function useCawWallet(): CawWalletContextValue {
  const value = useContext(CawWalletContext);

  if (!value) {
    throw new Error("useCawWallet must be used inside CawWalletProvider.");
  }

  return value;
}
