"use client";
import React, { useMemo, useState } from "react";
import { CalendarClock, Shield } from "lucide-react";
import Image from "next/image";
import { Dialog } from "@/components/ui/Dialog";
import type { FantasyShowcaseMatchups } from "@/services/pointFantasyShowcaseService";
import type { FantasyCompetition, FantasyMatch } from "@/types/pointFantasyLineup";
import type { FantasyReference } from "@/types/pointFantasy";
import { getClubUniform } from "../uniforms/clubUniforms";
import styles from "./FantasyMatchupsDialog.module.css";

const brasilia = "America/Sao_Paulo";
const statusLabels: Record<string, string> = {
  AGENDADA: "Agendada", ADIADA: "Adiada", CANCELADA: "Cancelada", SUSPENSA: "Suspensa",
  INICIADA: "Em andamento", EM_ANDAMENTO: "Em andamento", ENCERRADA: "Encerrada", FINALIZADA: "Encerrada",
};

function dayKey(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "unknown";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: brasilia, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(time);
  const get = (name: string) => parts.find(part => part.type === name)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dayLabel(key: string) {
  if (key === "unknown") return "Data indisponível";
  const time = Date.parse(`${key}T12:00:00-03:00`);
  const label = new Intl.DateTimeFormat("pt-BR", { timeZone: brasilia, weekday: "long", day: "2-digit", month: "long" }).format(time);
  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}

function kickoffTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time)
    ? `${new Intl.DateTimeFormat("pt-BR", { timeZone: brasilia, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(time)} · Brasília`
    : "Horário indisponível";
}

function clubName(id: number, club: FantasyReference | undefined) {
  const known = getClubUniform(id).name;
  if (known !== "Clube não configurado") return known;
  return club?.dados.apelido || club?.dados.nome || "Clube indisponível";
}

function MatchClub({ id, club, side }: { id: number; club?: FantasyReference; side: "Mandante" | "Visitante" }) {
  const [failed, setFailed] = useState(false);
  const name = clubName(id, club);
  const crestUrl = club?.dados.escudos?.["45x45"];
  return <div className={styles.club}>
    <span className={styles.crest}>
      {crestUrl && !failed ? <Image src={crestUrl} alt={`Escudo do ${name}`} width={32} height={32} unoptimized onError={() => setFailed(true)} />
        : <Shield size={25} aria-hidden="true" />}
    </span>
    <span className={styles.clubName} title={name}>{name}</span>
    <span className={styles.srOnly}>{side}</span>
  </div>;
}

function groupMatches(matches: FantasyMatch[]) {
  const ordered = [...matches].sort((a, b) => {
    const first = Date.parse(a.inicioPrevisto), second = Date.parse(b.inicioPrevisto);
    if (Number.isFinite(first) !== Number.isFinite(second)) return Number.isFinite(first) ? -1 : 1;
    return (Number.isFinite(first) ? first - second : 0) || a.id - b.id;
  });
  const groups = new Map<string, FantasyMatch[]>();
  for (const match of ordered) {
    const key = dayKey(match.inicioPrevisto);
    groups.set(key, [...(groups.get(key) ?? []), match]);
  }
  return [...groups].map(([key, items]) => ({ key, label: dayLabel(key), items }));
}

export function FantasyMatchupsDialog({ competition, loading, data, error, onRetry, onClose }: {
  competition: FantasyCompetition;
  loading: boolean;
  data?: FantasyShowcaseMatchups;
  error?: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  const groups = useMemo(() => groupMatches(data?.partidas ?? []), [data?.partidas]);
  const clubs = useMemo(() => new Map((data?.clubes ?? []).map(club => [club.id, club])), [data?.clubes]);

  return <Dialog title="Jogos da disputa" close={onClose}>
    <div className={styles.content}>
      <div className={styles.competition}>
        <strong title={competition.nome}>{competition.nome}</strong>
        <span>Rodada {competition.rodada} · Temporada {competition.temporada}</span>
      </div>
      {loading ? <p className={styles.state} role="status"><CalendarClock size={18} aria-hidden="true" />Carregando confrontos…</p>
        : error ? <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={onRetry}>Tentar novamente</button></div>
        : !groups.length ? <p className={styles.state} role="status">Nenhum confronto informado para esta disputa.</p>
          : <div className={styles.list} aria-label="Confrontos da competição">
            {groups.map(group => <section key={group.key} className={styles.dayGroup} aria-label={group.label}>
              <h3>{group.label}</h3>
              <ul>{group.items.map(match => {
                const home = clubs.get(match.clubeMandanteId), away = clubs.get(match.clubeVisitanteId);
                const status = statusLabels[match.status];
                return <li key={match.id} className={styles.match}>
                  <MatchClub id={match.clubeMandanteId} club={home} side="Mandante" />
                  <div className={styles.matchMeta}><strong aria-label="contra">×</strong><span>{kickoffTime(match.inicioPrevisto)}</span>{status && <small>{status}</small>}</div>
                  <MatchClub id={match.clubeVisitanteId} club={away} side="Visitante" />
                </li>;
              })}</ul>
            </section>)}
          </div>}
    </div>
  </Dialog>;
}
