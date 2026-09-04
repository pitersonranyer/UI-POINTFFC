import { BarChart3, Flame, Goal, ShieldCheck, Sparkles, Target, Trophy, WandSparkles } from "lucide-react";
import type { AnaliseSgItem, AnaliseSgRodada, ClassificacaoSg, ConfiancaSg, DestaqueOfensivo, MelhorAtaque, ResumoMago } from "@/types/mago";
import styles from "./AnaliseSg.module.css";

const percent = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const classificationClass: Record<ClassificacaoSg, string> = { "MUITO FORTE": styles.veryStrong, FORTE: styles.strong, "FORTE / DIFERENCIAL": styles.differential, "BOA OPÇÃO": styles.good, DIFERENCIAL: styles.differential, OUSADO: styles.coverage, COBERTURA: styles.coverage };
const confidenceIcon: Record<ConfiancaSg, string> = { "MUITO ALTA": "🔥", ALTA: "🔥", "ALTA, COM RISCO": "🟢", BOA: "🟢", "MÉDIA": "🟡", BAIXA: "⚪" };

export function AnaliseSg({ data }: { data: AnaliseSgRodada }) {
  return <main className="page-shell">
    <header className={styles.hero}>
      <div><span className={styles.round}><Sparkles size={15} /> RODADA {data.rodada}</span><p className="eyebrow">Leitura do Mago</p><h1>ANÁLISE SG <em>— RODADA {data.rodada}</em></h1><p>{data.introducao}</p></div>
      <aside><ShieldCheck /><span><small>Principal candidato a SG</small><strong>{data.rankingFinal[0]}</strong><b>{percent.format(data.analises[0]?.probabilidadeSg ?? 0)}%</b></span></aside>
    </header>

    <BlocoTimes titulo="Núcleo principal de SG" times={data.nucleoPrincipal} principal />

    <section className={styles.section}>
      <SectionTitle icon={<BarChart3 />} title="Análise detalhada" subtitle={`${data.analises.length} clubes avaliados para a rodada ${data.rodada}`} />
      <div className={styles.cards}>{data.analises.map((item) => <AnaliseSgCard key={item.clube} item={item} />)}</div>
    </section>

    <div className={styles.summaryGrid}>
      <RankingSg times={data.rankingFinal} rodada={data.rodada} />
      <BlocoTimes titulo="Segundo bloco" times={data.segundoBloco} />
    </div>

    <MelhoresAtaques ataques={data.melhoresAtaques} />
    <DestaqueOfensivoMago destaque={data.destaqueOfensivo} />
    <PlacaresImaginarios rodada={data.rodada} placares={data.placaresRodada} />
    <ResumoDoMago resumo={data.resumoMago} />
    <footer className={styles.note}><Sparkles /><p><strong>Análise do Mago</strong><span>Conteúdo editorial alimentado manualmente para esta rodada. Probabilidades e placares são projeções, não garantias de resultado.</span></p></footer>
  </main>;
}

export function AnaliseSgCard({ item }: { item: AnaliseSgItem }) {
  return <article className={styles.card}>
    <header><span className={styles.position}>{item.posicao}</span><div><h3>{item.clube}</h3><span className={`${styles.badge} ${classificationClass[item.classificacao]}`}>{item.classificacao}</span></div></header>
    <dl><div><dt><ShieldCheck />Probabilidade de SG</dt><dd>{percent.format(item.probabilidadeSg)}%</dd></div><div><dt><Target />Adversário</dt><dd>{item.adversario}</dd></div><div><dt><BarChart3 />xG do {item.adversario}</dt><dd>{percent.format(item.xgAdversario)}</dd></div><div><dt><Sparkles />Especialistas</dt><dd>{item.especialistas}</dd></div></dl>
    <div className={styles.analysis}>{item.texto.map((paragrafo) => <p key={paragrafo}>{paragrafo}</p>)}</div>
    <div className={styles.prediction}><Goal /><span><small>Placar imaginário</small><strong>{item.placarImaginario}</strong></span></div>
    <div className={styles.confidence}><span aria-hidden>{confidenceIcon[item.confianca]}</span> Confiança do Mago: <strong>{item.confianca}</strong></div>
  </article>;
}

export function RankingSg({ times, rodada }: { times: string[]; rodada: number }) {
  const medals = ["🥇", "🥈", "🥉"];
  return <section className={`${styles.panel} ${styles.ranking}`}><SectionTitle icon={<Trophy />} title={`Ranking final do Mago — SG R${rodada}`} /><ol>{times.map((team, index) => <li key={team}><span>{medals[index] ?? index + 1}</span><strong>{team}</strong>{index < 3 && <small>Top {index + 1}</small>}</li>)}</ol></section>;
}

export function BlocoTimes({ titulo, times, principal = false }: { titulo: string; times: string[]; principal?: boolean }) {
  return <section className={`${styles.teamBlock} ${principal ? styles.mainBlock : ""}`}><header><span>{principal ? <ShieldCheck /> : <Target />}</span><div><h2>{titulo}</h2>{principal && <p>Base prioritária para compor sua estratégia de SG</p>}</div></header><div>{times.map((team) => <span key={team}>{team}</span>)}</div></section>;
}

export function PlacaresImaginarios({ rodada, placares }: { rodada: number; placares: string[] }) {
  return <section className={styles.section}><SectionTitle icon={<Goal />} title="Placares imaginários do Mago" subtitle={`Projeções editoriais para a rodada ${rodada}`} /><div className={styles.scores}>{placares.map((score, index) => <div key={score}><span>{String(index + 1).padStart(2, "0")}</span><strong>{score}</strong></div>)}</div></section>;
}

export function MelhoresAtaques({ ataques }: { ataques: MelhorAtaque[] }) {
  const medals = ["🥇", "🥈", "🥉"];
  return <section className={styles.section}><SectionTitle icon={<Flame />} title="Melhores ataques da rodada" /><ol className={styles.attackRanking}>{ataques.map((ataque, index) => <li key={ataque.clube}><span>{medals[index] ?? ataque.posicao}</span><strong>{ataque.clube}</strong><b>{percent.format(ataque.xg)} <small>xG</small></b></li>)}</ol></section>;
}

export function DestaqueOfensivoMago({ destaque }: { destaque: DestaqueOfensivo }) {
  return <section className={styles.offensiveHighlight}><header><span><Flame /></span><div><small>Destaque ofensivo do Mago</small><h2>{destaque.clube}</h2></div></header><div>{destaque.texto.map((paragrafo) => <p key={paragrafo}>{paragrafo}</p>)}</div></section>;
}

export function ResumoDoMago({ resumo }: { resumo: ResumoMago }) {
  const itens = [
    ["SG mais forte", resumo.sgMaisForte], ["Segundo SG mais forte", resumo.segundoSg],
    ["Terceiro SG", resumo.terceiroSg], ["Melhor diferencial defensivo", resumo.diferencialDefensivo],
    ["Defesa forte com maior risco", resumo.defesaForteMaiorRisco], ["Melhores ataques", resumo.melhoresAtaques.join(", ")],
    ["Destaque ofensivo", resumo.destaqueOfensivo],
  ];
  return <section className={styles.section}><SectionTitle icon={<WandSparkles />} title="Resumo do Mago" /><dl className={styles.wizardSummary}>{itens.map(([rotulo, valor]) => <div key={rotulo}><dt>{rotulo}</dt><dd>{valor}</dd></div>)}</dl></section>;
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return <header className={styles.sectionTitle}><span>{icon}</span><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></header>;
}
