import { BarChart3, Castle, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import type { RoundCenterDataset, SquadTier } from "@/types/round-center";
import styles from "./RoundCenter.module.css";

const tierCopy: Record<SquadTier, { title: string; description: string }> = {
  1: { title: "1º Pelotão", description: "Maior confiança para SG" },
  2: { title: "2º Pelotão", description: "Boas alternativas" },
  3: { title: "3º Pelotão", description: "Alternativa de maior risco" },
};

export function RoundCenter({ data }: { data: RoundCenterDataset }) {
  const topPick = data.cleanSheetAnalysis[0];

  return <div className="page-shell">
    <section className={styles.hero}>
      <div className={styles.heroCopy}><span className={styles.roundTag}>RODADA {data.round}</span><p className="eyebrow">{data.competition}</p><h1>A vantagem da rodada<br/><em>começa aqui.</em></h1><p>A leitura do MAGO transforma os dados da rodada em escolhas mais claras para a sua escalação.</p></div>
      <div className={styles.insights}>
        <div className={styles.mainInsight}><span><Sparkles size={15}/> Destaque do MAGO</span><small>Melhor caminho para SG</small><strong>{topPick?.team ?? "Em análise"}</strong><p><ShieldCheck size={16}/> 1º pelotão de confiança</p></div>
        <div className={styles.insightStats}><span><b>{data.cleanSheetAnalysis.length}</b><small>times analisados</small></span><span><b>3</b><small>níveis de confiança</small></span></div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.heading}><div><span className={styles.icon}><Castle size={18}/></span><div><h2>Ranking de SG</h2><p>Do cenário mais seguro à aposta de maior risco</p></div></div><span className={styles.magoBadge}><TrendingUp size={14}/> Atualizado para a rodada</span></div>
      <div className={styles.tiers}>{([1,2,3] as SquadTier[]).map((tier) => <article className={`${styles.tier} ${styles[`tier${tier}`]}`} key={tier}>
        <header><span>{tier}</span><div><h3>{tierCopy[tier].title}</h3><p>{tierCopy[tier].description}</p></div></header>
        <ol>{data.cleanSheetAnalysis.filter((item) => item.tier === tier).map((item) => <li key={item.team}><span>{data.cleanSheetAnalysis.indexOf(item)+1}</span><strong>{item.team}</strong><small>{item.cleanSheetProbability === undefined ? "SG  --" : `SG  ${item.cleanSheetProbability}%`}</small></li>)}</ol>
      </article>)}</div>
    </section>

    <section className={styles.section}>
      <SectionHeading icon={<BarChart3 size={18}/>} title="Placares imaginários" subtitle="Projeções fornecidas pelo dataset" />
      <div className={styles.scores}>{data.matches.map((match) => <article key={match.id}><div><strong>{match.homeTeam}</strong><span>×</span><strong>{match.awayTeam}</strong></div>{match.imaginedScore ? <b>{match.imaginedScore.home} × {match.imaginedScore.away}</b> : <small>Análise em preparação</small>}</article>)}</div>
    </section>
    <aside className={styles.note}><Sparkles size={20}/><div><strong>Sobre a leitura do MAGO</strong><p>Esta tela apresenta somente a análise disponível no dataset. Novas métricas e explicações aparecerão aqui quando forem fornecidas pelo motor de análise.</p></div></aside>
  </div>;
}

function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return <div className={styles.heading}><div><span className={styles.icon}>{icon}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div></div>;
}
