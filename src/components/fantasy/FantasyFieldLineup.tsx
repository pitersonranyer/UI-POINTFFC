import type { FantasyPlayer } from "@/types/fantasy";
import styles from "./MatchCenter.module.css";
import { FormationIndicators, type FormationIncident } from "./FormationEvents";

export function playerCoordinates(player: FantasyPlayer) {
  const grid = player.grid?.match(/^([1-9]\d*):([1-9]\d*)$/);
  const valid = (row: number | null | undefined, column: number | null | undefined) => row != null && column != null && Number.isInteger(row) && Number.isInteger(column) && row > 0 && row <= 12 && column > 0 && column <= 11;
  const coordinate = player.coordenada;
  if (coordinate && valid(coordinate.linha, coordinate.coluna)) return { row: coordinate.linha!, column: coordinate.coluna! };
  if (grid && valid(Number(grid[1]), Number(grid[2]))) return { row: Number(grid[1]), column: Number(grid[2]) };
  return null;
}
// Provider grid rows may subdivide the advertised tactical lines. Reconcile only
// when supplied roles account exactly for the formation; never fill missing slots.
export function tacticalRows(players: FantasyPlayer[], formation: string | null) {
  if (!formation || !/^\d+(?:-\d+){2,4}$/.test(formation)) return null;
  const counts = [1, ...formation.split("-").map(Number)];
  if (counts.some(count => count < 1) || counts.reduce((a, b) => a + b, 0) !== 11 || players.length !== 11) return null;
  const positioned = players.map(player => ({ player, position: playerCoordinates(player) }));
  if (positioned.some(item => !item.position)) return null;
  const entries = positioned.map(item => ({ player: item.player, position: item.position! }));
  if (new Set(entries.map(({ position }) => `${position.row}:${position.column}`)).size !== 11) return null;
  let rows = [...new Set(entries.map(item => item.position.row))].sort((a, b) => a - b).map(row => entries.filter(item => item.position.row === row));
  if (rows.length !== counts.length || rows.some((row, i) => row.length !== counts[i])) {
    if (counts.length !== 4) return null;
    const category = (entry: typeof entries[number]) => entry.player.funcaoPartida.categoria;
    const keepers = entries.filter(item => category(item) === "GOL");
    const backs = entries.filter(item => category(item) === "ZAG");
    const wings = entries.filter(item => category(item) === "LAT");
    const midfield = entries.filter(item => category(item) === "MEI");
    const forwards = entries.filter(item => category(item) === "ATA");
    rows = backs.length === counts[1] ? [keepers, backs, [...midfield, ...wings], forwards] : [keepers, [...backs, ...wings], midfield, forwards];
    if (rows.some((row, i) => row.length !== counts[i])) return null;
  }
  if (rows[0][0].position.row !== 1 || rows[0][0].player.funcaoPartida.categoria !== "GOL") return null;
  const tactical = rows.map(row => row.map(entry => {
    const columns = Math.max(...entries.filter(item => item.position.row === entry.position.row).map(item => item.position.column));
    return { ...entry, x: (entry.position.column - .5) / columns };
  }).sort((a, b) => a.x - b.x));
  return tactical.some(row => new Set(row.map(item => item.x)).size !== row.length) ? null : tactical;
}

export function FantasyFieldLineup({ players, teamName, formation = null, side = "mandante", incidents, onPlayer }: { players: FantasyPlayer[]; teamName: string | null; formation?: string | null; side?: "mandante" | "visitante"; incidents?: Map<number, FormationIncident[]>; onPlayer: (player: FantasyPlayer) => void }) {
  const rows = tacticalRows(players, formation);
  if (!rows) return <section className={styles.formationFallback} aria-label={`Titulares de ${teamName ?? "equipe"}`}><p className={styles.help}>Dados insuficientes para representar o esquema no campo.</p><ul className={styles.playerList}>{players.map((player, index) => <li key={player.idExterno ?? index}><b>{player.numero ?? "—"}</b><button type="button" onClick={() => onPlayer(player)} aria-label={`Detalhes de ${player.nome ?? "atleta"}`}>{player.nome ?? "Nome indisponível"}</button><span>{player.funcaoPartida.nome ?? player.posicao ?? "—"}</span></li>)}</ul>{!players.length && <p className={styles.help}>Nenhum atleta informado.</p>}</section>;
  const oriented = side === "mandante" ? rows : [...rows].reverse();
  return <section className={styles.fieldHalf} data-side={side} aria-label={`Campo de ${teamName ?? "equipe"}`}>
    {oriented.map((row, index) => <div className={styles.fieldRow} data-player-count={row.length} data-tactical-row={side === "mandante" ? index : rows.length - index - 1} key={index}>
      {row.map(({ player, position, x }, playerIndex) => <button type="button" className={styles.fieldPlayer} key={player.idExterno ?? playerIndex} data-source-grid={`${position.row}:${position.column}`} data-has-events={player.idExterno != null && !!incidents?.get(player.idExterno)?.length || undefined} style={{ left: `${(side === "mandante" ? x : 1 - x) * 100}%`, width: `${Math.min(.25, ...row.filter(item => item.player !== player).map(item => Math.abs(item.x - x))) * 100}%` }} onClick={() => onPlayer(player)} aria-label={`Detalhes de ${player.nome ?? "atleta"}`} title={player.nome ?? undefined}>
        {player.idExterno != null && !!incidents?.get(player.idExterno)?.length && <FormationIndicators incidents={incidents.get(player.idExterno)!} />}
        <span>{player.numero ?? "—"}</span><strong>{player.nome ?? "Nome indisponível"}</strong>
      </button>)}
    </div>)}
  </section>;
}
