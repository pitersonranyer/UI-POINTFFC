import type { FantasyPlayer } from "@/types/fantasy";
import fieldReference from "@/components/teams/TeamDetail.module.css";
import styles from "./MatchCenter.module.css";

export function playerCoordinates(player: FantasyPlayer) {
  const grid = player.grid?.match(/^([1-9]\d*):([1-9]\d*)$/);
  const valid = (row: number | null | undefined, column: number | null | undefined) => row != null && column != null && Number.isInteger(row) && Number.isInteger(column) && row > 0 && row <= 12 && column > 0 && column <= 11;
  const coordinate = player.coordenada;
  if (coordinate && valid(coordinate.linha, coordinate.coluna)) return { row: coordinate.linha!, column: coordinate.coluna! };
  if (grid && valid(Number(grid[1]), Number(grid[2]))) return { row: Number(grid[1]), column: Number(grid[2]) };
  return null;
}
export function FantasyFieldLineup({ players, teamName, onPlayer }: { players: FantasyPlayer[]; teamName: string | null; onPlayer: (player: FantasyPlayer) => void }) {
  const positioned = players.flatMap((player, index) => {
    const position = playerCoordinates(player);
    return position ? [{ player, position, index }] : [];
  });
  const rowCount = Math.max(...positioned.map(item => item.position.row), 1);
  const unpositioned = players.filter(player => !playerCoordinates(player));
  return <>
    <section className={`${fieldReference.pitch} ${styles.field}`} aria-label={`Campo de ${teamName ?? "equipe"}`}>
      {Array.from({ length: rowCount }, (_, index) => {
        const row = rowCount - index;
        const items = positioned.filter(item => item.position.row === row);
        const columns = Math.max(...items.map(item => item.position.column), 1);
        return <div className={styles.fieldRow} key={row} data-field-row={row} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {items.map(({ player, position, index: playerIndex }) => <button type="button" className={styles.fieldPlayer} key={player.idExterno ?? playerIndex} style={{ gridColumn: position.column }} onClick={() => onPlayer(player)} aria-label={`Detalhes de ${player.nome ?? "atleta"}`}>
            <span>{player.numero ?? "—"}</span><strong>{player.nome ?? "Nome indisponível"}</strong>
          </button>)}
        </div>;
      })}
      {!positioned.length && <p className={styles.fieldEmpty}>Posições no campo indisponíveis</p>}
    </section>
    {unpositioned.length > 0 && <div className={styles.unpositioned}><strong>Sem posição no campo informada</strong><ul>{unpositioned.map((player, index) => <li key={player.idExterno ?? index}><button type="button" onClick={() => onPlayer(player)}>{player.nome ?? "Nome indisponível"}</button></li>)}</ul></div>}
  </>;
}
