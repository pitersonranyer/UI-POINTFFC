"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Loader2, LogIn, Search, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { teamService } from "@/services/teamService";
import { leagueEntryService } from "@/services/leagueEntryService";
import type { CartolaTeam } from "@/types/team";
import { normalizeImportIds } from "@/components/teams/teamImport";
import styles from "./EnrollButton.module.css";

type Props = { leagueId: string; leagueName: string; entryFee: number; maxTeamsPerUser?: number | null; compact?: boolean };

export function EnrollButton({ leagueId, leagueName, entryFee, maxTeamsPerUser = null, compact = false }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importFeedback, setImportFeedback] = useState("");
  const [teams, setTeams] = useState<CartolaTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState("");
  const userId = user?.idUsuario ?? "";
  const enrolledIds = useMemo(() => new Set(userId ? leagueEntryService.getByLeagueAndUser(leagueId, userId).map((entry) => entry.userCartolaTeamId) : []), [leagueId, userId]);
  const available = teams.filter((team) => !enrolledIds.has(String(team.timeId)));
  const filtered = available.filter((team) => team.nome.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")));
  const limit = maxTeamsPerUser === null ? available.length : Math.max(0, maxTeamsPerUser - enrolledIds.size);
  const canSelectMore = selected.length < limit;
  const close = () => { setOpen(false); setSuccess(false); setQuery(""); setSelected([]); setShowImport(false); setImportText(""); setImportFeedback(""); };
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : canSelectMore ? [...current, id] : current);
  const selectAll = () => setSelected(available.slice(0, limit).map((team) => String(team.timeId)));
  const selectImported = () => {
    const imported = normalizeImportIds(importText).split(";").filter(Boolean);
    if (!imported.length) { setImportFeedback("Informe ao menos um TIME_ID válido."); return; }
    const availableIds = new Set(available.map((team) => String(team.timeId)));
    const matched = [...new Set(imported)].filter((id) => availableIds.has(id));
    const selectedIds = matched.slice(0, limit);
    const unavailable = imported.filter((id) => !availableIds.has(id)).length;
    setSelected(selectedIds);
    setImportFeedback(`${selectedIds.length} ${selectedIds.length === 1 ? "time selecionado" : "times selecionados"}${unavailable ? `. ${unavailable} não encontrado(s) ou indisponível(is) nesta liga.` : ""}${matched.length > limit ? ` Limite de ${limit} aplicado.` : ""}`);
  };
  const confirm = () => { if (!userId) return; leagueEntryService.createMockEntries(leagueId, userId, selected); setSuccess(true); };
  const loadTeams = useCallback(async () => { if (!isAuthenticated) return; setLoadingTeams(true); setTeamsError(""); try { setTeams(await teamService.buscarMeusTimes()); } catch { setTeamsError("Não foi possível carregar seus times."); } finally { setLoadingTeams(false); } }, [isAuthenticated]);
  useEffect(() => { if (open) void loadTeams(); }, [open, loadTeams]);
  return (
    <>
      <button
        type="button"
        className={compact ? styles.compact : styles.button}
        onClick={() => setOpen(true)}
        aria-label={compact ? `Entrar na liga ${leagueName}` : undefined}
        title={compact ? "Entrar na liga" : undefined}
      >
        {compact ? <LogIn size={20} aria-hidden="true" /> : `Inscrever time — ${formatCurrency(entryFee)}`}
      </button>
      {open && (
        <div className={styles.backdrop} role="presentation" onMouseDown={close}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="enroll-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className={styles.close} onClick={close} aria-label="Fechar"><X size={20} /></button>
            {success ? <div className={styles.success}><span className={styles.icon}><CheckCircle2 size={30} /></span><h2 id="enroll-title">Inscrição realizada com sucesso</h2><p>{selected.length} {selected.length === 1 ? "time foi inscrito" : "times foram inscritos"} na <strong>{leagueName}</strong>.</p><div className={styles.actions}><Link href={`/ligas/${leagueId}`}>Ir para a liga</Link><Link href="/meus-times">Ver meus times</Link><Link href="/">Voltar ao início</Link></div></div> : <>
              <div className={styles.modalHeader}><p className="eyebrow">Inscrição na liga</p><h2 id="enroll-title">Escolha seus times</h2><p>Selecione um ou vários times vinculados à sua conta.</p></div>
              <label className={styles.search}><Search size={18} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pelo nome do time" /></label>
              <div className={styles.selectionTools}><strong>{selected.length} {selected.length === 1 ? "time selecionado" : "times selecionados"}</strong><span><button onClick={selectAll}>Selecionar todos</button><button onClick={() => setSelected([])}>Desmarcar todos</button><button onClick={() => { setShowImport((value) => !value); setImportFeedback(""); }}><Download size={14} /> Importar IDs</button></span></div>
              {showImport && <div className={styles.importSelection}><label htmlFor="league-team-ids">Cole a lista de TIME_ID</label><textarea id="league-team-ids" value={importText} onChange={(event) => { setImportText(event.target.value); setImportFeedback(""); }} placeholder="Meus Favoritos=>44566162;30157334;13933388" /><button type="button" onClick={selectImported}>Selecionar times da lista</button>{importFeedback && <p role="status">{importFeedback}</p>}</div>}
              {maxTeamsPerUser && <p className={styles.limit}>Limite desta liga: {maxTeamsPerUser} times por usuário.</p>}
              <div className={styles.teamOptions}>{loadingTeams ? <p className={styles.teamStatus}><Loader2 className={styles.spinner} /> Carregando seus times...</p> : teamsError ? <p className={styles.teamStatus}>{teamsError}<button type="button" onClick={() => void loadTeams()}>Tentar novamente</button></p> : filtered.map((team) => { const id = String(team.timeId); return <label key={id} className={selected.includes(id) ? styles.checked : ""}><input type="checkbox" checked={selected.includes(id)} disabled={!selected.includes(id) && !canSelectMore} onChange={() => toggle(id)} /><i className={styles.teamShield}>{team.escudoUrl ? <img src={team.escudoUrl} alt={`Escudo do ${team.nome}`} /> : team.nome.slice(0, 2).toUpperCase()}</i><span><strong>{team.nome}</strong><small>{team.nomeCartoleiro}</small></span></label>; })}{!loadingTeams && !teamsError && !filtered.length && <p>Nenhum time disponível encontrado.</p>}</div>
              {!!enrolledIds.size && <p className={styles.already}>{enrolledIds.size} {enrolledIds.size === 1 ? "time já está inscrito" : "times já estão inscritos"} nesta liga e não pode ser selecionado novamente.</p>}
              <div className={styles.summary}><div><span>{leagueName}</span><small>{formatCurrency(entryFee)} por time</small></div><div><span>Total</span><strong>{formatCurrency(selected.length * entryFee)}</strong></div></div>
              <button className={styles.confirm} disabled={!selected.length} onClick={confirm}>Confirmar inscrição</button><button className={styles.cancel} onClick={close}>Fechar</button><small className={styles.disclaimer}>Confirmação demonstrativa. Nenhuma cobrança será realizada.</small>
            </>}
          </div>
        </div>
      )}
    </>
  );
}
