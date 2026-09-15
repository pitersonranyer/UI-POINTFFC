"use client";
import { useCallback, useEffect, useState } from "react";
import { buscarJogosHoje } from "@/services/futebolService";
import type { FutebolJogosHoje } from "@/types/futebol";

export function useJogosHoje() {
  const [data, setData] = useState<FutebolJogosHoje | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const atualizar = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    buscarJogosHoje().then(result => {
      if (active) setData(result);
    }).catch(() => {
      if (active) setError("Não foi possível carregar os jogos de hoje.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return { data, loading, error, atualizar };
}
