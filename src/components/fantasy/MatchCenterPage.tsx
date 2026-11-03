"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ImageOff, CircleDot, ArrowLeftRight, RectangleVertical, MonitorCheck, Handshake } from "lucide-react";
import type { FantasyEvent, FantasyMatch, FantasyPlayer, FantasyPreMatch, FantasySectionState, FantasySquad, FantasyStatistics, FantasyStatisticsValues, FantasySummary, FantasyTeam, MatchCenterResponses } from "@/types/fantasy";
import { createMatchCenterLoader, validFixtureId } from "@/services/matchCenterService";
import { FantasyFieldLineup, tacticalRows } from "./FantasyFieldLineup";
import { AthleteIncidents, formationEventMap, mergeFormationEvents, type FormationIncident } from "./FormationEvents";
import styles from "./MatchCenter.module.css";

type Tab = keyof MatchCenterResponses;
type Loader = ReturnType<typeof createMatchCenterLoader>;
const tabs: { key: Tab; label: string }[] = [{ key: "pre-jogo", label: "Pré-jogo" }, { key: "sumario", label: "Sumário" }, { key: "formacao", label: "Formação" }, { key: "estatisticas", label: "Estatísticas" }];
const sides = ["mandante", "visitante"] as const;
const labels: Record<string, string> = { GOL: "Gol", CARTAO_AMARELO: "Cartão amarelo", CARTAO_VERMELHO: "Cartão vermelho", SUBSTITUICAO: "Substituição", VAR: "VAR", ASSISTENCIA: "Assistência", CONFIRMADA: "Confirmada", PROVAVEL: "Provável", ENCERRADA: "Encerrada", EM_ANDAMENTO: "Em andamento", PRE_JOGO: "Pré-jogo", AGENDADA: "Agendada", INTERVALO: "Intervalo", ADIADA: "Adiada", CANCELADA: "Cancelada", INTERROMPIDA: "Interrompida", ABANDONADA: "Abandonada", RESULTADO_ADMINISTRATIVO: "Resultado administrativo", DESCONHECIDO: "Status indisponível", "primeiro-tempo": "1º tempo", "segundo-tempo": "2º tempo", intervalo: "Intervalo", "pre-jogo": "Pré-jogo", "prorrogacao-primeiro-tempo": "Prorrogação · 1º tempo", "prorrogacao-segundo-tempo": "Prorrogação · 2º tempo", "prorrogacao-intervalo": "Intervalo da prorrogação", "disputa-penaltis": "Pênaltis", encerrado: "Encerrado" };
const label = (value: string | null) => value == null ? "Indisponível" : labels[value] ?? value;
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const value = (n: number | null, percent = false) => n == null ? "—" : `${number.format(n)}${percent ? "%" : ""}`;
function dateText(date: string | null) {
  if (!date || Number.isNaN(Date.parse(date))) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(date));
}
function useSection<K extends Tab>(loader: Loader, tab: K, enabled = true) {
  const [state, setState] = useState<FantasySectionState<MatchCenterResponses[K]>>({ status: "loading" });
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setState({ status: "loading" });
    loader(tab).then(data => { if (active) setState({ status: "ready", data }); }, error => { if (active) setState({ status: "error", message: error instanceof Error ? error.message : "Não foi possível carregar os dados." }); });
    return () => { active = false; };
  }, [loader, tab, enabled]);
  return state;
}
function SectionState<T>({ state, children }: { state: FantasySectionState<T>; children: (data: T) => ReactNode }) {
  if (state.status === "loading") return <div className={styles.feedback} role="status">Carregando dados da partida...</div>;
  if (state.status === "error") return <div className={styles.feedback} role="alert"><strong>Dados indisponíveis</strong><p>{state.message}</p></div>;
  return <>{children(state.data)}</>;
}
function TeamShield({ team }: { team: FantasyTeam }) {
  const [failed, setFailed] = useState<string | null>(null);
  return team.logo && failed !== team.logo ? <img className={styles.shield} src={team.logo} alt={`Escudo do ${team.nome ?? "clube"}`} onError={() => setFailed(team.logo)} /> : <span className={styles.shield} role="img" aria-label="Escudo indisponível"><ImageOff aria-hidden="true" /></span>;
}
function MatchHeader({ partida }: { partida: FantasyMatch }) {
  return <section className={styles.scoreboard} aria-label="Dados da partida">
    <div className={styles.matchHeading}><strong>{partida.campeonato ?? "Campeonato indisponível"}</strong><span>{partida.rodada == null ? "Rodada indisponível" : `Rodada ${partida.rodada}`}</span></div>
    <div className={styles.matchup}>
      <div className={styles.team}><TeamShield team={partida.mandante} /><strong>{partida.mandante.nome ?? "Mandante"}</strong></div>
      <div className={styles.score}><strong aria-label="Placar">{value(partida.placar.mandante)} × {value(partida.placar.visitante)}</strong><span>{label(partida.status)}</span></div>
      <div className={styles.team}><TeamShield team={partida.visitante} /><strong>{partida.visitante.nome ?? "Visitante"}</strong></div>
    </div>
    <div className={styles.facts}><time dateTime={partida.data ?? undefined}>{dateText(partida.data)}</time><span>{partida.estadio ?? "Estádio indisponível"}</span>{partida.periodo && <span>{label(partida.periodo)}{partida.minuto != null ? ` · ${partida.minuto}'` : ""}</span>}</div>
  </section>;
}
function PlayerList({ players, onPlayer }: { players: FantasyPlayer[]; onPlayer?: (player: FantasyPlayer) => void }) {
  return players.length ? <ul className={styles.playerList}>{players.map((player, index) => <li key={player.idExterno ?? index}><b>{player.numero ?? "—"}</b>{onPlayer ? <button type="button" onClick={() => onPlayer(player)}>{player.nome ?? "Nome indisponível"}</button> : <strong>{player.nome ?? "Nome indisponível"}</strong>}<span>{player.funcaoPartida.nome ?? player.posicao ?? "—"}</span></li>)}</ul> : <p className={styles.help}>Nenhum atleta informado.</p>;
}
function Squad({ squad, onPlayer, showStarters = true }: { squad: FantasySquad; onPlayer?: (player: FantasyPlayer) => void; showStarters?: boolean }) {
  return <div className={styles.roster}><div className={styles.squadFacts}><span>Esquema <b>{squad.formacao ?? "Indisponível"}</b></span><span>Técnico <b>{squad.treinador?.nome ?? "Indisponível"}</b></span></div>
    {squad.atualizadoEm && <p className={styles.help}>Atualização: {dateText(squad.atualizadoEm)}</p>}
    {showStarters && <><h4>Titulares <span>{squad.titulares.length}</span></h4><PlayerList players={squad.titulares} onPlayer={onPlayer} /></>}
    <details className={styles.bench}><summary>Reservas <span>{squad.reservas.length}</span></summary><PlayerList players={squad.reservas} onPlayer={onPlayer} /></details>
  </div>;
}
function PreMatch({ data }: { data: FantasyPreMatch }) {
  return <div className={styles.preGrid}>{sides.map(side => {
    const lineups = data.escalacoes[side];
    const squad = lineups.confirmada ?? lineups.provavel;
    return <section className={`${styles.panel} ${styles.preTeam}`} key={side} data-side={side} aria-label={`Escalação de ${data.partida[side].nome}`}><h2>{data.partida[side].nome}</h2>
      {!squad ? <p className={styles.help}>Escalações indisponíveis.</p> : <div className={styles.lineupBlock}><h3 className={lineups.confirmada ? styles.confirmed : styles.probable}>{lineups.confirmada ? "Escalação confirmada" : "Escalação provável"}</h3><Squad squad={squad} /></div>}
    </section>;
  })}<section className={styles.panel}><h2>Desfalques</h2>{!data.desfalquesInformados ? <p className={styles.help}>Desfalques indisponíveis.</p> : !data.desfalques.length ? <p className={styles.help}>Nenhum desfalque informado pela fonte.</p> : <ul className={styles.absences}>{data.desfalques.map((entry, i) => <li key={i}><strong>{entry.atleta?.nome ?? "Atleta não informado"}</strong><span>{entry.equipe.nome}</span><small>{entry.situacao ?? "Situação indisponível"}</small><p>{entry.motivo ?? "Motivo indisponível"}</p></li>)}</ul>}</section></div>;
}
const eventIcons = { GOL: CircleDot, ASSISTENCIA: Handshake, CARTAO_AMARELO: RectangleVertical, CARTAO_VERMELHO: RectangleVertical, SUBSTITUICAO: ArrowLeftRight, VAR: MonitorCheck };
const periodOrder = ["pre-jogo", "primeiro-tempo", "intervalo", "segundo-tempo", "prorrogacao-primeiro-tempo", "prorrogacao-intervalo", "prorrogacao-segundo-tempo", "disputa-penaltis", "encerrado"];
function structuredEvents(events: FantasyEvent[]) {
  return events.filter(event => Object.prototype.hasOwnProperty.call(eventIcons, event.tipo));
}
function EventList({ events, teams }: { events: FantasyEvent[]; teams: Pick<FantasyMatch, "mandante" | "visitante"> }) {
  const groups = new Map<string, FantasyEvent[]>();
  structuredEvents(events).forEach(event => {
    const period = event.periodo && periodOrder.includes(event.periodo) ? event.periodo : "unknown";
    groups.set(period, [...(groups.get(period) ?? []), event]);
  });
  return <div>{[...groups].sort(([a], [b]) => (a === "unknown" ? 99 : periodOrder.indexOf(a)) - (b === "unknown" ? 99 : periodOrder.indexOf(b))).map(([period, incidents]) => <section key={period} className={styles.period}>
    <h3 className={styles.periodHeading}>{period === "unknown" ? "Período não informado" : label(period)}</h3>
    <ol className={styles.timeline}>{incidents.map((event, index) => {
      const Icon = eventIcons[event.tipo as keyof typeof eventIcons];
      const minute = event.tempo.exibicao ?? (event.tempo.minuto == null ? "—" : event.tempo.minuto + (event.tempo.acrescimo == null ? "" : "+" + event.tempo.acrescimo) + "'");
      const side = event.equipe.idExterno != null && event.equipe.idExterno === teams.mandante.idExterno ? "mandante" : event.equipe.idExterno != null && event.equipe.idExterno === teams.visitante.idExterno ? "visitante" : "unknown";
      return <li className={styles.event} data-side={side} key={index}>
        <span className={styles.minute}>{minute}</span><span className={styles.eventIcon} data-kind={event.tipo}><Icon size={17} aria-label={label(event.tipo)} /></span>
        <div className={styles.eventDetails}><div className={styles.eventHeading}><strong>{label(event.tipo)}</strong><small>{event.equipe.nome}</small></div>
          {event.jogador?.nome && <strong>{event.jogador.nome}</strong>}
          {event.tipo === "GOL" && event.assistencia?.nome && <p>Assistência: {event.assistencia.nome}</p>}
          {event.jogadorEntra?.nome && <p className={styles.playerIn}>Entra: {event.jogadorEntra.nome}</p>}{event.jogadorSai?.nome && <p>Sai: {event.jogadorSai.nome}</p>}
          {event.comissaoTecnica?.nome && <p>Comissão técnica: {event.comissaoTecnica.nome}</p>}
        </div>
      </li>;
    })}</ol>
  </section>)}</div>;
}
function Summary({ data }: { data: FantasySummary }) {
  const events = structuredEvents(data.eventos);
  return <section className={styles.panel}><h2>Cronologia da partida</h2><div className={styles.timelineTeams}><span>{data.partida.mandante.nome}</span><span>{data.partida.visitante.nome}</span></div>{!data.eventosDisponiveis ? <p className={styles.help}>Acontecimentos indisponíveis.</p> : !events.length ? <p className={styles.help}>Nenhum acontecimento informado.</p> : <EventList events={events} teams={data.partida} />}</section>;
}
const metrics: { key: keyof FantasyStatisticsValues; label: string; percent?: boolean }[] = [
  { key: "posseBola", label: "Posse de bola", percent: true }, { key: "finalizacoes", label: "Finalizações" }, { key: "finalizacoesNoGol", label: "Finalizações no gol" }, { key: "finalizacoesFora", label: "Finalizações fora" }, { key: "finalizacoesBloqueadas", label: "Finalizações bloqueadas" }, { key: "finalizacoesDentroArea", label: "Finalizações dentro da área" }, { key: "finalizacoesForaArea", label: "Finalizações fora da área" }, { key: "passes", label: "Passes" }, { key: "passesCertos", label: "Passes certos" }, { key: "precisaoPasses", label: "Precisão de passes", percent: true }, { key: "escanteios", label: "Escanteios" }, { key: "faltas", label: "Faltas" }, { key: "impedimentos", label: "Impedimentos" }, { key: "cartoesAmarelos", label: "Cartões amarelos" }, { key: "cartoesVermelhos", label: "Cartões vermelhos" }, { key: "golsEsperados", label: "Gols esperados (xG)" }, { key: "defesasGoleiro", label: "Defesas do goleiro" }, { key: "golsEvitados", label: "Gols evitados" },
];
function Statistics({ data }: { data: FantasyStatistics }) {
  return <section className={styles.panel}><h2>Estatísticas da partida</h2><p className={styles.help}>— indica um dado indisponível.</p>{sides.map(side => !data[side].disponivel && <p key={side} className={styles.help}>Estatísticas de {data[side].nome}: indisponíveis.</p>)}
    <table className={styles.statistics}><caption className={styles.srOnly}>Comparação das equipes</caption><colgroup><col style={{ width: "17%" }} /><col style={{ width: "66%" }} /><col style={{ width: "17%" }} /></colgroup><thead><tr><th colSpan={3}><div className={styles.statisticsTeams}><span>{data.mandante.nome}</span><span>{data.visitante.nome}</span></div><span className={styles.srOnly}>Estatística</span></th></tr></thead><tbody>{metrics.map(metric => {
      const home = data.mandante.estatisticas[metric.key], away = data.visitante.estatisticas[metric.key];
      const comparable = home != null && away != null && home >= 0 && away >= 0 && home + away > 0;
      return <tr key={metric.key}><td>{value(home, metric.percent)}</td><th scope="row">{metric.label}{comparable && <span className={styles.comparison} aria-hidden="true"><span style={{ width: `${home / (home + away) * 100}%` }} /></span>}</th><td>{value(away, metric.percent)}</td></tr>;
    })}</tbody></table>
  </section>;
}
const athleteMetricLabels: Record<string, string> = { minutosJogados: "Minutos jogados", nota: "Nota", gols: "Gols", assistencias: "Assistências", finalizacoes: "Finalizações", finalizacoesNoGol: "Finalizações no gol", passes: "Passes", passesCertos: "Passes certos", precisaoPasses: "Precisão de passes", desarmes: "Desarmes", interceptacoes: "Interceptações", cartoesAmarelos: "Cartões amarelos", cartoesVermelhos: "Cartões vermelhos", golsEsperados: "Gols esperados (xG)", defesas: "Defesas", golsSofridos: "Gols sofridos", golsEvitados: "Gols evitados", penaltisDefendidos: "Pênaltis defendidos" };
function AthleteDetails({ player, side, loader, incidents, eventsLoading, eventsAvailable, onClose }: { player: FantasyPlayer; side: typeof sides[number]; loader: Loader; incidents: FormationIncident[]; eventsLoading: boolean; eventsAvailable: boolean; onClose: () => void }) {
  const stats = useSection(loader, "estatisticas");
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus(); }, []);
  return <section className={styles.athleteDetails} aria-label={`Detalhes de ${player.nome ?? "atleta"}`} onKeyDown={event => { if (event.key === "Escape") onClose(); }}><button ref={close} type="button" onClick={onClose}>Fechar detalhes</button><h3>{player.nome ?? "Nome indisponível"}</h3>
    <p>Camisa: {player.numero ?? "—"} · Função na partida: {player.funcaoPartida.nome ?? player.posicao ?? "Indisponível"}</p><p>Posição cadastral: {player.posicaoCadastral?.nome ?? "Indisponível"}</p>
    <AthleteIncidents incidents={incidents} loading={eventsLoading} available={eventsAvailable} />
    <SectionState state={stats}>{data => {
      const athlete = data[side].atletas.find(item => player.idExterno != null && item.atleta.idExterno === player.idExterno);
      if (!athlete) return <p>Estatísticas individuais indisponíveis.</p>;
      return <><p>{athlete.titular == null ? "Titularidade indisponível" : athlete.titular ? "Titular" : "Reserva"}</p>{[athlete.estatisticas, athlete.goleiroEstatisticas].map((group, index) => group && <div key={index}><h4>{index ? "Goleiro" : "Estatísticas individuais"}</h4><dl className={styles.athleteMetrics}>{Object.entries(athleteMetricLabels).filter(([key]) => Object.prototype.hasOwnProperty.call(group, key)).map(([key, text]) => <div key={key}><dt>{text}</dt><dd>{value(group[key])}</dd></div>)}</dl></div>)}</>;
    }}</SectionState>
  </section>;
}
function Formation({ loader }: { loader: Loader }) {
  const state = useSection(loader, "formacao");
  const summary = useSection(loader, "sumario");
  const [selection, setSelection] = useState<{ player: FantasyPlayer; side: typeof sides[number] } | null>(null);
  const origin = useRef<HTMLElement | null>(null);
  const showPlayer = (player: FantasyPlayer, side: typeof sides[number]) => { origin.current = document.activeElement as HTMLElement; setSelection({ player, side }); };
  const closePlayer = () => { setSelection(null); origin.current?.focus(); };
  return <SectionState state={state}>{data => {
    const pitchReady = sides.every(side => data[side].disponivel && tacticalRows(data[side].titulares, data[side].formacao));
    const eventsAvailable = summary.status === "ready" && summary.data.eventosDisponiveis;
    const events = mergeFormationEvents(eventsAvailable ? summary.data.eventos : [], data.substituicoes);
    const incidents = formationEventMap(events, data);
    return <section aria-label="Formação das equipes" className={styles.formationPanel}>
      <div className={styles.formationTeams}>{sides.map(side => <header key={side} data-side={side}><TeamShield team={data[side]} /><div><h2>{data[side].nome}</h2><small>{side === "mandante" ? "Mandante" : "Visitante"} · {label(data[side].tipoEscalacao)}</small></div><strong aria-label={`Esquema de ${data[side].nome}`}>{data[side].formacao ?? "Esquema indisponível"}</strong></header>)}</div>
      {pitchReady ? <div className={styles.pitch} aria-label="Campo tático das equipes"><span className={styles.centerCircle} aria-hidden="true" />{sides.map(side => <FantasyFieldLineup key={side} players={data[side].titulares} teamName={data[side].nome} formation={data[side].formacao} side={side} incidents={incidents[side]} onPlayer={player => showPlayer(player, side)} />)}</div> : <div className={styles.lineupLists}>{sides.map(side => <div key={side}><h3>{data[side].nome}</h3><FantasyFieldLineup players={data[side].titulares} teamName={data[side].nome} side={side} onPlayer={player => showPlayer(player, side)} /></div>)}</div>}
      {selection && <AthleteDetails key={`${selection.side}-${selection.player.idExterno}`} player={selection.player} side={selection.side} loader={loader} incidents={selection.player.idExterno == null ? [] : incidents[selection.side].get(selection.player.idExterno) ?? []} eventsLoading={summary.status === "loading"} eventsAvailable={eventsAvailable} onClose={closePlayer} />}
      <div className={styles.lineupLists}>{sides.map(side => <section key={side} className={styles.lineupTeam}><h3>{data[side].nome}</h3><Squad squad={data[side]} showStarters={false} onPlayer={player => showPlayer(player, side)} /></section>)}</div>
      {data.substituicoes.length > 0 && <section className={styles.substitutions}><h2>Substituições</h2><EventList events={data.substituicoes} teams={data} /></section>}
    </section>;
  }}</SectionState>;
}
function SummaryTab({ loader }: { loader: Loader }) { const state = useSection(loader, "sumario"); return <SectionState state={state}>{data => <Summary data={data} />}</SectionState>; }
function StatisticsTab({ loader }: { loader: Loader }) { const state = useSection(loader, "estatisticas"); return <SectionState state={state}>{data => <Statistics data={data} />}</SectionState>; }
export function MatchCenterPage({ fixtureId }: { fixtureId: string }) {
  const loader = useMemo(() => createMatchCenterLoader(fixtureId), [fixtureId]);
  const pre = useSection(loader, "pre-jogo");
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return <div className={`page-shell ${styles.shell}`}><header className={styles.pageHeading}><p className="eyebrow">POINT FFC</p><h1 className="page-title">Central da Partida</h1></header>
    <SectionState state={pre}>{data => <MatchHeader partida={data.partida} />}</SectionState>
    <div className={styles.tabs} role="tablist" aria-label="Seções da partida">{tabs.map((tab, index) => <button key={tab.key} ref={element => { buttons.current[index] = element; }} type="button" role="tab" id={`match-tab-${tab.key}`} aria-controls={`match-panel-${tab.key}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} className={selected === index ? styles.active : undefined} onClick={() => setSelected(index)} onKeyDown={event => {
      const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
      if (next != null) { event.preventDefault(); setSelected(next); buttons.current[next]?.focus(); }
    }}>{tab.label}</button>)}</div>
    {tabs.map((tab, index) => <div key={tab.key} role="tabpanel" id={`match-panel-${tab.key}`} aria-labelledby={`match-tab-${tab.key}`} hidden={selected !== index} tabIndex={0}>{selected === index && (tab.key === "pre-jogo" ? pre.status === "ready" ? <PreMatch data={pre.data} /> : null : tab.key === "sumario" ? <SummaryTab loader={loader} /> : tab.key === "formacao" ? <Formation loader={loader} /> : <StatisticsTab loader={loader} />)}</div>)}
  </div>;
}
export function MatchCenterQueryPage() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { setId(new URLSearchParams(window.location.search).get("fixtureId") ?? "321"); }, []);
  if (id == null) return <div className={styles.feedback} role="status">Carregando partida...</div>;
  if (!validFixtureId(id)) return <div className={styles.feedback} role="alert">ID da API Futebol V2 inválido.</div>;
  return <MatchCenterPage key={id} fixtureId={id} />;
}
