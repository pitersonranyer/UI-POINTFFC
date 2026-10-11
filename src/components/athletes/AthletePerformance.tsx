"use client";
import { useEffect, useState } from "react";
import { fetchAthleteHistory } from "@/services/athleteHistoryService";
import type { AthleteHistory, HistoryRound } from "@/types/athlete-history";
import styles from "./AthletePerformance.module.css";

const format = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const value = (n: number | null | undefined) => typeof n === "number" && Number.isFinite(n) ? format.format(n) : "—";
const hasScore = (r: HistoryRound) => typeof r.pontuacao === "number" && Number.isFinite(r.pontuacao);
const description = (r: HistoryRound) => !hasScore(r) ? (r.situacao === "NAO_JOGOU" ? "Não entrou em campo" : "Sem pontuação disponível") : `${value(r.pontuacao)} pts • ${r.parcial ? "Parcial" : r.statusRodada === "CONSOLIDADA" ? "Consolidada" : "Consolidação não informada"}`;

export function AthletePerformance({ athleteId, season, round }: { athleteId: string; season?: number; round?: number }) {
  const [limit, setLimit] = useState<5 | 10>(5);
  const [attempt, setAttempt] = useState(0);
  const key = `${athleteId}:${season}:${round}:${limit}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: AthleteHistory; error?: boolean }>();
  useEffect(() => {
    if (!season || !round) return;
    let active = true;
    fetchAthleteHistory(athleteId, season, round, limit).then(data => {
      if (active) setResult({ key, data });
    }).catch(() => { if (active) setResult({ key, error: true }); });
    return () => { active = false; };
  }, [athleteId, season, round, limit, attempt, key]);
  const current = result?.key === key ? result : undefined;
  const data = current?.data;
  const indicators = data?.indicadores;
  const metrics = indicators ? [
    ["Média últimas 5", indicators.amostraUltimas5 > 0 ? indicators.mediaUltimas5 : null],
    ["Média geral disponível", indicators.amostraGeral > 0 ? indicators.mediaGeralDisponivel : null],
    ["Maior pontuação", indicators.amostraGeral > 0 ? indicators.maior?.pontuacao : null],
    ["Menor pontuação", indicators.amostraGeral > 0 ? indicators.menor?.pontuacao : null],
    ["Regularidade (desvio padrão)", indicators.amostraGeral > 1 ? indicators.desvioPadrao : null],
  ] as const : [];
  return <div className={styles.performance}>
    <label className={styles.selector}>Evolução da pontuação<select aria-label="Quantidade de rodadas" value={limit} onChange={e => setLimit(Number(e.target.value) as 5 | 10)}><option value={5}>5 rodadas</option><option value={10}>10 rodadas</option></select></label>
    {!season || !round ? <p role="status">Temporada ou rodada de referência indisponível.</p>
      : current?.error ? <div role="alert"><p>Não foi possível carregar o histórico. O servidor pode estar indisponível.</p><button type="button" onClick={() => setAttempt(n => n + 1)}>Tentar novamente</button></div>
      : !data ? <p role="status">Carregando histórico…</p>
      : <>
        {data.historico.some(hasScore) ? <ScoreChart rounds={data.historico} /> : <p role="status">Nenhuma pontuação disponível neste histórico.</p>}
        {data.historico.length > 0 && <ul className={styles.rounds} aria-label="Histórico por rodada">{data.historico.map(r => <li key={r.rodada}><span>R{r.rodada}</span><span>{description(r)}</span></li>)}</ul>}
        <dl className={styles.metrics}>{metrics.map(([label, n]) => <div key={label}><dt>{label}</dt><dd>{value(n)}</dd></div>)}</dl>
        {metrics.some(([, n]) => n == null) && <p>Não há dados consolidados suficientes para todos os indicadores.</p>}
        <p>Indicadores consideram somente pontuações consolidadas disponíveis. Quanto menor o desvio padrão, menor a variação da pontuação.</p>
        {(data.cobertura.rodadasParciais.length > 0 || data.historico.some(r => r.parcial)) && <p className={styles.notice}>Pontuações parciais podem mudar. Indicadores disponíveis após a consolidação.</p>}
        {(data.cobertura.rodadasSemPontuacaoDoAtleta.length > 0 || data.cobertura.rodadasSemSnapshot.length > 0 || data.cobertura.rodadasComSnapshotInvalidoOuIncompleto.length > 0) && <p>A cobertura contém lacunas ou dados incompletos até a rodada de referência. Ausência de dados não indica ausência de participação.</p>}
      </>}
  </div>;
}

export function ScoreChart({ rounds }: { rounds: HistoryRound[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const ordered = [...rounds].sort((a, b) => a.rodada - b.rodada);
  const scores = ordered.filter(hasScore).map(r => r.pontuacao!);
  const min = Math.min(0, ...scores) - 1, max = Math.max(0, ...scores) + 1;
  const first = ordered[0]?.rodada ?? 1, last = ordered[ordered.length - 1]?.rodada ?? first;
  const x = (r: HistoryRound) => first === last ? 250 : 45 + (r.rodada - first) / (last - first) * 415;
  const y = (n: number) => 155 - (n - min) / (max - min) * 130;
  const active = ordered.find(r => r.rodada === selected);
  return <div className={styles.chart}>
    <svg viewBox="0 0 480 190" role="group" aria-label="Evolução da pontuação por rodada">
      {[min, 0, max].map(n => <g key={n}><line x1="45" x2="460" y1={y(n)} y2={y(n)} stroke="#e5e8e5" /><text x="39" y={y(n) + 4} textAnchor="end">{value(n)}</text></g>)}
      {ordered.map((r, i) => { const previous = ordered[i - 1]; return <g key={r.rodada}>
        {hasScore(r) && previous && hasScore(previous) && r.rodada === previous.rodada + 1 && <line data-score-segment="true" pointerEvents="none" x1={x(previous)} y1={y(previous.pontuacao!)} x2={x(r)} y2={y(r.pontuacao!)} stroke="#177343" strokeWidth="2" />}
        <text x={x(r)} y="178" textAnchor="middle">R{r.rodada}</text>
        {hasScore(r) && <circle cx={x(r)} cy={y(r.pontuacao!)} r="5" fill={r.parcial ? "#b49332" : "#177343"} stroke="white" strokeWidth="2" tabIndex={0} role="button" aria-label={`Rodada ${r.rodada}: ${description(r)}`} onMouseEnter={() => setSelected(r.rodada)} onFocus={() => setSelected(r.rodada)} onClick={() => setSelected(r.rodada)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(r.rodada); } }}><title>{`Rodada ${r.rodada}: ${description(r)}`}</title></circle>}
      </g>; })}
    </svg>
    <div className={styles.tooltip} role="status">{active ? `Rodada ${active.rodada}: ${description(active)}` : "Toque ou passe sobre um ponto para ver a pontuação."}</div>
  </div>;
}
