import type { MagoRound, MagoTeam } from "@/types/mago-premium";

// Dados fornecidos para a R30 de 2026. xGA: recorte acumulado por mando,
// disponível somente para dez clubes. SG: Gato Mestre.
const indicadores: NonNullable<MagoRound["indicadores"]> = [
  { clube: "Flamengo", xgRodada: 1.83, xgTotal: 43.7, gols: 55, sg: 39.29, xga: 9.24, golsSofridos: 10 },
  { clube: "Vasco", xgRodada: 1.81, xgTotal: 44.4, gols: 36, sg: 36.54 },
  { clube: "São Paulo", xgRodada: 1.76, xgTotal: 35.3, gols: 33, sg: 40.51, xga: 11.67, golsSofridos: 12 },
  { clube: "Bahia", xgRodada: 1.76, xgTotal: 42.3, gols: 43, sg: 35.71, xga: 12.22, golsSofridos: 14 },
  { clube: "Bragantino", xgRodada: 1.60, xgTotal: 34.4, gols: 34, sg: 33.75, xga: 12.15, golsSofridos: 15 },
  { clube: "Atlético-MG", xgRodada: 1.50, xgTotal: 34.6, gols: 37, sg: 26.09 },
  { clube: "Botafogo", xgRodada: 1.50, xgTotal: 37.9, gols: 42, sg: 25.21 },
  { clube: "Grêmio", xgRodada: 1.47, xgTotal: 33.4, gols: 31, sg: 26.92, xga: 24.10, golsSofridos: 16 },
  { clube: "Coritiba", xgRodada: 1.37, xgTotal: 29.8, gols: 37, sg: 22.31 },
  { clube: "Palmeiras", xgRodada: 1.36, xgTotal: 41.9, gols: 47, sg: 40.93, xga: 10.32, golsSofridos: 9 },
  { clube: "Athletico-PR", xgRodada: 1.35, xgTotal: 46.6, gols: 43, sg: 25.70 },
  { clube: "Chapecoense", xgRodada: 1.35, xgTotal: 27.4, gols: 29, sg: 25.72 },
  { clube: "Internacional", xgRodada: 1.33, xgTotal: 37.5, gols: 32, sg: 22.76 },
  { clube: "Santos", xgRodada: 1.32, xgTotal: 33.4, gols: 43, sg: 22.03 },
  { clube: "Cruzeiro", xgRodada: 1.09, xgTotal: 41.3, gols: 44, sg: 20.57, xga: 24.55, golsSofridos: 24 },
  { clube: "Mirassol", xgRodada: 1.04, xgTotal: 36.9, gols: 34, sg: 17.09 },
  { clube: "Remo", xgRodada: 1.01, xgTotal: 34.8, gols: 33, sg: 16.55, xga: 24.63, golsSofridos: 28 },
  { clube: "Fluminense", xgRodada: .91, xgTotal: 39.3, gols: 44, sg: 16.00, xga: 25.69, golsSofridos: 22 },
  { clube: "Corinthians", xgRodada: .90, xgTotal: 33.1, gols: 30, sg: 25.73 },
  { clube: "Vitória", xgRodada: .89, xgTotal: 29.8, gols: 32, sg: 17.68, xga: 26.37, golsSofridos: 30 },
];

function equipe(clube: string, adversario: string, pelotao: string, analise: string, veredito: string): MagoTeam {
  const own = indicadores.find(item => item.clube === clube)!;
  const opponent = indicadores.find(item => item.clube === adversario)!;
  return { clube, adversario, sg: own.sg, xgAdversario: opponent.xgRodada, xga: own.xga, golsSofridos: own.golsSofridos, confianca: pelotao === "Pelotão 1" ? "ALTA" : "BOA COM RISCO", pelotao, analise, veredito };
}

