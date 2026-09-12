import { ArrowDown, ArrowUpRight, Flame, Orbit, ShieldCheck, Sparkles, Swords, Target, TriangleAlert, Trophy, WandSparkles } from "lucide-react";
import React, { type ReactNode } from "react";
import type { MagoRound, MagoTeam } from "@/types/mago-premium";
import styles from "./MagoPage.module.css";

const number = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SectionTitle({ id, icon, title, subtitle }: { id: string; icon: ReactNode; title: string; subtitle?: string }) {
  return <header className={styles.sectionTitle}><span aria-hidden="true">{icon}</span><div><h2 id={id}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></header>;
}

function Confidence({ value }: { value: string }) {
  const positive = ["MUITO ALTA", "ALTA", "BOA"].includes(value);
  return <span className={`${styles.confidence} ${positive ? styles.positive : styles.caution}`}><span aria-hidden="true">●</span> Confiança: {value}</span>;
}

function TeamMetrics({ team }: { team: MagoTeam }) {
  return <dl className={styles.metrics}><div><dt>Adversário</dt><dd>{team.adversario}</dd></div><div><dt>xG adversário</dt><dd>{team.xgAdversario === null ? "Não informado" : number.format(team.xgAdversario)}</dd></div></dl>;
}

export function MagoHero({ rodada }: { rodada: number }) {
  return <header className={styles.hero}>
    <div className={styles.heroCopy}><div className={styles.eyebrow}><WandSparkles size={16} aria-hidden="true" /> POINT FANTASY INTELLIGENCE <span>RODADA {rodada}</span></div>
      <h1>Mago do <span>Point Fantasy</span></h1><p className={styles.subtitle}>Inteligência para a sua rodada</p>
      <p className={styles.description}>Probabilidades, xG, desempenho defensivo e análise especializada cruzados para encontrar as melhores oportunidades da rodada.</p>
      <a href="#top-sg" className={styles.heroLink}>Explore a análise <ArrowDown size={16} aria-hidden="true" /></a>
    </div>
    <div className={styles.wizard} aria-hidden="true"><div className={styles.orbit} /><div className={styles.orbitInner} /><div className={styles.wizardSeal}><WandSparkles strokeWidth={1} /><Sparkles className={styles.spark} /></div><span className={styles.signal}>DADOS · VISÃO · ESTRATÉGIA</span></div>
  </header>;
}

export function MagoTopPick({ data }: { data: MagoRound }) {
  const team = data.topSg[0];
  return <section className={styles.topPick} aria-labelledby="escolha-mago"><div>
    <p className={styles.eyebrow}><Flame size={17} aria-hidden="true" /> ESCOLHA DO MAGO</p><h2 id="escolha-mago">{team.clube}</h2><Confidence value={team.confianca} /><p className={styles.pickText}>{data.escolhaTexto}</p><div className={styles.verdict}><ShieldCheck size={18} aria-hidden="true" />{team.veredito}</div>
    </div><div className={styles.pickNumbers}><span className={styles.metricLabel}>PROBABILIDADE DE SG</span><strong className={styles.bigNumber}>{number.format(team.sg)}<small>%</small></strong><TeamMetrics team={team} /><span className={styles.pelotao}>Especialistas: {team.pelotao ?? "Não informado"}</span></div>
  </section>;
}

function SgCard({ team, position }: { team: MagoTeam; position?: number }) {
  return <article className={styles.sgCard}><header>{position && <span className={styles.position}>{String(position).padStart(2, "0")}</span>}<h3>{team.clube}</h3><ShieldCheck size={18} aria-hidden="true" /></header>
    <div className={styles.sgValue}>{number.format(team.sg)}<small>% <span>SG</span></small></div>
    <div className={styles.probabilityTrack} aria-hidden="true"><span style={{ width: `${team.sg}%` }} /></div>
    <Confidence value={team.confianca} /><TeamMetrics team={team} />{team.pelotao && <span className={styles.pelotao}>{team.pelotao}</span>}<p className={styles.cardVerdict}>{team.veredito}</p>
  </article>;
}

