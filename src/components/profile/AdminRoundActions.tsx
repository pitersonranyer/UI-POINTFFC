"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CARTOLA_SEASON } from "@/config/cartola";
import { buscarDashboardComMetadados } from "@/services/cartola/cartola.service";
import { ApiError } from "@/services/apiClient";
import { reprocessError, reprocessPartials, validRound, type ReprocessResult } from "@/services/adminRoundService";
import { Dialog } from "@/components/ui/Dialog";
import shared from "@/components/teams/MyTeamsManager.module.css";
import styles from "./AdminRoundActions.module.css";

export function AdminRoundActions() {
  const { user, isLoading } = useAuth();
  return !isLoading && user?.tipoUsuario === "PLATFORM_ADMIN" ? <RoundActions /> : null;
}

function RoundActions() {
  const { user } = useAuth();
  const router = useRouter();
  const [round, setRound] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReprocessResult | null>(null);
  const running = useRef(false);

  useEffect(() => {
    let active = true;
    buscarDashboardComMetadados().then(({ data, stale }) => {
      if (active && !stale && validRound(CARTOLA_SEASON, data.rodada)) setRound(data.rodada);
    }).catch(() => { /* A ação permanece indisponível sem uma rodada confiável. */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const confirm = async () => {
    if (running.current || blocked || round === null || user?.tipoUsuario !== "PLATFORM_ADMIN" || !validRound(CARTOLA_SEASON, round)) return;
    running.current = true;
    setWorking(true); setError(""); setResult(null);
    try {
      const response = await reprocessPartials(CARTOLA_SEASON, round);
      setResult(response);
      router.refresh();
    } catch (cause) {
      setError(reprocessError(cause));
      if (cause instanceof ApiError && (cause.status === 404 || cause.status === 403 ||
        (cause.status === 409 && /consolidad|snapshot|envelope/i.test(cause.message)))) setBlocked(true);
    } finally {
      running.current = false; setWorking(false); setOpen(false);
    }
  };

  return <section className={styles.panel} aria-labelledby="admin-round-title">
    <p className="eyebrow">Administração</p>
    <h2 id="admin-round-title">Processamento da rodada</h2>
    <p>{loading ? "Carregando rodada atual..." : round === null ? "Não foi possível identificar a rodada atual. Recarregue a página para tentar novamente." : `Rodada ${round} · Temporada ${CARTOLA_SEASON}`}</p>
    <p>A disponibilidade será validada pelo servidor. Este processo não consolida a rodada.</p>
    <button className={styles.action} type="button" disabled={loading || round === null || working || blocked} onClick={() => setOpen(true)}>
      {working ? <Loader2 size={18} className={shared.spin} aria-hidden="true" /> : <RotateCw size={18} aria-hidden="true" />}
      {working ? "Reprocessando parciais..." : "Reprocessar parciais"}
    </button>
    {error && <p className={shared.inlineError} role="alert">{error}</p>}
    {result && <div className={shared.summary} role="status">
      <strong>Parciais reprocessadas com sucesso.</strong>
      {result.timesComErro > 0 && <p>Processamento concluído com falhas: alguns times mantiveram os dados anteriores.</p>}
      <p>Rodada {result.rodada} · Temporada {result.temporada} · Parcial</p>
      <dl className={styles.summary}>
        <div><dt>Times processados</dt><dd>{result.timesProcessados.toLocaleString("pt-BR")}</dd></div>
        <div><dt>Times com erro</dt><dd>{result.timesComErro.toLocaleString("pt-BR")}</dd></div>
        <div><dt>Substituições alteradas</dt><dd>{result.substituicoesAlteradas.toLocaleString("pt-BR")}</dd></div>
        <div><dt>Duração</dt><dd>{(result.duracaoMs / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} s</dd></div>
      </dl>
    </div>}
    {open && <Dialog title={`Reprocessar parciais da Rodada ${round}?`} close={() => { if (!running.current) setOpen(false); }} busy={working}>
      <p className={shared.helper}>Todos os times da rodada serão recalculados utilizando as escalações já congeladas e os dados parciais disponíveis. A rodada continuará como parcial.</p>
      <div className={`${shared.footer} ${styles.actions}`}>
        <button type="button" disabled={working} onClick={() => setOpen(false)}>Cancelar</button>
        <button type="button" disabled={working} onClick={() => void confirm()}>
          {working && <Loader2 className={shared.spin} aria-hidden="true" />}
          {working ? "Reprocessando parciais..." : "Reprocessar parciais"}
        </button>
      </div>
    </Dialog>}
  </section>;
}
