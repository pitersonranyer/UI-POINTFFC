import styles from "./LineupScouts.module.css";

// Presentation only: point values and totals remain owned by the backend.
const positive = new Set(["G", "A", "FT", "FD", "FF", "FS", "PS", "SG", "DP", "DE", "DD", "DS", "RB", "V"]);
const negative = new Set(["GC", "CA", "CV", "GS", "FC", "PC", "PP", "I", "PI"]);

export function LineupScouts({ scout }: { scout?: Record<string, number> | null }) {
  const entries = Object.entries(scout ?? {}).filter(([, count]) => Number.isFinite(count) && count > 0);
  if (!entries.length) return null;
  return <span className={styles.scouts} aria-label="Scouts">{entries.map(([code, count]) =>
    <span key={code} className={positive.has(code) ? styles.positive : negative.has(code) ? styles.negative : styles.neutral}>
      {count > 1 ? count : ""}{code}
    </span>)}</span>;
}
