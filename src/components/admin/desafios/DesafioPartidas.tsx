"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { adminDesafioService, type DesafioFixture, type DesafioPartida, type FixtureFilters } from "@/services/adminDesafioService";
import { desafioError, displayDate } from "./desafioForm";
import styles from "../Admin.module.css";
import css from "./Desafios.module.css";

function Team({ name, logo }: { name: string; logo: string | null }) {
  const [failed, setFailed] = useState(false);
  return <span className={css.team}>{logo && !failed && <Image src={logo} alt="" width={22} height={22} unoptimized onError={() => setFailed(true)} />}{name}</span>;
}
export function DesafioPartidas({ matches, editable, busy, initialDate, mutate }: {
  matches: DesafioPartida[]; editable: boolean; busy: boolean; initialDate: string;
  mutate: (action: "add" | "remove" | "reorder", ids: number[]) => Promise<void>;
}) {
  const [mode, setMode] = useState("date"), [date, setDate] = useState(initialDate.slice(0, 10));
  const [to, setTo] = useState(initialDate.slice(0, 10)), [league, setLeague] = useState("");
  const [season, setSeason] = useState(initialDate.slice(0, 4));
  const [fixtures, setFixtures] = useState<DesafioFixture[] | null>(null);
  const [searching, setSearching] = useState(false), [error, setError] = useState("");
  const searchingRef = useRef(false);
  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (searchingRef.current) return;
    setError("");
    if (!date || (mode === "range" && (!to || !league))) { setError("Informe as datas e a competição para buscar por período."); return; }
    if (mode === "range") {
      const days = (Date.parse(to) - Date.parse(date)) / 86400000;
      if (days < 0 || days > 6) { setError("Escolha um período de até sete dias, incluindo início e fim."); return; }
    }
    if (league && (!Number.isInteger(Number(league)) || Number(league) < 1 || Number(league) > 4294967295 || !Number.isInteger(Number(season)) || Number(season) < 1900 || Number(season) > 9999)) { setError("Informe um ID de competição válido e a temporada (ano inicial)."); return; }
    const filters: FixtureFilters = mode === "date" ? { date } : { from: date, to };
    if (league) { filters.league = Number(league); filters.season = Number(season); }
    searchingRef.current = true; setSearching(true); setFixtures(null);
    try { setFixtures(await adminDesafioService.fixtures(filters)); }
    catch (cause) { setError(desafioError(cause)); }
    finally { searchingRef.current = false; setSearching(false); }
  }
  function move(index: number, offset: number) {
    const ids = matches.map(item => item.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    void mutate("reorder", ids);
  }
  return <section className={`${styles.listPanel} ${css.panel}`} aria-label="Configuração das partidas">
    {editable && <>
      <h2 className={css.heading}>Buscar partidas</h2>
      <p className={css.hint}>Datas da busca em UTC. Horários das partidas no fuso do seu dispositivo. Para filtrar por competição, informe seu ID e a temporada.</p>
      <form className={css.toolbar} onSubmit={search}>
        <label>Buscar por<select value={mode} onChange={event => { setMode(event.target.value); setFixtures(null); }}><option value="date">Data</option><option value="range">Período</option></select></label>
        <label>{mode === "date" ? "Data (UTC)" : "De (UTC)"}<input type="date" required value={date} onChange={event => setDate(event.target.value)} /></label>
        {mode === "range" && <label>Até (UTC)<input type="date" required value={to} onChange={event => setTo(event.target.value)} /></label>}
        <label>ID da competição<input type="number" min="1" max="4294967295" required={mode === "range"} value={league} onChange={event => setLeague(event.target.value)} placeholder="Todas na data" /></label>
        <label>Temporada<input type="number" min="1900" max="9999" required={!!league} disabled={!league} value={season} onChange={event => setSeason(event.target.value)} /></label>
        <button className={css.button} disabled={searching || busy}>{searching ? "Buscando..." : "Buscar"}</button>
      </form>
      {error && <p role="alert" className={styles.formError}>{error}</p>}
      {searching && <p role="status" className={css.hint}>Consultando partidas...</p>}
      {fixtures?.length === 0 && <p className={css.hint}>Nenhuma partida encontrada para os filtros informados.</p>}
      {fixtures && <ul className={css.matches} aria-label="Resultados da busca">{fixtures.map(fixture => {
        const added = matches.some(item => item.fixtureIdApiFootball === fixture.fixtureId);
        const eligible = fixture.horarioConfirmado && fixture.statusInterno === "AGENDADA" && Date.parse(fixture.dataHoraInicio) > Date.now();
        return <li key={fixture.fixtureId} className={css.match}>
          <div className={css.matchInfo}><small>{fixture.leagueNome} · {displayDate(fixture.dataHoraInicio)}</small><div className={css.teams}><Team name={fixture.mandanteNome} logo={fixture.mandanteLogo} /><span>×</span><Team name={fixture.visitanteNome} logo={fixture.visitanteLogo} /></div>{!eligible && <small>Indisponível: exige horário confirmado e partida futura agendada.</small>}</div>
          <button className={css.button} type="button" disabled={busy || added || !eligible} onClick={() => void mutate("add", [fixture.fixtureId])} aria-label={`${added ? "Já adicionada" : "Adicionar"}: ${fixture.mandanteNome} x ${fixture.visitanteNome}`}>{added ? "Já adicionada" : "Adicionar"}</button>
        </li>;
      })}</ul>}
    </>}
    <h2 className={css.heading}>Partidas do Desafio ({matches.length})</h2>
    {!matches.length ? <p className={css.hint}>Nenhuma partida selecionada.{editable && " Busque e adicione partidas para publicar."}</p> : <ol className={css.matches} aria-label="Partidas selecionadas">{matches.map((match, index) => <li key={match.id} className={css.match}>
      <span className={css.order}>{match.ordem}.</span><div className={css.matchInfo}><small>{match.nomeCompeticao} · {displayDate(match.dataInicio)}</small><div className={css.teams}><Team name={match.nomeMandante} logo={match.logoMandanteUrl} /><span>×</span><Team name={match.nomeVisitante} logo={match.logoVisitanteUrl} /></div></div>
      {editable && <div className={css.actions}><button className={css.button} disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label={`Subir ${match.nomeMandante} x ${match.nomeVisitante}`}>↑ Subir</button><button className={css.button} disabled={busy || index === matches.length - 1} onClick={() => move(index, 1)} aria-label={`Descer ${match.nomeMandante} x ${match.nomeVisitante}`}>↓ Descer</button><button className={css.button} disabled={busy} onClick={() => void mutate("remove", [match.id])} aria-label={`Remover ${match.nomeMandante} x ${match.nomeVisitante}`}>Remover</button></div>}
    </li>)}</ol>}
  </section>;
}
