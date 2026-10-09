"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CARTOLA_ADMIN_SEASONS } from "@/config/cartola";
import { buscarDashboardComMetadados } from "@/services/cartola/cartola.service";
import { ApiError } from "@/services/apiClient";
import { reprocessError, reprocessPartials, validRound, simulateReconsolidation, simulationError, type RoundSimulation, type SimulationReplacement, type ReprocessResult } from "@/services/adminRoundService";
import { Dialog } from "@/components/ui/Dialog";
import shared from "@/components/teams/MyTeamsManager.module.css";
import styles from "./AdminRoundActions.module.css";

const displayValue = (value: number | string | null) => value === null ? "Não disponível" : typeof value === "number" ? value.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) : value;
function replacements(items: SimulationReplacement[] | null) {
  if (items === null) return <p>Não disponível</p>;
  if (!items.length) return <p>Nenhuma substituição.</p>;
  return <ul>{items.map((item) => <li key={`${item.atletaSaiuId}:${item.atletaEntrouId}:${item.posicaoId}`}>
    Atleta {item.atletaSaiuId} → Atleta {item.atletaEntrouId} · Posição {item.posicaoId}
    {item.reservaLuxo && " · Reserva de luxo"}{item.herdouCapitao && " · Herdou capitão"}
  </li>)}</ul>;
}

export function AdminRoundActions() {
  const { user, isLoading } = useAuth();
  return !isLoading && user?.tipoUsuario === "PLATFORM_ADMIN" ? <RoundActions /> : null;
}

