import { CalendarDays, MapPin } from "lucide-react";
import type { RoundMatches as RoundMatchesData } from "@/types/match";
import styles from "./RoundMatches.module.css";

function matchDate(value: string) {
  const [, month, day, hour, minute] = value.match(/\d{4}-(\d{2})-(\d{2}) (\d{2}):(\d{2})/) ?? [];
  return { date: `${day}/${month}`, time: `${hour}:${minute}` };
}

export function RoundMatches({ data }: { data: RoundMatchesData }) {
  return <section className={styles.section}>
    <div className={styles.heading}><div><p className="eyebrow">Brasileirão</p><h2>Jogos da Rodada {data.round}</h2></div><span><CalendarDays size={17} />{data.matches.length} jogos</span></div>
    <div className={styles.scroller}>{data.matches.map((game) => {
      const schedule = matchDate(game.date);
      const hasScore = game.homeScore !== null && game.awayScore !== null;
      return <article className={styles.game} key={game.id}>
        <div className={styles.schedule}><strong>{schedule.date}</strong><span>{schedule.time}</span></div>
        <div className={styles.teams}>
          <div><img src={game.home.shieldUrl} alt="" /><strong>{game.home.abbreviation}</strong></div>
          <span className={styles.score}>{hasScore ? `${game.homeScore} × ${game.awayScore}` : "×"}</span>
          <div><img src={game.away.shieldUrl} alt="" /><strong>{game.away.abbreviation}</strong></div>
        </div>
        <p><MapPin size={13} />{game.venue}</p>
      </article>;
    })}</div>
    <small className={styles.source}>Dados da rodada disponibilizados pelo Cartola.</small>
  </section>;
}
