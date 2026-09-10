"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { ApiError } from "@/services/apiClient";
import { walletService } from "@/services/walletService";
import type { WalletPix } from "@/types/wallet";

const pending = (charge: WalletPix) => charge.status === "PENDENTE" || charge.status === "PROCESSANDO";

// The session-scoped WalletProvider unmounts the modal on logout or identity changes.
export function useWalletPixStatus(initial: WalletPix | null) {
  const { refreshWallet } = useWallet();
  const [snapshot, setSnapshot] = useState<{ source: WalletPix; charge: WalletPix } | null>(null);
  const [pollError, setPollError] = useState("");
  const [balanceError, setBalanceError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const generation = useRef(0);
  const refreshingVersion = useRef<number | null>(null);
  const updateBalance = useCallback(async (version: number) => {
    if (version !== generation.current || refreshingVersion.current === version) return;
    refreshingVersion.current = version;
    setRefreshing(true);
    try {
      const success = await refreshWallet();
      if (version === generation.current) setBalanceError(!success);
    } catch {
      if (version === generation.current) setBalanceError(true);
    } finally {
      if (version === generation.current) { refreshingVersion.current = null; setRefreshing(false); }
    }
  }, [refreshWallet]);
  useEffect(() => {
    const version = ++generation.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let request: AbortController | undefined;
    const active = () => version === generation.current;
    setPollError(""); setBalanceError(false); setRefreshing(false);
    async function poll() {
      if (!initial || !active()) return;
      request = new AbortController();
      let again = true;
      try {
        const next = await walletService.getPix(initial.id, request.signal);
        if (!active()) return;
        if (next.id !== initial.id) throw new Error("Recarga incompatível");
        setSnapshot({ source: initial, charge: {
          ...next, qrCode: next.qrCode ?? initial.qrCode, pixCopiaCola: next.pixCopiaCola ?? initial.pixCopiaCola,
        } });
        setPollError("");
        again = pending(next);
        if (next.status === "APROVADA") void updateBalance(version);
      } catch (error) {
        if (!active()) return;
        again = !(error instanceof ApiError && (error.status === 401 || error.status === 403));
        setPollError(again
          ? "Não foi possível atualizar o status agora. Tentaremos novamente em instantes."
          : "Sua sessão não está disponível. Entre novamente para consultar o pagamento.");
      } finally {
        if (active() && again) timer = setTimeout(() => void poll(), 4000);
      }
    }
    if (initial && pending(initial)) timer = setTimeout(() => void poll(), 4000);
    // Defer to avoid duplicate refresh in React StrictMode's effect setup/cleanup cycle.
    if (initial?.status === "APROVADA") void Promise.resolve().then(() => { if (active()) void updateBalance(version); });
    return () => { generation.current++; clearTimeout(timer); request?.abort(); };
  }, [initial, updateBalance]);
  return {
    charge: snapshot?.source === initial ? snapshot.charge : initial,
    pollError, balanceError, refreshing,
    retryBalance: () => void updateBalance(generation.current),
  };
}
