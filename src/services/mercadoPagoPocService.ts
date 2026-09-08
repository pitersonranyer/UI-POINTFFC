import { apiFetch } from "./apiClient";
import type { MercadoPagoPix } from "@/types/mercado-pago-poc";

const base = "/poc/mercado-pago";

export const mercadoPagoPocService = {
  health(signal?: AbortSignal) {
    return apiFetch<unknown>(`${base}/health`, { signal, cache: "no-store" });
  },
  create(valor: number, signal?: AbortSignal) {
    return apiFetch<MercadoPagoPix>(`${base}/pix`, {
      method: "POST", body: JSON.stringify({ valor }), signal,
    });
  },
  status(id: string, signal?: AbortSignal) {
    return apiFetch<MercadoPagoPix>(`${base}/pix/${encodeURIComponent(id)}/status`, { signal, cache: "no-store" });
  },
};
