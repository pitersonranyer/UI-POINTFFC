import { apiFetch } from "./apiClient";
import type { Wallet, WalletPix } from "@/types/wallet";

export const walletService = {
  getPix(id: number, signal?: AbortSignal): Promise<WalletPix> {
    return apiFetch<WalletPix>(`/carteira/recargas/${id}`, {
      method: "GET", authenticated: true, cache: "no-store", signal,
    });
  },
  createPix(valor: string, key: string, signal?: AbortSignal): Promise<WalletPix> {
    return apiFetch<WalletPix>("/carteira/recargas/pix", {
      method: "POST", authenticated: true, headers: { "Idempotency-Key": key },
      body: JSON.stringify({ valor }), signal,
    });
  },
  async getWallet(signal?: AbortSignal): Promise<Wallet> {
    const wallet = await apiFetch<Wallet>("/carteira", { authenticated: true, cache: "no-store", signal });
    const decimal = (value: unknown) => typeof value === "string" && /^\d{1,10}\.\d{2}$/.test(value);
    if (!wallet || !decimal(wallet.saldoDisponivel) || !decimal(wallet.saldoBloqueado) ||
      !["ATIVA", "BLOQUEADA"].includes(wallet.status)) throw new Error("Resposta de carteira inválida");
    return wallet;
  },
};
