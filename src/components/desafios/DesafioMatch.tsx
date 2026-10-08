"use client";
import Image from "next/image";
import { useState } from "react";
import { type DesafioJogo, type Palpite } from "@/services/desafioService";
import styles from "./Desafios.module.css";

function Team({ name, logo, goals }: { name: string; logo: string | null; goals?: number }) {
  const [failed, setFailed] = useState(false);
  return <span className={styles.team}>{logo && !failed && <Image src={logo} alt="" width={28} height={28} unoptimized onError={() => setFailed(true)} />}<span>{name}</span>{goals !== undefined && <b aria-label={`Placar do ${name}`}>{goals}</b>}</span>;
}
const choices: { value: Palpite; label: string }[] = [{ value: "CASA", label: "Casa" }, { value: "EMPATE", label: "Empate" }, { value: "FORA", label: "Fora" }];
const matchStatus = { AGENDADA: "", EM_ANDAMENTO: "Em andamento", FINALIZADA: "Finalizado", ANULADA: "Anulada" };
const matchDate = (value: string) => {
  const date = new Date(value);
  const timeZone = "America/Sao_Paulo";
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone })} · ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone })}`;
};
export function DesafioMatch({ game, authenticated, disabled, saving, saved, error, missing, choose }: {
  game: DesafioJogo; authenticated: boolean; disabled: boolean; saving: boolean; saved: boolean; error?: string; missing: boolean;
  choose: (game: DesafioJogo, value: Palpite) => void;
}) {
  const blocked = (authenticated && !game.podeAlterarPalpite) || game.status === "ANULADA";
  const homeName = game.mandanteNome ?? game.nomeMandante ?? "";
  const awayName = game.visitanteNome ?? game.nomeVisitante ?? "";
  const hasScore = game.golsMandante != null && game.golsVisitante != null;
  const result = authenticated && game.status === "FINALIZADA" && game.apurado === true
    ? game.pontos === 1 ? "✓ Acertou · +1 ponto" : game.pontos === 0 ? "✕ Errou · 0 ponto" : ""
    : "";
  return <li id={`partida-${game.id}`} className={`${styles.game} ${missing ? styles.missing : ""}`}>
    <div className={styles.gameHeader}><span>{game.ordem} · {game.nomeCompeticao}</span><time dateTime={game.dataInicio}>{matchDate(game.dataInicio)}</time></div>
    <div className={styles.match}><Team name={homeName} logo={game.logoMandanteUrl} goals={hasScore ? game.golsMandante! : undefined} /><Team name={awayName} logo={game.logoVisitanteUrl} goals={hasScore ? game.golsVisitante! : undefined} /></div>
    <div className={styles.choices} role="group" aria-label={`Palpite: ${homeName} x ${awayName}`}>
      {choices.map(choice => <button type="button" key={choice.value} className={styles.choice} aria-pressed={game.meuPalpite === choice.value} disabled={disabled || blocked} onClick={() => choose(game, choice.value)} aria-label={choice.label}>{choice.label}{game.meuPalpite === choice.value && <span aria-hidden="true"> ✓</span>}</button>)}
    </div>
    {(matchStatus[game.status] || blocked || result || saving || (saved && !blocked) || missing) && <div className={styles.gameFoot}>
      <span>{matchStatus[game.status]}{blocked && game.status === "AGENDADA" ? "Palpite bloqueado" : ""}</span>
      <span role="status">{result || (saving ? "Salvando..." : saved && !blocked ? "Salvo ✓" : missing ? <span className={styles.missingText}>Falta seu palpite</span> : "")}</span>
    </div>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </li>;
}
