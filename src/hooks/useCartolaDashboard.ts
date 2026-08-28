"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { buscarAtletasPontuados, buscarAtletasPontuadosRodada, buscarDashboardComMetadados, buscarPartidasRodada } from "@/services/cartola/cartola.service";
import type { CartolaDashboardResponse, CartolaMatch, CartolaScoredAthletesResponse } from "@/types/cartola";
export function useCartolaDashboard() {
  const [dashboard, setDashboard] = useState<CartolaDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [stale, setStale] = useState(false);
  const [athletes,setAthletes]=useState<CartolaScoredAthletesResponse|null>(null); const [athletesLoading,setAthletesLoading]=useState(true); const [athletesError,setAthletesError]=useState<string|null>(null);
  const [statisticsMatches,setStatisticsMatches]=useState<CartolaMatch[]|null>(null);
  const mounted = useRef(true); const running = useRef(false);
  const atualizar = useCallback(async () => {
    if (running.current) return; running.current = true;
    try { const result = await buscarDashboardComMetadados(); if (!mounted.current) return; setDashboard(result.data); setStale(result.stale); setError(null);
      if(result.data.mercadoAberto&&result.data.rodada===1){setAthletes(null);setAthletesError(null);setAthletesLoading(false);setStatisticsMatches([]);}
      else try { const scored=result.data.mercadoAberto?await buscarAtletasPontuadosRodada(result.data.rodada-1):await buscarAtletasPontuados(); if(mounted.current){setAthletes(scored);setAthletesError(null);} }
      catch(cause){if(mounted.current)setAthletesError(cause instanceof Error?cause.message:"Não foi possível atualizar os atletas.");}
      finally{if(mounted.current)setAthletesLoading(false);}
      if(!result.data.mercadoAberto)setStatisticsMatches(result.data.partidas);
      else if(result.data.rodada>1)try{const previous=await buscarPartidasRodada(result.data.rodada-1);if(mounted.current)setStatisticsMatches(previous.partidas??[]);}catch{/* Mantém as últimas estatísticas válidas. */}
    }
    catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "Não foi possível atualizar os dados da rodada."); }
    finally { running.current = false; if (mounted.current) setLoading(false); }
  }, []);
  useEffect(() => { atualizar(); }, [atualizar]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") atualizar(); }, dashboard?.bolaRolando ? 20_000 : 60_000);
    const onVisibility = () => { if (document.visibilityState === "visible") atualizar(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [dashboard?.bolaRolando, atualizar]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return { dashboard, loading, error, stale, atualizar, athletes, athletesLoading, athletesError, statisticsMatches };
}
