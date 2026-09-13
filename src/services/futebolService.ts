import { apiFetch } from "@/services/apiClient";
import type { FutebolRodada } from "@/types/futebol";
import type { FutebolCompeticaoCodigo } from "@/data/futebolCompeticoes";

export const buscarRodadaAtual = (codigo: FutebolCompeticaoCodigo) => apiFetch<FutebolRodada>(`/futebol/competicoes/${codigo}/rodada-atual`, { cache: "no-store" });
export const buscarRodadaAtualBsa = () => buscarRodadaAtual("BSA");
