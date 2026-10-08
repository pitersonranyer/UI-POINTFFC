"use client";

import { useEffect, useRef } from "react";
import type { DesafioDetalhe, DesafioRanking } from "@/services/desafioService";

export function detailPollingInterval(data: DesafioDetalhe | null): number | null {
  if (!data || data.status === "CANCELADO") return null;
  if (data.partidas.some(game => game.status === "EM_ANDAMENTO")) return 30_000;
  const pending = data.partidas.some(game => {
    if (game.status === "AGENDADA") return true;
    if (game.status !== "FINALIZADA") return false;
    if (game.apurado === true) return false;
    const picks = data.minhasInscricoes?.filter(entry => entry.status === "ATIVA")
      .flatMap(entry => entry.palpites.filter(pick => pick.partidaId === game.id));
    return !picks?.length || picks.some(pick => !pick.apurado);
  });
  return pending ? 60_000 : null;
}

export function rankingPollingInterval(data: DesafioRanking | null): number | null {
  if (!data || data.status === "CANCELADO") return null;
  if (data.totalPartidasValidas > 0 && data.totalPartidasApuradas >= data.totalPartidasValidas) return null;
  if (data.status === "EM_ANDAMENTO") return 30_000;
  if (data.totalPartidasApuradas < data.totalPartidasValidas || data.status === "ABERTO") return 60_000;
  return null;
}

// A single timeout is scheduled after each read, never while that read is pending.
export function useDesafioPolling(update: () => Promise<unknown>, interval: number | null) {
  const latest = useRef(update);
  latest.current = update;
  useEffect(() => {
    let stopped = false, running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (!stopped && !document.hidden && interval !== null) timer = setTimeout(() => void run(), interval);
    };
    const run = async () => {
      if (stopped || document.hidden || running) return;
      running = true;
      try { await latest.current(); }
      finally { running = false; schedule(); }
    };
    const visibility = () => {
      clearTimeout(timer);
      if (!document.hidden) void run();
    };
    schedule();
    document.addEventListener("visibilitychange", visibility);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener("visibilitychange", visibility); };
  }, [interval]);
}
