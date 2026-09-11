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
    setLoading(true);
    buscarRodadaAtualBsa().then(result => {
      if (active) { setData(result); setError(null); }
    }).catch(() => {
      if (active) setError("Não foi possível carregar os jogos da rodada.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [enabled]);
  return { data, loading, error };
}
