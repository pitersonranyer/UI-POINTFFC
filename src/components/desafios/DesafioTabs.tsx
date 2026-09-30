import Link from "next/link";
import styles from "./Desafios.module.css";

export function DesafioTabs({ id, active, busy = false }: { id: number; active: "desafio" | "ranking"; busy?: boolean }) {
  return <nav className={styles.tabs} aria-label="Seções do Desafio">
    <Link href={`/desafios/detalhe?id=${id}`} aria-current={active === "desafio" ? "page" : undefined} aria-disabled={busy || undefined} onClick={event => { if (busy) event.preventDefault(); }}>Desafio / Palpites</Link>
    <Link href={`/desafios/detalhe?id=${id}&aba=ranking`} aria-current={active === "ranking" ? "page" : undefined} aria-disabled={busy || undefined} onClick={event => { if (busy) event.preventDefault(); }}>Ranking</Link>
  </nav>;
}
