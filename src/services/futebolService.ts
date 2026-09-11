import { apiFetch } from "@/services/apiClient";
import type { FutebolRodada } from "@/types/futebol";

export const buscarRodadaAtualBsa = () => apiFetch<FutebolRodada>("/futebol/competicoes/BSA/rodada-atual", { cache: "no-store" });
