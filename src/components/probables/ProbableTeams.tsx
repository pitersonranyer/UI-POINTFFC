"use client";

import { AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CartolaAthlete, CartolaLegacyClub, CartolaMarket } from "@/types/cartola";
import { buscarAtletasMercado } from "@/services/cartola/cartola.service";
import styles from "./ProbableTeams.module.css";

function formationRows(athletes: CartolaAthlete[]) {
  const byPosition = (positionId: number) => athletes.filter((athlete) => athlete.posicao_id === positionId);
  const laterals = byPosition(2);
  const defenders = byPosition(3);
  const defense = laterals.length > 1 ? [laterals[0], ...defenders, ...laterals.slice(2), laterals[1]] : [...laterals, ...defenders];
  return [
    { key: "attack", athletes: byPosition(5) },
    { key: "midfield", athletes: byPosition(4) },
    { key: "defense", athletes: defense },
    { key: "goalkeeper", athletes: byPosition(1) },
  ].filter((row) => row.athletes.length);
}

function athletePhoto(url: string) {
  return url ? url.replace("FORMATO", "140x140") : "";
}

function Player({ athlete }: { athlete: CartolaAthlete }) {
  return (
    <div className={styles.player} title={athlete.nome}>
      <div className={styles.playerPhoto}>
        {athlete.foto ? <img src={athletePhoto(athlete.foto)} alt="" /> : <span>{athlete.apelido.charAt(0)}</span>}
        <i aria-label="Provável" />
      </div>
      <strong>{athlete.apelido_abreviado || athlete.apelido}</strong>
    </div>
  );
}

function StatusList({ title, athletes, tone }: { title: string; athletes: CartolaAthlete[]; tone: "warning" | "danger" }) {
  if (!athletes.length) return null;
  return (
    <section className={styles.statusCard}>
      <div className={`${styles.statusTitle} ${styles[tone]}`}>
        {tone === "warning" ? <AlertCircle size={18} /> : <ShieldAlert size={18} />}
        <h2>{title}</h2><span>{athletes.length}</span>
      </div>
      <div className={styles.statusGrid}>
        {athletes.map((athlete) => (
          <article key={athlete.atleta_id}>
            <div className={styles.smallPhoto}>{athlete.foto && <img src={athletePhoto(athlete.foto)} alt="" />}</div>
            <div><strong>{athlete.apelido}</strong><small>{athlete.nome}</small></div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProbableTeams() {
  const [market, setMarket] = useState<CartolaMarket | null>(null);
  const [clubId, setClubId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadMarket() {
    setLoading(true);
    setError("");
    try {
      const data = await buscarAtletasMercado();
      setMarket(data);
      const clubs = Object.values(data.clubes).filter((club) => club.id);
      setClubId((current) => current && data.clubes[String(current)] ? current : clubs[0]?.id ?? null);
    } catch {
      setError("Não foi possível carregar o mercado do Cartola agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadMarket(); }, []);

  const clubs = useMemo(() => market
    ? Object.values(market.clubes).filter((club) => club.id).sort((a, b) => a.nome.localeCompare(b.nome))
    : [], [market]);
  const club = clubId && market ? market.clubes[String(clubId)] as CartolaLegacyClub | undefined : undefined;
  const athletes = useMemo(() => market && clubId ? market.atletas.filter((item) => item.clube_id === clubId) : [], [market, clubId]);
  const probable = athletes.filter((item) => item.status_id === 7 && item.posicao_id !== 6);
  const coach = athletes.find((item) => item.status_id === 7 && item.posicao_id === 6);
  const doubts = athletes.filter((item) => item.status_id === 2);
  const unavailable = athletes.filter((item) => item.status_id === 3 || item.status_id === 5);
  const rows = formationRows(probable);

  if (loading) return <div className={styles.feedback}><RefreshCw className={styles.spin} /> Carregando prováveis...</div>;
  if (error) return <div className={styles.feedback}><AlertCircle /><p>{error}</p><button onClick={loadMarket}>Tentar novamente</button></div>;

  return (
    <div className={styles.wrapper}>
      <section className={styles.clubPicker} aria-label="Escolha o clube">
        {clubs.map((item) => (
          <button key={item.id} onClick={() => setClubId(item.id)} className={item.id === clubId ? styles.selectedClub : ""}>
            <img src={item.escudos["45x45"]} alt="" /><span>{item.nome}</span>
          </button>
        ))}
      </section>

      {club && <>
        <div className={styles.clubHeading}>
          <img src={club.escudos["60x60"]} alt={`Escudo do ${club.nome}`} />
          <div><span>Escalação provável</span><h2>{club.apelido || club.nome}</h2></div>
          <strong>{probable.length} atletas</strong>
        </div>

        <div className={styles.pitch}>
          <div className={styles.centerCircle} />
          <div className={styles.penaltyTop} /><div className={styles.penaltyBottom} />
          {rows.map((row) => <div className={styles.playerRow} data-line={row.key} key={row.key}>{row.athletes.map((athlete) => <Player key={athlete.atleta_id} athlete={athlete} />)}</div>)}
        </div>

        {coach && <div className={styles.coach}><span>Técnico provável</span><strong>{coach.apelido}</strong></div>}
        {!probable.length && <div className={styles.empty}>Ainda não há atletas marcados como prováveis para este clube.</div>}
        <div className={styles.legend}><span><i className={styles.greenDot} /> Provável</span><span><i className={styles.yellowDot} /> Dúvida</span><span><i className={styles.redDot} /> Desfalque</span></div>
        <div className={styles.statusColumns}>
          <StatusList title="Dúvidas" athletes={doubts} tone="warning" />
          <StatusList title="Suspensos e contundidos" athletes={unavailable} tone="danger" />
        </div>
        {!doubts.length && !unavailable.length && <p className={styles.noAlerts}>Nenhuma dúvida ou desfalque informado para este clube.</p>}
        <p className={styles.source}>Dados sincronizados com o mercado do Cartola no último deploy. Os status podem mudar até o fechamento da rodada.</p>
      </>}
    </div>
  );
}
