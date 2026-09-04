"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { generalRankingService } from "@/services/generalRankingService";
import { partialScoreService } from "@/services/partialScoreService";
import { useAuth } from "@/contexts/AuthContext";
import type { GeneralRankingResponse } from "@/types/general-ranking";

export type RankingWarning = "partial" | "update-failed" | null;
export function useGeneralRanking(temporada: number, fallbackRound: number) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [ranking, setRanking] = useState<GeneralRankingResponse | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(false), [warning, setWarning] = useState<RankingWarning>(null), [retrying, setRetrying] = useState(false);
  const mounted = useRef(true), attempt = useRef(0);
  const load = useCallback(async (retry = false) => {
    const currentAttempt = ++attempt.current; retry ? setRetrying(true) : setLoading(true); setError(false); setWarning(null);
    let season = temporada, round = fallbackRound, updateFailed = false;
    try {
      if (isAuthenticated) {
        try {
          const update = await partialScoreService.atualizarRodadaAnterior(temporada);
          season = update.temporada; round = update.rodada;
          if (update.falhas > 0 || update.semSnapshot > 0) { setWarning("partial"); if (process.env.NODE_ENV === "development" && update.detalhesFalhas.length) console.debug("Falhas ao atualizar ranking", update.detalhesFalhas); }
        } catch { updateFailed = true; setWarning("update-failed"); }
      }
      const response = await generalRankingService.buscar(season, round, 100);
      if (mounted.current && currentAttempt === attempt.current) setRanking(response);
    } catch { updateFailed = false; if (mounted.current && currentAttempt === attempt.current) { setRanking(null); setWarning(null); setError(true); } }
    finally { if (mounted.current && currentAttempt === attempt.current) { setLoading(false); setRetrying(false); if (updateFailed) setWarning("update-failed"); } }
  }, [temporada, fallbackRound, isAuthenticated]);
  useEffect(() => { mounted.current = true; if (!isAuthLoading) void load(); return () => { mounted.current = false; }; }, [isAuthLoading, load]);
  return { ranking, loading, error, warning, retrying, retry: () => load(true), firstRound: fallbackRound <= 1 };
}
