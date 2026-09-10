import { apiFetch } from "./apiClient";
import type { Wallet } from "@/types/wallet";

export const walletService = {
  async getWallet(signal?: AbortSignal): Promise<Wallet> {
    const wallet = await apiFetch<Wallet>("/carteira", { authenticated: true, cache: "no-store", signal });
    const decimal = (value: unknown) => typeof value === "string" && /^\d{1,10}\.\d{2}$/.test(value);
    if (!wallet || !decimal(wallet.saldoDisponivel) || !decimal(wallet.saldoBloqueado) ||
      !["ATIVA", "BLOQUEADA"].includes(wallet.status)) throw new Error("Resposta de carteira inválida");
    return wallet;
  },
};
