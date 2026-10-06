"use client";

import { useRef, useState, type ReactNode } from "react";
import { CalendarDays, ImageOff, MapPin } from "lucide-react";
import type { FantasyLineup, FantasyLineupTeam, FantasySectionState, FantasyStatistics, FantasyStatisticsValues, FantasySummary, FantasyTeam } from "@/types/fantasy";
import { FantasyFieldLineup, type FieldPlayer } from "./FantasyFieldLineup";
import styles from "./MatchCenter.module.css";

export interface MatchCenterSections {
  summary: FantasySectionState<FantasySummary>;
  statistics: FantasySectionState<FantasyStatistics>;
  lineup: FantasySectionState<FantasyLineup>;
}
type Examples = Record<"mandante" | "visitante", Omit<FieldPlayer, "idExterno">[]>;
const tabs = ["Sumário", "Estatísticas", "Formação"] as const;

function TeamShield({ team }: { team: FantasyTeam }) {
  const [failed, setFailed] = useState<string | null>(null);
  return team.logo && failed !== team.logo
    ? <img className={styles.shield} src={team.logo} alt={`Escudo do ${team.nome}`} onError={() => setFailed(team.logo)} />
    : <span className={styles.shield} role="img" aria-label={`Escudo do ${team.nome} indisponível`}><ImageOff aria-hidden="true" /></span>;
}

function SectionState<T>({ state, label, children }: { state: FantasySectionState<T>; label: string; children: (data: T) => ReactNode }) {
  if (state.status === "loading") return <div className={styles.feedback} role="status">Carregando {label.toLowerCase()}...</div>;
  if (state.status === "error") return <div className={styles.feedback} role="alert"><strong>{label} indisponível</strong><p>{state.message}</p></div>;
  if (state.status === "empty") return <div className={styles.feedback}>Nenhum dado de {label.toLowerCase()} disponível.</div>;
  return <>{children(state.data)}</>;
}

function MatchHeader({ summary }: { summary: FantasySummary }) {
  const { partida } = summary;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(partida.data)
    ? partida.data.split("-").reverse().join("/")
    : new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(partida.data));
  return <section className={styles.scoreboard} aria-label="Dados da partida">
    <div className={styles.matchHeading}><strong>{partida.campeonato}</strong><span>{partida.rodada == null ? "Rodada indisponível" : `Rodada ${partida.rodada}`}</span></div>
    <div className={styles.matchup}>
      <div className={styles.team}><TeamShield team={partida.mandante} /><strong>{partida.mandante.nome}</strong></div>
      <div className={styles.score}><strong aria-label={`Placar: ${partida.placar.mandante ?? "indisponível"} a ${partida.placar.visitante ?? "indisponível"}`}>{partida.placar.mandante ?? "—"} × {partida.placar.visitante ?? "—"}</strong><span>{partida.status}</span></div>
      <div className={styles.team}><TeamShield team={partida.visitante} /><strong>{partida.visitante.nome}</strong></div>
    </div>
    <div className={styles.facts}><span><CalendarDays size={15} aria-hidden="true" /><time dateTime={partida.data}>{date}</time></span><span><MapPin size={15} aria-hidden="true" />{partida.estadio ?? "Estádio indisponível"}</span></div>
  </section>;
}

function MatchSummary({ data }: { data: FantasySummary }) {
  return <section className={styles.panel} aria-label="Acontecimentos da partida"><h2>Acontecimentos da partida</h2>
    {!data.eventos.length ? <p className={styles.empty}>Nenhum acontecimento disponível.</p> : <ol className={styles.timeline}>{data.eventos.map((event, index) => {
      const label = event.tipo === "GOL" ? "Gol" : event.tipo === "SUBSTITUICAO" ? "Substituição" : event.tipo;
      return <li className={styles.event} key={`${event.tempo.exibicao}-${index}`}>
        <span className={styles.minute}>{event.tempo.exibicao || "—"}</span>
        <div className={styles.eventDetails}><h3>{label}{event.equipe && <span> · {event.equipe.nome}</span>}</h3>
          {event.jogador && <strong>{event.jogador.nome}</strong>}
          {event.assistencia && <p>Assistência: {event.assistencia.nome}</p>}
          {event.jogadorSai && <p>Sai: {event.jogadorSai.nome}</p>}
          {event.jogadorEntra && <p>Entra: {event.jogadorEntra.nome}</p>}
          {event.comentarios && <p>{event.comentarios}</p>}
        </div>
        {event.placarAposEvento && <span className={styles.eventScore} aria-label="Placar após evento">{event.placarAposEvento.mandante ?? "—"} × {event.placarAposEvento.visitante ?? "—"}</span>}
      </li>;
    })}</ol>}
  </section>;
}

