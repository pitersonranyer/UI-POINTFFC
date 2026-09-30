"use client";
import Image from "next/image";
import { useState } from "react";
import { desafioDate, type DesafioJogo, type Palpite } from "@/services/desafioService";
import styles from "./Desafios.module.css";

function Team({ name, logo }: { name: string; logo: string | null }) {
  const [failed, setFailed] = useState(false);
  return <span className={styles.team}>{logo && !failed && <Image src={logo} alt="" width={28} height={28} unoptimized onError={() => setFailed(true)} />}<span>{name}</span></span>;
}
const choices: { value: Palpite; number: string; label: string }[] = [{ value: "CASA", number: "1", label: "Mandante" }, { value: "EMPATE", number: "X", label: "Empate" }, { value: "FORA", number: "2", label: "Visitante" }];
const matchStatus = { AGENDADA: "Agendada", EM_ANDAMENTO: "Em andamento / aguardando apuração", FINALIZADA: "Finalizada", ANULADA: "Anulada · sem pontuação" };
const pickLabels: Record<Palpite, string> = { CASA: "1 · Mandante", EMPATE: "X · Empate", FORA: "2 · Visitante" };
export function DesafioMatch({ game, authenticated, disabled, saving, saved, error, missing, choose }: {
  game: DesafioJogo; authenticated: boolean; disabled: boolean; saving: boolean; saved: boolean; error?: string; missing: boolean;
  choose: (game: DesafioJogo, value: Palpite) => void;
}) {
  const blocked = (authenticated && !game.podeAlterarPalpite) || game.status === "ANULADA";
  return <li id={`partida-${game.id}`} className={`${styles.game} ${missing ? styles.missing : ""}`}>
    <div className={styles.gameHeader}><span>{game.ordem}. {game.nomeCompeticao}</span><time dateTime={game.dataInicio}>{desafioDate(game.dataInicio)}</time></div>
    <div className={styles.match}><Team name={game.nomeMandante} logo={game.logoMandanteUrl} /><span className={styles.versus}>×</span><Team name={game.nomeVisitante} logo={game.logoVisitanteUrl} /></div>
    <div className={styles.choices} role="group" aria-label={`Palpite: ${game.nomeMandante} x ${game.nomeVisitante}`}>
      {choices.map(choice => <button type="button" key={choice.value} className={styles.choice} aria-pressed={game.meuPalpite === choice.value} disabled={disabled || blocked} onClick={() => choose(game, choice.value)} aria-label={`${choice.number} ${choice.label}`}><b>{choice.number}</b>{choice.label}</button>)}
    </div>
    <div className={styles.matchState}>
      <span>{matchStatus[game.status]}</span>
      {authenticated && <span>Seu palpite: <strong>{game.meuPalpite ? pickLabels[game.meuPalpite] : "Não informado"}</strong></span>}
      {game.status === "FINALIZADA" && <span>Resultado e pontuação por partida indisponíveis.</span>}
    </div>
    <div className={styles.gameFoot}><span>{blocked ? "Palpite bloqueado" : "Fechamento"} · {desafioDate(game.fechamentoEm)}</span><span role="status">{saving ? "Salvando..." : saved && !blocked ? "Salvo ✓" : missing ? <span className={styles.missingText}>Falta seu palpite</span> : !authenticated && !blocked ? "Entre para palpitar" : ""}</span></div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </li>;
}