export function MagoSgRanking({ teams }: { teams: MagoTeam[] }) {
  return <section aria-labelledby="top-sg" className={styles.section}><SectionTitle id="top-sg" icon={<ShieldCheck />} title="Top SG da rodada" subtitle="As cinco escolhas prioritárias do Mago, em ordem de recomendação." /><div className={styles.sgGrid}>{teams.map((team, index) => <SgCard key={team.clube} team={team} position={index + 1} />)}</div><p className={styles.note}>SG = não sofrer gols. xG = expectativa de gols. Campos não fornecidos para a R27 aparecem como não informados.</p></section>;
}

export function MagoAlternatives({ teams }: { teams: MagoTeam[] }) {
  return <section aria-labelledby="alternativas" className={styles.section}><SectionTitle id="alternativas" icon={<ArrowUpRight />} title="Alternativas no radar" subtitle="Outros caminhos para compor sua defesa." /><div className={styles.alternatives}>{teams.map(team => <SgCard key={team.clube} team={team} />)}</div></section>;
}

export function MagoAlert({ team }: { team: MagoRound["alerta"] }) {
  return <section className={styles.alert} aria-labelledby="alerta-mago"><div><p className={styles.eyebrow}><TriangleAlert size={18} aria-hidden="true" /> ALERTA DO MAGO</p><h2 id="alerta-mago">{team.clube}</h2><p>{team.texto}</p><strong className={styles.alertVerdict}>{team.veredito}</strong></div><div><span className={styles.metricLabel}>PROBABILIDADE DE SG</span><strong className={styles.alertNumber}>{number.format(team.sg)}%</strong><TeamMetrics team={team} /></div></section>;
}

export function MagoAttackRanking({ data }: { data: MagoRound }) {
  const best = data.ataques[0];
  return <section aria-labelledby="ataques" className={styles.section}><SectionTitle id="ataques" icon={<Swords />} title="Melhores ataques" subtitle="Onde o Mago enxerga mais potencial ofensivo." /><div className={styles.attackLayout}><ol className={styles.attackList}>{data.ataques.map((team, index) => <li key={team.clube}><span className={styles.attackPosition}>{String(index + 1).padStart(2, "0")}</span><div><strong>{team.clube}</strong><div className={styles.attackTrack} aria-hidden="true"><span style={{ width: `${team.xg / best.xg * 100}%` }} /></div></div><b>{number.format(team.xg)} <small>xG</small></b></li>)}</ol><div className={styles.attackHighlights}><article><Swords aria-hidden="true" /><p>Melhor ataque projetado</p><h3>{best.clube}</h3><strong>{number.format(best.xg)} <small>xG</small></strong></article><article><Trophy aria-hidden="true" /><p>Melhor combinação ataque + defesa</p><h3>{data.melhorCombinacao}</h3><span>Equilíbrio para a sua escalação</span></article></div></div></section>;
}

export function MagoPredictions({ data }: { data: MagoRound }) {
  return <section aria-labelledby="placares" className={styles.section}><SectionTitle id="placares" icon={<Orbit />} title="Placares do Mago" subtitle="Projeções da rodada. São cenários estimados, não garantias de resultado." /><div className={styles.predictions}>{data.placares.map(game => {
    const sg = game.golsMandante === 0 || game.golsVisitante === 0;
    return <article key={game.mandante} className={`${styles.prediction} ${sg ? styles.predictedSg : ""}`}><span className={styles.predictionLabel}>{sg ? <><ShieldCheck size={13} aria-hidden="true" /> Projeção com SG</> : "Placar projetado"}</span><div className={styles.score}><span>{game.mandante}</span><strong>{game.golsMandante} <small>x</small> {game.golsVisitante}</strong><span>{game.visitante}</span></div></article>;
  })}</div></section>;
}

