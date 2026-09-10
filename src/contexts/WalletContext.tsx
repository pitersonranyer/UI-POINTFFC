"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { walletService } from "@/services/walletService";
import { useAuth } from "@/contexts/AuthContext";
import type { Wallet } from "@/types/wallet";

interface WalletContextValue {
  wallet: Wallet | null;
  isLoading: boolean;
  error: string | null;
  refreshWallet(): Promise<boolean>;
}
const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser, isAuthenticated, isLoading } = useAuth();
  const identity = isAuthenticated && !isLoading && user
    ? JSON.stringify([user.idUsuario, firebaseUser?.uid]) : null;
  // Session changes clear the balance synchronously, before consumers render.
  return <SessionWalletProvider key={identity ?? "signed-out"} enabled={identity !== null} authLoading={isLoading}>{children}</SessionWalletProvider>;
}

function SessionWalletProvider({ children, enabled, authLoading }: { children: React.ReactNode; enabled: boolean; authLoading: boolean }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<{ controller: AbortController; promise: Promise<boolean> } | null>(null);
  const refreshWallet = useCallback((): Promise<boolean> => {
    if (!enabled) return Promise.resolve(false);
    if (request.current) return request.current.promise;
    const controller = new AbortController();
    setIsLoading(true); setError(null); setWallet(null);
    const promise = Promise.resolve().then(async () => {
      if (controller.signal.aborted) return false;
      try {
        const result = await walletService.getWallet(controller.signal);
        if (!controller.signal.aborted) setWallet(result);
        return !controller.signal.aborted;
      } catch {
        if (!controller.signal.aborted) setError("Não foi possível carregar seu saldo.");
        return false;
      } finally {
        if (!controller.signal.aborted) { request.current = null; setIsLoading(false); }
      }
    });
    request.current = { controller, promise };
    return promise;
  }, [enabled]);
  useEffect(() => {
    void refreshWallet();
    return () => { request.current?.controller.abort(); request.current = null; };
  }, [refreshWallet]);
  const value = useMemo(() => ({ wallet, isLoading: authLoading || isLoading, error, refreshWallet }), [wallet, authLoading, isLoading, error, refreshWallet]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet deve ser usado dentro de WalletProvider");
  return context;
}
