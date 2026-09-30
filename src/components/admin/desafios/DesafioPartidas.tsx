"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { adminDesafioService, type DesafioFixture, type DesafioPartida } from "@/services/adminDesafioService";
import { desafioError, displayDate } from "./desafioForm";
import { groupFixtures, periodShortcuts, shortcutPeriod, unavailableReason, validPeriod, type PeriodShortcut } from "./fixturePeriod";
import styles from "../Admin.module.css";
import css from "./Desafios.module.css";

function Team({ name, logo }: { name: string; logo: string | null }) {
  const [failed, setFailed] = useState(false);
  return <span className={css.team}>{logo && !failed && <Image src={logo} alt="" width={22} height={22} unoptimized onError={() => setFailed(true)} />}{name}</span>;
}
export function DesafioPartidas({ matches, editable, busy, mutate }: {
  matches: DesafioPartida[]; editable: boolean; busy: boolean;
  mutate: (action: "add" | "remove" | "reorder", ids: number[]) => Promise<void>;
}) {
  const [period, setPeriod] = useState<PeriodShortcut>("Hoje");
  const [range, setRange] = useState(() => shortcutPeriod("Hoje"));
  const [fixtures, setFixtures] = useState<DesafioFixture[] | null>(null);
  const [searching, setSearching] = useState(false), [error, setError] = useState("");
  const searchingRef = useRef(false);
  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (searchingRef.current) return;
    setError("");
    const filters = period === "Personalizado" ? range : shortcutPeriod(period);
    if (!validPeriod(filters)) { setError("Escolha um período de até sete dias, incluindo início e fim."); return; }
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
      <p className={css.hint}>Até 7 dias por busca. Datas e horários dos resultados em UTC.</p>
      <form className={css.toolbar} onSubmit={search}>
        <div className={css.shortcuts} role="group" aria-label="Período da busca">{periodShortcuts.map(shortcut => <button type="button" className={css.button} key={shortcut} aria-pressed={period === shortcut} disabled={searching || busy} onClick={() => { setPeriod(shortcut); if (shortcut !== "Personalizado") setRange(shortcutPeriod(shortcut)); setFixtures(null); setError(""); }}>{shortcut}</button>)}</div>
        {period === "Personalizado" && <><label>De<input type="date" required disabled={searching || busy} value={range.dataInicial} onChange={event => { setRange(current => ({ ...current, dataInicial: event.target.value })); setFixtures(null); }} /></label><label>Até<input type="date" required disabled={searching || busy} value={range.dataFinal} onChange={event => { setRange(current => ({ ...current, dataFinal: event.target.value })); setFixtures(null); }} /></label></>}
        <button className={css.button} disabled={searching || busy}>{searching ? "Buscando..." : "Buscar"}</button>
      </form>
      {error && <p role="alert" className={styles.formError}>{error}</p>}
      {searching && <p role="status" className={css.hint}>Consultando partidas...</p>}
      {fixtures?.length === 0 && <p className={css.hint}>Nenhuma partida encontrada para os filtros informados.</p>}
      {fixtures && fixtures.length > 0 && <div className={css.results} role="region" aria-label="Resultados da busca" tabIndex={0}>{groupFixtures(fixtures).map(group => <section key={group.date} className={css.dateGroup} aria-label={group.date}>
        <h3>{new Date(`${group.date}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" })}</h3>
        {group.competitions.map(competition => <section key={competition.id} aria-label={competition.name}><h4>{competition.name}</h4><ul className={css.matches}>{competition.fixtures.map(fixture => {
        const added = matches.some(item => item.fixtureIdApiFootball === fixture.fixtureId);
        const reason = unavailableReason(fixture);
        return <li key={fixture.fixtureId} className={css.match}>
          <time className={css.kickoff} dateTime={fixture.dataHoraInicio}>{fixture.horarioConfirmado ? new Date(fixture.dataHoraInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) : "A definir"}</time>
          <div className={css.matchInfo}><div className={css.teams}><Team name={fixture.mandanteNome} logo={fixture.mandanteLogo} /><span>×</span><Team name={fixture.visitanteNome} logo={fixture.visitanteLogo} /></div>{reason && <small>Indisponível: {reason}.</small>}</div>
          <button className={css.button} type="button" disabled={busy || added || !!reason} onClick={() => void mutate("add", [fixture.fixtureId])} aria-label={`${added ? "Já adicionada" : "Adicionar"}: ${fixture.mandanteNome} x ${fixture.visitanteNome}`}>{added ? "✓" : "+"}</button>
        </li>;
      })}</ul></section>)}
      </section>)}</div>}
    </>}
    <h2 className={css.heading}>Partidas do Desafio ({matches.length})</h2>
    {!matches.length ? <p className={css.hint}>Nenhuma partida selecionada.{editable && " Busque e adicione partidas para publicar."}</p> : <ol className={css.matches} aria-label="Partidas selecionadas">{matches.map((match, index) => <li key={match.id} className={css.match}>
      <span className={css.order}>{match.ordem}.</span><div className={css.matchInfo}><small>{match.nomeCompeticao} · {displayDate(match.dataInicio)}</small><div className={css.teams}><Team name={match.nomeMandante} logo={match.logoMandanteUrl} /><span>×</span><Team name={match.nomeVisitante} logo={match.logoVisitanteUrl} /></div></div>
      {editable && <div className={css.actions}><button className={css.button} disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label={`Subir ${match.nomeMandante} x ${match.nomeVisitante}`}>↑ Subir</button><button className={css.button} disabled={busy || index === matches.length - 1} onClick={() => move(index, 1)} aria-label={`Descer ${match.nomeMandante} x ${match.nomeVisitante}`}>↓ Descer</button><button className={css.button} disabled={busy} onClick={() => void mutate("remove", [match.id])} aria-label={`Remover ${match.nomeMandante} x ${match.nomeVisitante}`}>Remover</button></div>}
    </li>)}</ol>}
  </section>;
}