export function MagoSummary({ data }: { data: MagoRound }) {
  return <section className={styles.summary} aria-labelledby="resumo"><SectionTitle id="resumo" icon={<WandSparkles />} title={`Resumo do Mago — R${data.rodada}`} subtitle="A leitura da rodada, em um só lugar." /><dl>{data.resumo.map(item => <div key={item.rotulo}><dt>{item.rotulo}</dt><dd>{item.valor}</dd></div>)}</dl><div className={styles.convergence}><h3>Convergência com especialistas</h3><dl>{data.convergencia.map(item => <div key={item.rotulo}><dt>{item.rotulo}</dt><dd>{item.valor}</dd></div>)}</dl></div></section>;
}

export function MagoExpertGroups({ data }: { data: MagoRound }) {
  const teams = [...data.topSg, ...data.alternativas, data.alerta];
  return <section className={styles.section} aria-labelledby="pelotoes">
    <SectionTitle id="pelotoes" icon={<Target />} title="Pelotões dos Especialistas" subtitle="As equipes destacadas pelos especialistas antes do cruzamento do Mago." />
    <div className={styles.expertGroups}>{data.pelotoes.map((group, index) => <article key={group.nome} className={`${styles.expertGroup} ${index === 0 ? styles.primaryGroup : ""}`}>
      <h3>{index === 0 ? <Target size={19} aria-hidden="true" /> : <Swords size={19} aria-hidden="true" />}{group.nome}</h3>
      <p>{group.descricao}</p>
      <ul className={styles.expertChips}>{group.clubes.map(clube => <li key={clube}><strong>{clube}</strong><span>{group.nome}</span></li>)}</ul>
    </article>)}</div>
    <div className={styles.crossing}>
      <h3><WandSparkles size={19} aria-hidden="true" /> Cruzamento do Mago</h3>
      <p>O Mago não replica os Pelotões. Ele cruza a leitura dos especialistas com os dados estatísticos da rodada.</p>
      <p>O ranking final pode seguir outra ordem: SG, xG, xGA, mando e contexto também entram na análise.</p>
      <div className={styles.crossingExamples}>{data.cruzamentos.map(example => {
        const team = teams.find(item => item.clube === example.clube);
        if (!team) return null;
        const pelotao = data.pelotoes.find(group => group.clubes.includes(team.clube))?.nome;
        return <article key={example.clube}><h4>{team.clube}</h4><p>{pelotao} + {number.format(team.sg)}% SG + {team.adversario} com {team.xgAdversario === null ? "xG não informado" : `${number.format(team.xgAdversario)} xG`}</p><strong>Resultado: {example.resultado}</strong></article>;
      })}</div>
    </div>
  </section>;
}

export function MagoPage({ data }: { data: MagoRound }) {
  const withGroup = (team: MagoTeam): MagoTeam => ({ ...team, pelotao: data.pelotoes.find(group => group.clubes.includes(team.clube))?.nome ?? team.pelotao });
  return <div className={styles.page}><div className={styles.shell}><MagoHero rodada={data.rodada} /><p className={styles.preview}><Sparkles size={14} aria-hidden="true" /> Prévia editorial · Dados demonstrativos da rodada {data.rodada}</p><MagoTopPick data={data} /><MagoSgRanking teams={data.topSg.map(withGroup)} /><MagoAlternatives teams={data.alternativas.map(withGroup)} /><MagoAlert team={data.alerta} /><MagoExpertGroups data={data} /><MagoAttackRanking data={data} /><MagoPredictions data={data} /><MagoSummary data={data} /><footer className={styles.footer}><WandSparkles size={18} aria-hidden="true" /><span>Inteligência para decidir. O futebol continua imprevisível.</span><a href="#top-sg">Voltar ao ranking ↑</a></footer></div></div>;
}