const metrics: { key: keyof FantasyStatisticsValues; label: string; percent?: boolean }[] = [
  { key: "finalizacoesNoGol", label: "Finalizações no gol" }, { key: "finalizacoesFora", label: "Finalizações fora" },
  { key: "finalizacoes", label: "Finalizações" }, { key: "finalizacoesBloqueadas", label: "Finalizações bloqueadas" },
  { key: "finalizacoesDentroArea", label: "Finalizações dentro da área" }, { key: "finalizacoesForaArea", label: "Finalizações fora da área" },
  { key: "faltas", label: "Faltas" }, { key: "escanteios", label: "Escanteios" }, { key: "impedimentos", label: "Impedimentos" },
  { key: "posseBola", label: "Posse de bola", percent: true }, { key: "cartoesAmarelos", label: "Cartões amarelos" },
  { key: "cartoesVermelhos", label: "Cartões vermelhos" }, { key: "defesasGoleiro", label: "Defesas do goleiro" },
  { key: "passes", label: "Passes" }, { key: "passesCertos", label: "Passes certos" },
  { key: "precisaoPasses", label: "Precisão de passes", percent: true }, { key: "golsEsperados", label: "Gols esperados (xG)" },
  { key: "golsEvitados", label: "Gols evitados" },
];
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function MatchStatistics({ data }: { data: FantasyStatistics }) {
  const value = (n: number | null, percent = false) => n == null ? <span aria-label="Indisponível">—</span> : `${number.format(n)}${percent ? "%" : ""}`;
  return <section className={styles.panel}><h2>Estatísticas da partida</h2><p className={styles.help}>— indica um dado indisponível.</p>
    <table className={styles.statistics}><caption className={styles.srOnly}>Comparação entre {data.mandante.nome} e {data.visitante.nome}</caption>
      <thead><tr><th scope="col">{data.mandante.nome}</th><th scope="col">Estatística</th><th scope="col">{data.visitante.nome}</th></tr></thead>
      <tbody>{metrics.map(metric => <tr key={metric.key}><td>{value(data.mandante.estatisticas[metric.key], metric.percent)}</td><th scope="row">{metric.label}</th><td>{value(data.visitante.estatisticas[metric.key], metric.percent)}</td></tr>)}</tbody>
    </table>
  </section>;
}

function LineupTeam({ team, examples = [] }: { team: FantasyLineupTeam; examples?: Examples["mandante"] }) {
  const usingExamples = !team.titulares.length && examples.length > 0;
  return <section className={styles.lineupTeam} aria-label={`Formação de ${team.nome}`}>
    <header className={styles.lineupHeading}><TeamShield team={team} /><div><h3>{team.nome}</h3><p>Formação <strong>{team.formacao ?? "—"}</strong></p><p>Treinador: {team.treinador?.nome ?? "Indisponível"}</p></div></header>
    {usingExamples && <p className={styles.help}>Exemplos parciais de demonstração; IDs dos jogadores ainda não fornecidos.</p>}
    <FantasyFieldLineup players={usingExamples ? examples : team.titulares} formation={team.formacao} teamName={team.nome} />
    <div className={styles.roster}><h4>Titulares disponíveis no mock ({team.titulares.length})</h4>{team.titulares.length ? <PlayerList players={team.titulares} /> : <p>Nenhum registro completo disponível.</p>}
      {usingExamples && <><h4>Exemplos conhecidos ({examples.length})</h4><PlayerList players={examples} /></>}
      <h4>Reservas disponíveis no mock ({team.reservas.length})</h4>{team.reservas.length ? <PlayerList players={team.reservas} /> : <p>Nenhum reserva fornecido nesta POC.</p>}
    </div>
  </section>;
}

function PlayerList({ players }: { players: FieldPlayer[] }) {
  return <ul className={styles.playerList}>{players.map((player, index) => <li key={player.idExterno ?? `example-${index}`}><b>{player.numero ?? "—"}</b><strong>{player.nome}</strong><span>{player.posicao ?? "—"}</span></li>)}</ul>;
}

export function MatchCenterPage({ sections, examples }: { sections: MatchCenterSections; examples?: Examples }) {
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return <div className={`page-shell ${styles.shell}`}>
    <header className={styles.pageHeading}><p className="eyebrow">POINT FFC</p><h1 className="page-title">Central da Partida</h1><p className="page-subtitle">Acompanhe os acontecimentos, as estatísticas e a formação.</p><span className={styles.demo}>POC · Dados de demonstração</span></header>
    {sections.summary.status === "ready" && <MatchHeader summary={sections.summary.data} />}
    <div className={styles.tabs} role="tablist" aria-label="Seções da partida">{tabs.map((tab, index) => <button key={tab} ref={element => { buttons.current[index] = element; }} type="button" role="tab" id={`fantasy-tab-${index}`} aria-controls={`fantasy-panel-${index}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} className={selected === index ? styles.active : undefined} onClick={() => setSelected(index)} onKeyDown={event => {
      let next: number;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault(); setSelected(next); buttons.current[next]?.focus();
    }}>{tab}</button>)}</div>
    {tabs.map((tab, index) => <div key={tab} role="tabpanel" id={`fantasy-panel-${index}`} aria-labelledby={`fantasy-tab-${index}`} hidden={selected !== index} tabIndex={0}>
      {selected === index && (index === 0 ? <SectionState state={sections.summary} label="Sumário">{data => <MatchSummary data={data} />}</SectionState>
        : index === 1 ? <SectionState state={sections.statistics} label="Estatísticas">{data => <MatchStatistics data={data} />}</SectionState>
          : <SectionState state={sections.lineup} label="Formação">{data => <section aria-label="Escalações"><h2 className={styles.sectionTitle}>Formação das equipes</h2><p className={styles.help}>Visualização parcial da POC. Os elencos completos não foram fornecidos.</p><div className={styles.lineups}><LineupTeam team={data.mandante} examples={examples?.mandante} /><LineupTeam team={data.visitante} examples={examples?.visitante} /></div></section>}</SectionState>)}
    </div>)}
  </div>;
}
