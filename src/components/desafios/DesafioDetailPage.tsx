"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { AddBalanceModal } from "@/components/wallet/AddBalanceModal";
import { Dialog } from "@/components/ui/Dialog";
import { ApiError } from "@/services/apiClient";
import { desafioService as service, desafioDate, desafioMessage, desafioStatus, insufficientBalance, type DesafioDetalhe, type DesafioJogo, type Palpite, type SaldoInsuficiente } from "@/services/desafioService";
import { formatWalletCurrency as money } from "@/lib/format";
import { DesafioMatch } from "./DesafioMatch";
import { DesafioRanking } from "./DesafioRanking";
import { DesafioTabs } from "./DesafioTabs";
import styles from "./Desafios.module.css";

export function DesafioDetailPage() {
  const params = useSearchParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const raw = params.get("id") ?? "", id = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isInteger(id) || id < 1 || id > 4294967295) return <div className="page-shell"><p role="alert">Desafio inválido.</p><Link href="/desafios">Voltar para Desafios</Link></div>;
  // Ranking remains public after the detail endpoint stops exposing the challenge.
  if (params.get("aba") === "ranking") return <DesafioRanking key={id} id={id} />;
  if (isLoading) return <p className="page-shell" role="status">Carregando Desafio...</p>;
  // Never reuse another user's selections or enrollment on identity/navigation changes.
  return <DesafioDetail key={`${id}:${isAuthenticated ? user?.idUsuario : "public"}`} id={id} authenticated={isAuthenticated} />;
}

