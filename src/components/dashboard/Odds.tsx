import type {MatchOdds} from "@/types/dashboard";
import styles from "./Dashboard.module.css";
export function Odds({odds,demonstrative=false}:{odds?:MatchOdds;demonstrative?:boolean}){if(!odds)return null;return <div className={styles.odds} aria-label={demonstrative?"Odds demonstrativas da partida":"Odds da partida"}><span>1 <b>{odds.home.toFixed(2)}</b></span><span>X <b>{odds.draw.toFixed(2)}</b></span><span>2 <b>{odds.away.toFixed(2)}</b></span>{demonstrative?<small>Odds demonstrativas</small>:odds.partner&&<small>Odds por {odds.partner.name}</small>}</div>}
