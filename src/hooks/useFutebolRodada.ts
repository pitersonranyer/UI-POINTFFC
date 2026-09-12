"use client";
import { useEffect, useState } from "react";
import { buscarRodadaAtualBsa } from "@/services/futebolService";
import type { FutebolRodada } from "@/types/futebol";

export function useFutebolRodada(enabled = true) {
  const [data, setData] = useState<FutebolRodada | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let pending = false;
    let loaded = false;
    setLoading(true);
    const refresh = () => {
      if (pending) return;
      pending = true;
      buscarRodadaAtualBsa().then(result => {
        if (active) { loaded = true; setData(result); setError(null); }
      }).catch(() => {
        if (active && !loaded) setError("Não foi possível carregar os jogos da rodada.");
      }).finally(() => { pending = false; if (active) setLoading(false); });
    };
    refresh();
    const timer = setInterval(refresh, 5 * 60_000);
    return () => { active = false; clearInterval(timer); };
  }, [enabled]);
  return { data, loading, error };
}
