"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { walletService } from "@/services/walletService";
import type { PixCharge, Wallet, WalletTransaction } from "@/types/wallet";

interface WalletContextValue {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  activeCharge: PixCharge | null;
  isLoading: boolean;
  error: string | null;
  createPixDeposit(value: number): Promise<PixCharge>;
  simulatePixPayment(id: string): Promise<PixCharge>;
  clearActiveCharge(): void;
  resetMock(): Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [activeCharge, setActiveCharge] = useState<PixCharge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { const [nextWallet, nextTransactions] = await Promise.all([walletService.getWallet(), walletService.getTransactions()]); setWallet(nextWallet); setTransactions(nextTransactions); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível carregar a carteira."); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const createPixDeposit = useCallback(async (value: number) => { setError(null); const charge = await walletService.createPixDeposit(value); setActiveCharge(charge); return charge; }, []);
  const simulatePixPayment = useCallback(async (id: string) => { setError(null); const result = await walletService.simulatePixPayment(id); setWallet(result.wallet); setTransactions((current) => [result.transaction, ...current]); setActiveCharge(result.charge); return result.charge; }, []);
  const resetMock = useCallback(async () => { await walletService.resetMock(); setActiveCharge(null); await load(); }, [load]);
  const value = useMemo(() => ({ wallet, transactions, activeCharge, isLoading, error, createPixDeposit, simulatePixPayment, clearActiveCharge: () => setActiveCharge(null), resetMock }), [wallet, transactions, activeCharge, isLoading, error, createPixDeposit, simulatePixPayment, resetMock]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() { const context = useContext(WalletContext); if (!context) throw new Error("useWallet deve ser usado dentro de WalletProvider"); return context; }