// Ordem editorial do POINT FFC; não ordenar automaticamente pela probabilidade.
const topSg = [
  equipe("Palmeiras", "Corinthians", "Pelotão 1", "O Palmeiras reúne a maior probabilidade de SG da rodada, excelente estrutura defensiva e um adversário com baixa expectativa de gols. É a escolha inicial do Mago, condicionada à confirmação da escalação.", "Escolha do Mago · acompanhar mudanças na equipe titular"),
  equipe("São Paulo", "Vitória", "Pelotão 1", "O São Paulo apresenta uma das combinações mais favoráveis da rodada: elevada probabilidade de SG, adversário com o menor xG projetado e bons indicadores defensivos. Está praticamente empatado com o Palmeiras na disputa pela primeira posição.", "Convergência defensiva forte"),
  equipe("Flamengo", "Fluminense", "Pelotão 1", "O Flamengo possui o melhor xGA do recorte informado e enfrenta um adversário com baixa projeção ofensiva. Entretanto, o clássico exige cautela e impede que a probabilidade seja tratada como garantia.", "Clássico e possíveis mudanças na escalação"),
  equipe("Vasco", "Remo", "Pelotão 1", "O Vasco chega em boa fase e encontra um adversário com expectativa ofensiva relativamente baixa. Além do SG, os laterais podem oferecer potencial ofensivo: o Vasco tem 1,81 xG na rodada. A disponibilidade dos titulares precisa ser confirmada.", "Verificar departamento médico e sistema defensivo"),
  equipe("Bahia", "Mirassol", "Pelotão 1", "O Bahia combina mando de campo, boa projeção ofensiva (1,76 xG) e indicadores defensivos favoráveis. É uma alternativa interessante para diversificar a carteira sem abrir mão de uma probabilidade competitiva de SG.", "Diversificação com SG competitivo"),
];
const alternativas = [
  equipe("Bragantino", "Cruzeiro", "Pelotão 2", "xGA de 12,15, mas enfrenta o Cruzeiro. A volatilidade observada na rodada anterior recomenda cautela.", "Exposição controlada"),
  equipe("Grêmio", "Internacional", "Pelotão 2", "Gre-Nal, confronto com risco contextual elevado.", "Cautela no clássico"),
  equipe("Atlético-MG", "Santos", "Pelotão 2", "Enfrenta o Santos, que vem demonstrando força ofensiva.", "Atenção ao ataque santista"),
  equipe("Athletico-PR", "Chapecoense", "Pelotão 2", "Enfrenta a Chapecoense fora de casa. A probabilidade de SG caiu para 25,70%, muito abaixo dos 39,44% da R29.", "SG abaixo da rodada anterior"),
  equipe("Botafogo", "Coritiba", "Pelotão 2", "Enfrenta o Coritiba fora de casa; possibilidade de scouts ofensivos, mas SG pouco confortável.", "Alternativa com risco"),
];
const alertas: NonNullable<MagoRound["alertas"]> = [
  { ...topSg[0], texto: "Melhor probabilidade de SG, mas a definição dos titulares pode alterar a confiança na escolha.", veredito: "Risco de escalação" },
  { ...topSg[2], texto: "Flamengo x Fluminense: apesar da diferença estatística entre os ataques projetados, o contexto do clássico exige cuidado.", veredito: "Clássico pede cautela" },
  { ...topSg[3], texto: "A fase positiva favorece a análise, mas precisamos considerar possíveis ausências defensivas. Bom confronto, atenção aos titulares.", veredito: "Confirmar jogadores disponíveis" },
  { ...alternativas[0], texto: "A equipe apresenta bons indicadores defensivos, mas sofreu gol na R29 mesmo diante de um cenário estatístico favorável.", veredito: "Volatilidade" },
];

