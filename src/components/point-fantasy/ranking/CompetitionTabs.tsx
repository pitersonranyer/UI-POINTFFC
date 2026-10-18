import React from "react";
import leagueStyles from "../../leagues/PointCompetition.module.css";
import styles from "../lineups/LineupBuilder.module.css";

export function CompetitionTabs({ tab, onChange, panelId = "journey-panel" }: { tab: string; onChange: (tab: string) => void; panelId?: string }) {
  const tabs = ["Meus times", "Ranking", "Premiação"];
  return <div role="tablist" aria-label="Ambiente da competição" className={`${leagueStyles.tabs} ${styles.competitionTabs}`}>{tabs.map((name, index) => <button key={name} type="button" role="tab" tabIndex={tab === name ? 0 : -1} aria-selected={tab === name} className={tab === name ? leagueStyles.active : ""} aria-controls={panelId} id={`tab-${name.replaceAll(" ", "-")}`} onClick={() => onChange(name)} onKeyDown={event => {
    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); onChange(tabs[next]);
    (event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next])?.focus();
  }}>{name}</button>)}</div>;
}