function DesafioDetail({ id, authenticated }: { id: number; authenticated: boolean }) {
  const router = useRouter();
  const { refreshWallet } = useWallet();
  const [data, setData] = useState<DesafioDetalhe | null>(null);
  const [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(""), [needsRefresh, setNeedsRefresh] = useState(false);
  const [loadStatus, setLoadStatus] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null), [joining, setJoining] = useState(false);
  const [saved, setSaved] = useState<Record<number, boolean>>({}), [gameErrors, setGameErrors] = useState<Record<number, string>>({});
  const [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [missingIds, setMissingIds] = useState<number[]>([]), [blockedEntry, setBlockedEntry] = useState(false);
  const [balance, setBalance] = useState<SaldoInsuficiente | null>(null), [lowBalance, setLowBalance] = useState(false);
  const [confirm, setConfirm] = useState(false), [pixOpen, setPixOpen] = useState(false);
  const lock = useRef(false), mounted = useRef(true), read = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    read.current?.abort();
    const controller = new AbortController(); read.current = controller;
    setRefreshing(true); setLoadError(""); setLoadStatus(null);
    try {
      const result = await service.detail(id, authenticated, controller.signal);
      if (controller.signal.aborted || !mounted.current) return null;
      setData(result); setNeedsRefresh(false);
      return result;
    } catch (cause) {
      if (controller.signal.aborted || !mounted.current) return null;
      setLoadError(desafioMessage(cause)); setNeedsRefresh(true); setLoadStatus(cause instanceof ApiError ? cause.status : null);
      if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) setData(null);
      return null;
    } finally { if (!controller.signal.aborted && mounted.current) { setRefreshing(false); setLoading(false); } }
  }, [id, authenticated]);
  useEffect(() => {
    mounted.current = true; void refresh();
    return () => { mounted.current = false; read.current?.abort(); };
  }, [refresh]);
  const login = () => router.push("/login");

  async function choose(game: DesafioJogo, value: Palpite) {
    if (!authenticated) { login(); return; }
    if (lock.current || refreshing || needsRefresh || !game.podeAlterarPalpite || (game.meuPalpite === value && !missingIds.includes(game.id))) return;
    lock.current = true; setSaving(game.id); setGameErrors(current => ({ ...current, [game.id]: "" }));
    setSaved(current => ({ ...current, [game.id]: false }));
    try {
      const result = await service.predict(id, game.id, value);
      if (!mounted.current) return;
      setData(current => current && ({ ...current, partidas: current.partidas.map(item => item.id === result.partidaId ? { ...item, meuPalpite: result.palpite, fechamentoEm: result.fechamentoEm, podeAlterarPalpite: result.podeAlterarPalpite } : item) }));
      setSaved(current => ({ ...current, [game.id]: true }));
      setMissingIds(current => current.filter(partidaId => partidaId !== game.id));
    } catch (cause) {
      if (!mounted.current) return;
      setGameErrors(current => ({ ...current, [game.id]: desafioMessage(cause) }));
      if (cause instanceof ApiError && cause.status === 401) login();
      // A stale screen can cross the cutoff; re-read the backend's eligibility.
      await refresh();
    } finally { lock.current = false; if (mounted.current) setSaving(null); }
  }

  async function participate() {
    if (!authenticated) { login(); return; }
    if (!data || lock.current || refreshing || needsRefresh || data.inscrito || data.minhaInscricao?.status === "ATIVA" || data.minhaInscricao?.status === "CANCELADA" || data.status !== "ABERTO") return;
    lock.current = true; setJoining(true); setError(""); setBalance(null); setLowBalance(false); setSuccess("");
    try {
      const result = await service.participate(id);
      if (!mounted.current) return;
      // Enrollment only comes from the backend response, never from saved predictions.
      setData(current => current && ({ ...current, inscrito: result.inscricao.status === "ATIVA", minhaInscricao: result.inscricao }));
      setConfirm(false); setSuccess("Participação confirmada!"); setMissingIds([]);
      if (result.tipoAcesso === "PAGO") void refreshWallet();
      await refresh();
    } catch (cause) {
      if (!mounted.current) return;
      setConfirm(false); setError(desafioMessage(cause));
      if (cause instanceof ApiError) {
        const code = cause.details.code;
        if (code === "SALDO_INSUFICIENTE") { setBalance(insufficientBalance(cause)); setLowBalance(true); }
        if (code === "PALPITES_INCOMPLETOS" && Array.isArray(cause.details.partidaIds)) setMissingIds(cause.details.partidaIds.filter((value): value is number => typeof value === "number" && Number.isInteger(value)));
        if (["DESAFIO_INDISPONIVEL", "FORA_JANELA_INSCRICAO", "SEM_PARTIDAS_ELEGIVEIS", "PARTIDAS_INDISPONIVEIS", "LIMITE_PARTICIPANTES_ATINGIDO", "CARTEIRA_BLOQUEADA", "VALOR_INSCRICAO_INVALIDO", "INSCRICAO_CANCELADA"].includes(String(code))) setBlockedEntry(true);
        if (cause.status === 401) login();
      }
      // Recover an existing enrollment after a lost response or concurrent attempt.
      const updated = await refresh();
      if (updated?.inscrito || updated?.minhaInscricao?.status === "ATIVA") { setError(""); setSuccess("Participação confirmada!"); setLowBalance(false); setBalance(null); if (updated.tipoAcesso === "PAGO") void refreshWallet(); }
    } finally { lock.current = false; if (mounted.current) setJoining(false); }
  }

  const busy = saving !== null || joining || refreshing;
  const enrolled = data?.inscrito === true || data?.minhaInscricao?.status === "ATIVA";
  const cancelled = data?.minhaInscricao?.status === "CANCELADA";
  const missing = data?.partidas.filter(game => game.status !== "ANULADA" && (!game.meuPalpite || missingIds.includes(game.id))) ?? [];
  const acceptingEntries = data?.status === "ABERTO" && !cancelled;
  const entryDisabled = busy || needsRefresh || blockedEntry || cancelled || data?.status !== "ABERTO" || (authenticated && (missing.length > 0 || !data?.partidas.some(game => game.status !== "ANULADA")));
  async function retry() { if (lock.current) return; const result = await refresh(); if (result) setBlockedEntry(false); }
  function beginParticipation() {
    if (!authenticated) { login(); return; }
    if (entryDisabled || enrolled || lock.current) return;
    if (data?.tipoAcesso === "PAGO") setConfirm(true); else void participate();
  }
  return <div className="page-shell">
    <Link className={styles.back} href="/desafios">← Desafios</Link>
    <DesafioTabs id={id} active="desafio" busy={busy} />
    {success && <p className={styles.success} role="status">{success}</p>}
    {loading ? <p role="status" className={styles.feedback}>Carregando Desafio...</p> : <>
      {loadError && <div className={styles.error} role="alert"><p>{loadError}</p>{loadStatus === 404 && <p>Se o Desafio já encerrou, consulte a aba Ranking.</p>}<button className={styles.secondary} disabled={busy} onClick={() => void retry()}>Tentar novamente</button>{loadStatus === 401 && <Link className={styles.secondary} href="/login">Entrar novamente</Link>}</div>}
      {data && <>
        <header className={styles.header}><div><p className="eyebrow">DESAFIO</p><h1 className="page-title">{data.nome}</h1></div><button className={styles.secondary} disabled={busy} onClick={() => void retry()}>{refreshing ? "Atualizando..." : "Atualizar"}</button></header>
        <div className={styles.badges}><span className={styles.badge}>{data.tipoAcesso === "FREE" ? "FREE" : money(data.valorInscricao)}</span><span className={styles.status}>{desafioStatus[data.status]}</span></div>
        {data.descricao && <p className={styles.description}>{data.descricao}</p>}
        <div className={styles.period}><span>Desafio: {desafioDate(data.dataInicio)} — {desafioDate(data.dataFim)}</span><span>Inscrições: {desafioDate(data.inicioInscricao)} — {desafioDate(data.fimInscricao)}</span></div>
        <h2 className={styles.sectionTitle}>{authenticated ? "Seus palpites" : "Partidas"}</h2>
        {!data.partidas.length ? <p className={styles.feedback}>Nenhuma partida disponível.</p> : <ol className={styles.games} aria-label="Partidas do Desafio">{[...data.partidas].sort((a, b) => a.ordem - b.ordem || a.id - b.id).map(game => <DesafioMatch key={game.id} game={game} authenticated={authenticated} disabled={busy || needsRefresh} saving={saving === game.id} saved={!!saved[game.id]} error={gameErrors[game.id]} missing={authenticated && acceptingEntries && !enrolled && game.podeAlterarPalpite && missing.some(item => item.id === game.id)} choose={(item, value) => void choose(item, value)} />)}</ol>}
        <section className={styles.participation} aria-label="Participação no Desafio">
          <h2>{enrolled ? "Participando" : acceptingEntries ? "Participar do Desafio" : "Participação"}</h2>
          {enrolled ? <p>Você está participando. Os palpites das partidas abertas continuam editáveis.</p> : <>
            {cancelled ? <p>Sua inscrição foi cancelada. Não é possível participar novamente.</p> : data.status !== "ABERTO" ? <p>Novas participações indisponíveis neste estado.</p> : <p>{data.tipoAcesso === "FREE" ? "Participação gratuita." : `Inscrição: ${money(data.valorInscricao)}, debitados da sua carteira ao confirmar.`}</p>}
            {authenticated && acceptingEntries && missing.length > 0 && <div><p>Preencha os palpites destes jogos para participar:</p><ul>{missing.map(game => <li key={game.id}><a href={`#partida-${game.id}`}>{game.nomeMandante} × {game.nomeVisitante}</a></li>)}</ul></div>}
            {error && <p className={styles.error} role="alert">{error}</p>}
            {lowBalance && <div>{balance && <dl className={styles.balance}><dt>Saldo disponível</dt><dd>{money(balance.saldoDisponivel)}</dd><dt>Valor necessário</dt><dd>{money(balance.valorNecessario)}</dd><dt>Valor faltante</dt><dd>{money(balance.valorFaltante)}</dd></dl>}<button className={styles.secondary} disabled={busy} onClick={() => setPixOpen(true)}>Adicionar saldo</button></div>}
            {acceptingEntries && <div className={styles.actions}><button className={styles.button} disabled={!!entryDisabled} onClick={beginParticipation}>{joining ? "Confirmando..." : "Participar do Desafio"}</button></div>}
          </>}
        </section>
        {confirm && !enrolled && <Dialog title="Confirmar participação" close={() => { if (!lock.current) setConfirm(false); }} busy={joining}><div className={styles.confirmation}><p>Participar de <strong>{data.nome}</strong> por <strong>{money(data.valorInscricao)}</strong>?</p><p>O valor será debitado da sua carteira ao confirmar.</p><div className={styles.actions}><button className={styles.secondary} disabled={joining} onClick={() => setConfirm(false)}>Voltar</button><button className={styles.button} disabled={!!entryDisabled} onClick={() => void participate()}>{joining ? "Confirmando..." : `Confirmar e pagar ${money(data.valorInscricao)}`}</button></div></div></Dialog>}
        {pixOpen && <AddBalanceModal close={() => { setPixOpen(false); setLowBalance(false); setBalance(null); setError(""); void refreshWallet(); void retry(); }} />}
      </>}
    </>}
  </div>;
}