export const magoRodada30: MagoRound = {
  rodada: 30, pelotoesDoMago: true, indicadores, topSg, alternativas, alerta: alertas[0], alertas,
  editorial: {
    titulo: "Rodada 30: a rodada da incerteza",
    subtitulo: "Números fortes, três clássicos e escalações sob observação.",
    mercado: "O mercado do Cartola fecha no sábado, 10/10, às 18h (Brasília). Oito partidas acontecem depois de sábado: cinco no domingo e três na segunda-feira. O intervalo até as partidas aumenta o risco de mudanças nas escalações. Coritiba x Botafogo, Chapecoense x Athletico-PR e Bragantino x Cruzeiro exigem atenção especial aos titulares.",
    visao: [
      "A Rodada 30 apresenta uma combinação desafiadora para quem busca saldo de gols no Cartola. Palmeiras e São Paulo lideram as probabilidades de SG, enquanto Flamengo, Vasco e Bahia completam o grupo de maior destaque estatístico.",
      "Mas os números não contam toda a história. Com três clássicos e partidas até segunda-feira, o mercado fecha muito antes de conhecermos todas as escalações.",
      "Nesta rodada, o Mago combina expectativa de gols, estrutura defensiva, momento dos adversários e segurança de escalação para identificar oportunidades sem ignorar os riscos.",
      "A estratégia é clara: valorizar a convergência dos indicadores, controlar a exposição e evitar confiança excessiva em escalações ainda indefinidas.",
    ],
    veredito: [
      "Palmeiras e São Paulo apresentam a combinação estatística mais convincente da Rodada 30. O Flamengo também reúne números fortes, mas o clássico recomenda prudência. Vasco e Bahia completam o grupo prioritário, enquanto o Bragantino aparece como alternativa de maior risco.",
      "Com o mercado fechando antes das oito partidas de domingo e segunda-feira, a segurança da escalação ganha importância especial.",
      "Nesta rodada, o Mago prefere confiar na convergência dos indicadores, sem transformar probabilidades em certezas.",
    ],
    estrategia: [{ clube: "Palmeiras", quantidade: 6 }, { clube: "São Paulo", quantidade: 6 }, { clube: "Flamengo", quantidade: 5 }, { clube: "Vasco", quantidade: 5 }, { clube: "Bahia", quantidade: 5 }, { clube: "Bragantino", quantidade: 3 }],
  },
  teaserAlerta: { titulo: "Escalações sob observação", subtitulo: "Palmeiras: escolha inicial", texto: "Mercado fecha sábado, 10/10, às 18h.", detalhe: "Confirme os titulares antes de escalar; jogos até segunda-feira." },
  escolhaTexto: topSg[0].analise!,
  pelotoes: [{ nome: "Pelotão 1", descricao: "Prioridades editoriais do Mago, condicionadas à confirmação dos titulares.", clubes: topSg.map(team => team.clube) }, { nome: "Pelotão 2", descricao: "Alternativas para diversificação, com risco contextual maior.", clubes: alternativas.map(team => team.clube) }],
  cruzamentos: [{ clube: "Palmeiras", resultado: "Escolha inicial, com atenção à escalação" }, { clube: "Flamengo", resultado: "Melhor xGA do recorte, com cautela no clássico" }, { clube: "Bragantino", resultado: "Alternativa de maior risco no Pelotão 2" }],
  convergencia: [{ rotulo: "Prioridades", valor: "Palmeiras e São Paulo" }, { rotulo: "Complementos", valor: "Flamengo, Vasco e Bahia" }, { rotulo: "Segurança de escalação", valor: "Confirmar titulares: jogos até segunda-feira" }],
  ataques: indicadores.slice(0, 7).map(team => ({ clube: team.clube, xg: team.xgRodada })),
  ataquesTexto: "Poder de fogo: Flamengo (1,83), Vasco (1,81), São Paulo e Bahia (1,76) lideram o xG projetado da R30. Este ranking ofensivo é independente das probabilidades de SG.",
  melhorCombinacao: "Flamengo",
  jogos: [
    { mandante: "Vasco", visitante: "Remo", dia: "Sábado, 10/10", horario: "18h" },
    { mandante: "São Paulo", visitante: "Vitória", dia: "Sábado, 10/10", horario: "21h" },
    { mandante: "Atlético-MG", visitante: "Santos", dia: "Domingo, 11/10", horario: "16h" },
    { mandante: "Flamengo", visitante: "Fluminense", dia: "Domingo, 11/10", horario: "17h30" },
    { mandante: "Palmeiras", visitante: "Corinthians", dia: "Domingo, 11/10", horario: "17h30" },
    { mandante: "Grêmio", visitante: "Internacional", dia: "Domingo, 11/10", horario: "17h30" },
    { mandante: "Bahia", visitante: "Mirassol", dia: "Domingo, 11/10", horario: "19h30" },
    { mandante: "Coritiba", visitante: "Botafogo", dia: "Segunda-feira, 12/10", horario: "16h" },
    { mandante: "Chapecoense", visitante: "Athletico-PR", dia: "Segunda-feira, 12/10", horario: "19h30" },
    { mandante: "Bragantino", visitante: "Cruzeiro", dia: "Segunda-feira, 12/10", horario: "21h" },
  ],
  placares: [
    { mandante: "Vasco", visitante: "Remo", golsMandante: 2, golsVisitante: 0 },
    { mandante: "São Paulo", visitante: "Vitória", golsMandante: 2, golsVisitante: 0 },
    { mandante: "Atlético-MG", visitante: "Santos", golsMandante: 2, golsVisitante: 1 },
    { mandante: "Flamengo", visitante: "Fluminense", golsMandante: 2, golsVisitante: 0 },
    { mandante: "Palmeiras", visitante: "Corinthians", golsMandante: 2, golsVisitante: 0 },
    { mandante: "Grêmio", visitante: "Internacional", golsMandante: 1, golsVisitante: 1 },
    { mandante: "Bahia", visitante: "Mirassol", golsMandante: 2, golsVisitante: 0 },
    { mandante: "Coritiba", visitante: "Botafogo", golsMandante: 1, golsVisitante: 1 },
    { mandante: "Chapecoense", visitante: "Athletico-PR", golsMandante: 1, golsVisitante: 1 },
    { mandante: "Bragantino", visitante: "Cruzeiro", golsMandante: 2, golsVisitante: 1 },
  ],
  resumo: topSg.map((team, index) => ({ rotulo: `SG Nº ${index + 1}`, valor: team.clube })),
};
