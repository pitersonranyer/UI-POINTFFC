"use client";
import Link from "next/link";
import { useFutebolRodada } from "@/hooks/useFutebolRodada";
import { FutebolMatchInfo, FutebolShield } from "./FutebolMatch";
import styles from "./FutebolMatches.module.css";

export function FutebolMatches() {
  const { data, loading, error } = useFutebolRodada();
  return <section className={styles.card} aria-label="Jogos da Rodada">
    <header><h2>Jogos da Rodada</h2>{data?.rodada != null && <span>Rodada {data.rodada}</span>}</header>
    {loading ? <p role="status">Carregando jogos da rodada...</p> : error ? <p role="alert">{error}</p> : !data || data.rodada == null || !data.jogos.length ? <p>Nenhum jogo disponível no momento.</p> :
      <div className={styles.grid}>{data.jogos.map(jogo => <Link className={styles.match} key={jogo.id} href={`/jogos?futebol=${jogo.id}`} aria-label={`Ver detalhes de ${jogo.mandante.nome} contra ${jogo.visitante.nome}`}>
        <div className={styles.team}><FutebolShield team={jogo.mandante} /><strong>{jogo.mandante.nome}</strong></div>
        <FutebolMatchInfo jogo={jogo} />
        <div className={styles.team}><FutebolShield team={jogo.visitante} /><strong>{jogo.visitante.nome}</strong></div>
      </Link>)}</div>}
  </section>;
}
