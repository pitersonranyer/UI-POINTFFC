import type { FantasyPlayer } from "@/types/fantasy";
import fieldReference from "@/components/teams/TeamDetail.module.css";
import styles from "./MatchCenter.module.css";

// Presentation accepts examples without identity; contract players still require an ID.
export type FieldPlayer = Omit<FantasyPlayer, "idExterno"> & { idExterno?: number };

function coordinates(grid: string | null) {
  if (!grid || !/^[1-9]\d*:[1-9]\d*$/.test(grid)) return null;
  const [row, column] = grid.split(":").map(Number);
  return row <= 12 && column <= 11 ? { row, column } : null;
}

export function FantasyFieldLineup({ players, formation, teamName }: { players: FieldPlayer[]; formation: string | null; teamName: string }) {
  const formationColumns = formation && /^\d+(?:-\d+)*$/.test(formation)
    ? [1, ...formation.split("-").map(Number)] : [];
  const positioned = players.flatMap((player, index) => {
    const position = coordinates(player.grid);
    return position ? [{ player, position, index }] : [];
  });
  const rowCount = Math.max(formationColumns.length, ...positioned.map(item => item.position.row), 1);
  const unpositioned = players.filter(player => !coordinates(player.grid));
  return <>
    <section className={`${fieldReference.pitch} ${styles.field}`} aria-label={`Campo de ${teamName}`}>
      {Array.from({ length: rowCount }, (_, index) => {
        // Reverse visual rows so the goalkeeper stays at the bottom, as in FieldLineup.
        const row = rowCount - index;
        const items = positioned.filter(item => item.position.row === row);
        const columns = Math.min(11, Math.max(formationColumns[row - 1] ?? 1, ...items.map(item => item.position.column)));
        return <div className={styles.fieldRow} key={row} data-field-row={row} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {items.map(({ player, position, index: playerIndex }) => <div className={styles.fieldPlayer} key={player.idExterno ?? `example-${playerIndex}`} style={{ gridColumn: position.column }}>
            <span>{player.numero ?? "—"}</span><strong>{player.nome}</strong>
          </div>)}
        </div>;
      })}
      {!positioned.length && <p className={styles.fieldEmpty}>Posições no campo indisponíveis</p>}
    </section>
    {unpositioned.length > 0 && <div className={styles.unpositioned}><strong>Sem posição no campo informada</strong><ul>{unpositioned.map((player, index) => <li key={player.idExterno ?? index}>{player.numero == null ? "" : `${player.numero} · `}{player.nome}</li>)}</ul></div>}
  </>;
}
