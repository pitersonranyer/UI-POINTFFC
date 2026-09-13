"use client";
import { useEffect, useState } from "react";
import { buscarRodadaAtual, buscarRodadaAtualBsa } from "@/services/futebolService";
import type { FutebolRodada } from "@/types/futebol";
import type { FutebolCompeticaoCodigo } from "@/data/futebolCompeticoes";

export function useFutebolRodada(enabled = true, codigo: FutebolCompeticaoCodigo = "BSA") {
  const [data, setData] = useState<FutebolRodada | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) { setData(null); setLoading(false); setError(null); return; }
    let active = true;
    let pending = false;
    let loaded = false;
    setLoading(true);
    setData(null);
    setError(null);
    const refresh = () => {
      if (pending) return;
      pending = true;
      (codigo === "BSA" ? buscarRodadaAtualBsa() : buscarRodadaAtual(codigo)).then(result => {
        if (active) { loaded = true; setData(result); setError(null); }
      }).catch(() => {
        if (active && !loaded) setError("Não foi possível carregar os jogos da rodada.");
      }).finally(() => { pending = false; if (active) setLoading(false); });
    };
    refresh();
    const timer = setInterval(refresh, 5 * 60_000);
    return () => { active = false; clearInterval(timer); };
  }, [enabled, codigo]);
  return { data, loading, error };
}