function RoundActions() {
  const { user } = useAuth();
  const router = useRouter();
  const [selection, setSelection] = useState<{ temporada: number; rodada: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<typeof selection>(null);
  const [working, setWorking] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReprocessResult | null>(null);
  const running = useRef(false);
  const mounted = useRef(true);
  const simulationRequest = useRef(0);
  const simulationRunning = useRef(false);
  const [simulating, setSimulating] = useState(false);
  const [simulation, setSimulation] = useState<RoundSimulation | null>(null);
  const [simulationFailure, setSimulationFailure] = useState("");

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; simulationRequest.current++; };
  }, []);

  useEffect(() => {
    let active = true;
    buscarDashboardComMetadados().then(({ data, stale }) => {
      const temporada = data.mercado?.temporada;
      if (active && !stale && temporada !== undefined && validRound(temporada, data.rodada)) {
        setSelection((current) => current ?? { temporada, rodada: data.rodada });
      }
    }).catch(() => { /* A ação permanece indisponível sem uma rodada confiável. */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const changeSelection = (next: NonNullable<typeof selection>) => {
    if (running.current || open || !validRound(next.temporada, next.rodada)) return;
    setSelection(next); setResult(null); setBlocked(false);
    simulationRequest.current++; simulationRunning.current = false;
    setSimulating(false); setSimulation(null); setSimulationFailure("");
    if (!accessBlocked) setError("");
  };

  const simulate = async () => {
    if (!selection || simulationRunning.current || running.current || open || accessBlocked) return;
    const selected = selection;
    const request = ++simulationRequest.current;
    simulationRunning.current = true;
    setSimulating(true); setSimulation(null); setSimulationFailure("");
    try {
      const response = await simulateReconsolidation(selected.temporada, selected.rodada);
      if (!mounted.current || request !== simulationRequest.current) return;
      if (response.temporada !== selected.temporada || response.rodada !== selected.rodada) {
        setSimulationFailure("O servidor retornou uma simulação de outra temporada ou rodada. Tente novamente.");
        return;
      }
      setSimulation(response);
    } catch (cause) {
      if (!mounted.current || request !== simulationRequest.current) return;
      setSimulationFailure(simulationError(cause));
      if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
        setAccessBlocked(true); setError(reprocessError(cause));
      }
    } finally {
      if (mounted.current && request === simulationRequest.current) {
        simulationRunning.current = false; setSimulating(false);
      }
    }
  };

  const confirm = async () => {
    if (running.current || blocked || accessBlocked || !open || user?.tipoUsuario !== "PLATFORM_ADMIN" || !validRound(open.temporada, open.rodada)) return;
    const confirmed = open;
    simulationRequest.current++; simulationRunning.current = false;
    setSimulating(false); setSimulation(null); setSimulationFailure("");
    running.current = true;
    setWorking(true); setError(""); setResult(null);
    try {
      const response = await reprocessPartials(confirmed.temporada, confirmed.rodada);
      if (!mounted.current) return;
      if (response.temporada !== confirmed.temporada || response.rodada !== confirmed.rodada || response.status !== "PARCIAL") {
        setError("O servidor retornou dados de outra temporada ou rodada, ou um estado inesperado. O resultado não foi exibido. Verifique antes de tentar novamente.");
        setBlocked(true);
        return;
      }
      setResult(response);
      router.refresh();
    } catch (cause) {
      if (!mounted.current) return;
      setError(reprocessError(cause));
      if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) setAccessBlocked(true);
      if (cause instanceof ApiError && (cause.status === 404 ||
        (cause.status === 409 && /consolidad|snapshot|envelope/i.test(cause.message)))) setBlocked(true);
    } finally {
      running.current = false;
      if (mounted.current) { setWorking(false); setOpen(null); }
    }
  };

  return <section className={styles.panel} aria-labelledby="admin-round-title">
    <p className="eyebrow">Administração</p>
    <h2 id="admin-round-title">Processamento da rodada</h2>
    <div className={styles.selectors}>
      <label>Temporada<select value={selection?.temporada ?? ""} disabled={!selection || working || !!open} onChange={(event) => { if (selection) changeSelection({ ...selection, temporada: Number(event.target.value) }); }}>
        {!selection && <option value="">Indisponível</option>}
        {[...new Set([...CARTOLA_ADMIN_SEASONS, ...(selection ? [selection.temporada] : [])])].sort((a, b) => b - a).map((season) => <option key={season} value={season}>{season}</option>)}
      </select></label>
      <label>Rodada<select value={selection?.rodada ?? ""} disabled={!selection || working || !!open} onChange={(event) => { if (selection) changeSelection({ ...selection, rodada: Number(event.target.value) }); }}>
        {!selection && <option value="">Indisponível</option>}
        {Array.from({ length: 38 }, (_, index) => index + 1).map((round) => <option key={round} value={round}>{round}</option>)}
      </select></label>
    </div>
    <p>{loading ? "Carregando rodada atual..." : selection === null ? "Não foi possível identificar a rodada atual. Recarregue a página para tentar novamente." : `Rodada ${selection.rodada} · Temporada ${selection.temporada}`}</p>
    <p>As temporadas configuradas não garantem a existência de rodadas no banco.</p>
    <p>A disponibilidade será validada pelo servidor. Este processo não consolida a rodada.</p>
    <button className={styles.action} type="button" disabled={loading || !selection || working || simulating || blocked || accessBlocked || !!open} onClick={() => setOpen(selection)}>
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
    <section className={styles.simulation} aria-labelledby="round-simulation-title">
      <h3 id="round-simulation-title">Simulação de reconsolidação</h3>
      <p>Confira diferenças de pontuação e substituições antes de realizar qualquer correção.</p>
      <button className={styles.action} type="button" disabled={loading || !selection || simulating || working || !!open || accessBlocked} onClick={() => void simulate()}>
        {simulating && <Loader2 size={18} className={shared.spin} aria-hidden="true" />}
        {simulating ? "Simulando reconsolidação..." : "Simular reconsolidação"}
      </button>
      {simulationFailure && <p className={shared.inlineError} role="alert">{simulationFailure}</p>}
      {simulation && <div role="status">
        <p>Rodada {simulation.rodada} · Temporada {simulation.temporada}</p>
        {!simulation.diagnosticoDefinitivo && <p className={styles.notice}>Resultado não conclusivo: o diagnóstico não é definitivo.</p>}
        {simulation.processamentoEmAndamento && <p className={styles.notice}>Existe processamento concorrente em andamento. Repita a simulação após sua conclusão.</p>}
        <dl className={styles.summary}>
          {[["Total de times", simulation.totalTimes], ["Consistentes", simulation.consistentes], ["Divergentes", simulation.divergentes], ["Pendentes de dados", simulation.pendentesDeDados], ["Não verificáveis", simulation.naoVerificaveis], ["Times sem snapshot", simulation.timesSemSnapshot]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{displayValue(value)}</dd></div>)}
        </dl>
        <h4>Times divergentes</h4>
        {!simulation.times.some((team) => team.classificacao === "DIVERGENTE") && <p>Nenhum time divergente neste diagnóstico.</p>}
        {simulation.times.filter((team) => team.classificacao === "DIVERGENTE").map((team) => <article key={team.timeId} className={styles.team}>
          <h4>{displayValue(team.nomeTime)} · Time {team.timeId}</h4>
          <dl className={styles.summary}>
            <div><dt>Pontuação atual</dt><dd>{displayValue(team.pontuacaoPersistida)}</dd></div>
            <div><dt>Pontuação recalculada</dt><dd>{displayValue(team.pontuacaoRecalculada)}</dd></div>
            <div><dt>Diferença</dt><dd>{displayValue(team.diferenca)}</dd></div>
            <div><dt>Participantes</dt><dd>{displayValue(team.jogadoresParticiparam)}</dd></div>
          </dl>
          <p>Motivo: {displayValue(team.motivo)}</p>
          <details><summary>Ver substituições e capitão</summary>
            <h5>Substituições persistidas</h5>{replacements(team.substituicoesPersistidas)}
            <h5>Substituições esperadas</h5>{replacements(team.substituicoesEsperadas)}
            <p>Capitão efetivo (ID): {displayValue(team.capitaoEfetivoId)}</p>
          </details>
        </article>)}
      </div>}
    </section>
    {open && <Dialog title={`Reprocessar parciais da Rodada ${open.rodada} · Temporada ${open.temporada}?`} close={() => { if (!running.current) setOpen(null); }} busy={working}>
      <p className={shared.helper}>Esta operação grava alterações nas pontuações e substituições. Todos os times da rodada serão recalculados utilizando as escalações já congeladas e os dados parciais disponíveis. A rodada continuará como parcial.</p>
      <div className={`${shared.footer} ${styles.actions}`}>
        <button type="button" disabled={working} onClick={() => setOpen(null)}>Cancelar</button>
        <button type="button" disabled={working} onClick={() => void confirm()}>
          {working && <Loader2 className={shared.spin} aria-hidden="true" />}
          {working ? "Reprocessando parciais..." : "Reprocessar parciais"}
        </button>
      </div>
    </Dialog>}
  </section>;
}
