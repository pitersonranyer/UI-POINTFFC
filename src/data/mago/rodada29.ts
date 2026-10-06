import type { MagoRound, MagoTeam } from "@/types/mago-premium";

// Recorte editorial fornecido para a R29. xGA ausente não é estimado.
const indicadores: NonNullable<MagoRound["indicadores"]> = [
  { clube: "Athletico-PR", xgRodada: 1.57, xgTotal: 46.6, gols: 43, sg: 39.44, xga: 11.46, golsSofridos: 11 },
  { clube: "Fluminense", xgRodada: 1.57, xgTotal: 39.3, gols: 44, sg: 36 },
  { clube: "Botafogo", xgRodada: 1.57, xgTotal: 37.6, gols: 41, sg: 31.42 },
  { clube: "Vitória", xgRodada: 1.56, xgTotal: 27, gols: 28, sg: 40.74, xga: 13.57, golsSofridos: 12 },
  { clube: "Bragantino", xgRodada: 1.53, xgTotal: 32, gols: 33, sg: 39.68, xga: 10.38, golsSofridos: 14 },
  { clube: "Remo", xgRodada: 1.50, xgTotal: 32.9, gols: 32, sg: 29.09, xga: 25.99, golsSofridos: 28 },
  { clube: "Internacional", xgRodada: 1.45, xgTotal: 35.4, gols: 30, sg: 35.62 },
  { clube: "Palmeiras", xgRodada: 1.45, xgTotal: 41.9, gols: 47, sg: 34.13, xga: 10.32, golsSofridos: 9 },
  { clube: "Cruzeiro", xgRodada: 1.38, xgTotal: 39.2, gols: 42, sg: 34.19 },
  { clube: "Grêmio", xgRodada: 1.22, xgTotal: 31.7, gols: 30, sg: 22.27 },
  { clube: "Flamengo", xgRodada: 1.21, xgTotal: 43.7, gols: 55, sg: 34.90, xga: 13.73, golsSofridos: 13 },
  { clube: "Vasco", xgRodada: 1.16, xgTotal: 41.3, gols: 34, sg: 20.87, xga: 20.41, golsSofridos: 23 },
  { clube: "Bahia", xgRodada: 1.08, xgTotal: 42.3, gols: 43, sg: 23.64, xga: 21.73, golsSofridos: 21 },
  { clube: "São Paulo", xgRodada: 1.07, xgTotal: 35.2, gols: 32, sg: 25.04 },
  { clube: "Santos", xgRodada: 1.04, xgTotal: 33.4, gols: 41, sg: 30.22 },
  { clube: "Corinthians", xgRodada: 1.04, xgTotal: 30.9, gols: 29, sg: 23.60 },
  { clube: "Coritiba", xgRodada: 1.02, xgTotal: 29.8, gols: 37, sg: 20.40, xga: 20.27, golsSofridos: 24 },
  { clube: "Atlético-MG", xgRodada: .94, xgTotal: 34.6, gols: 36, sg: 21.03 },
  { clube: "Mirassol", xgRodada: .94, xgTotal: 35.2, gols: 33, sg: 21.39 },
  { clube: "Chapecoense", xgRodada: .91, xgTotal: 26.9, gols: 29, sg: 21.03, xga: 26.34, golsSofridos: 24 },
];

function equipe(clube: string, adversario: string, confianca: string, pelotao: string, analise: string, veredito: string): MagoTeam {
  const own = indicadores.find(item => item.clube === clube)!;
  const opponent = indicadores.find(item => item.clube === adversario)!;
  return { clube, adversario, sg: own.sg, xgAdversario: opponent.xgRodada, xga: own.xga, golsSofridos: own.golsSofridos, confianca, pelotao, analise, veredito };
}

// Preserve the official editorial order; never sort these choices by SG.
const topSg = [
  equipe("Vitória", "Chapecoense", "MUITO ALTA", "Pelotão 1", "A maior probabilidade de SG encontra o ataque com menor xG entre os jogos válidos. Probabilidade, fragilidade ofensiva do adversário e desempenho defensivo convergem.", "Principal SG do Mago na R29"),
  equipe("Athletico-PR", "Atlético-MG", "MUITO ALTA", "Pelotão 1", "Um dos pacotes defensivos mais fortes: alta probabilidade de SG, adversário com 0,94 xG, excelente xGA e mando favorável.", "Convergência defensiva muito forte"),
  equipe("Palmeiras", "Bahia", "ALTA", "Pelotão 1", "O Mago diverge do ranking bruto: mesmo com a oitava maior probabilidade de SG, o Palmeiras tem o melhor xGA do recorte disponível e apenas 9 gols sofridos. A força estrutural justifica o Top 3.", "Estrutura defensiva acima da ordem bruta de SG"),
  equipe("Bragantino", "Mirassol", "ALTA", "Pelotão 1", "Segunda maior probabilidade de SG, segundo melhor xGA e adversário com 0,94 xG. A volatilidade defensiva observada anteriormente reduz um pouco a confiança.", "Atenção à volatilidade · exposição controlada"),
  equipe("Internacional", "Corinthians", "ALTA", "Pelotão 1", "Boa combinação de probabilidade de SG e baixa expectativa ofensiva do adversário. O xGA do Internacional não foi fornecido neste recorte.", "Boa convergência entre SG e confronto"),
];
const alternativas = [
  equipe("Fluminense", "Coritiba", "BOA", "Pelotão 2", "Excelente combinação entre probabilidade de SG e baixa expectativa ofensiva do adversário.", "Alternativa forte de segundo bloco"),
  equipe("Cruzeiro", "São Paulo", "BOA", "Pelotão 2", "Boa alternativa para proteção e diversificação, diante de um adversário com 1,07 xG.", "Proteção e diversificação"),
  equipe("Flamengo", "Santos", "BOA COM RISCO", "Pelotão 2", "Boa defesa e confronto estatisticamente favorável. Os números permitem disputar o Pelotão 1, mas o Santos chega com 5 vitórias nos últimos 6 jogos: o contexto reduz a confiança.", "Opção forte, com alerta de contexto"),
  equipe("Botafogo", "Vasco", "BOA", "Pelotão 2", "Alternativa para diversificação, abaixo do núcleo principal.", "Diversificação defensiva"),
  equipe("Santos", "Flamengo", "BOA COM RISCO", "Pelotão 2", "O bom momento recente merece atenção, mas o ataque do Flamengo mantém o risco elevado para utilização defensiva.", "Usar principalmente como alternativa"),
];
const alertas: NonNullable<MagoRound["alertas"]> = [
  { ...alternativas[2], veredito: "Os números gostam. O momento pede cautela.", texto: "O Santos chega com 5 vitórias nos últimos 6 jogos. O Flamengo continua sendo uma boa opção defensiva, com 34,90% de SG, xGA de 13,73 e adversário com 1,04 xG. O excelente momento santista reduz a confiança em relação ao Pelotão 1; não é uma previsão de derrota do Flamengo." },
  { ...topSg[3], veredito: "Números excelentes, exposição controlada.", texto: "Poucas defesas combinam números tão favoráveis: 39,68% de SG, xGA de 10,38 e Mirassol com 0,94 xG. Mesmo assim, o Mago recomenda evitar concentração exagerada devido à volatilidade defensiva observada anteriormente." },
];

export const magoRodada29: MagoRound = {
  rodada: 29, pelotoesDoMago: true, indicadores, topSg, alternativas, alerta: alertas[0], alertas,
  teaserAlerta: { titulo: "Santos em alta", subtitulo: "Atenção ao SG do Flamengo", texto: "5 vitórias nos últimos 6 jogos.", detalhe: "O momento santista aumenta o risco do SG do Flamengo." },
  pelotoes: [
    { nome: "Pelotão 1", descricao: "Núcleo principal do Mago: convergência entre SG, xG adversário, força defensiva e contexto.", clubes: topSg.map(team => team.clube) },
    { nome: "Pelotão 2", descricao: "Alternativas fortes e diversificação, com atenção ao risco de cada confronto.", clubes: alternativas.map(team => team.clube) },
  ],
  escolhaTexto: "O Vitória lidera a probabilidade de SG da rodada, com 40,74%, e recebe a Chapecoense, dona do menor xG projetado entre os jogos válidos: 0,91. O xGA de 13,57 e os 12 gols sofridos no recorte reforçam a convergência entre SG, fragilidade ofensiva do adversário e desempenho defensivo.",
  cruzamentos: [
    { clube: "Palmeiras", resultado: "Top 3 do Mago pela força estrutural, apesar da oitava probabilidade de SG" },
    { clube: "Bragantino", resultado: "Pelotão 1 com desconto de confiança pela volatilidade" },
    { clube: "Flamengo", resultado: "Boa defesa no Pelotão 2 pelo excelente momento do Santos" },
  ],
  convergencia: [
    { rotulo: "Pelotão 1 do Mago", valor: topSg.map(team => team.clube).join(", ") },
    { rotulo: "Pelotão 2 do Mago", valor: alternativas.map(team => team.clube).join(", ") },
    { rotulo: "Força estrutural", valor: "Palmeiras no Top 3: melhor xGA do recorte e 9 gols sofridos" },
    { rotulo: "Contexto pede cautela", valor: "Flamengo contra um Santos com 5 vitórias nos últimos 6 jogos" },
  ],
  ataques: indicadores.slice(0, 8).map(team => ({ clube: team.clube, xg: team.xgRodada })),
  ataquesTexto: "Athletico-PR, Fluminense e Botafogo dividem a maior expectativa ofensiva da rodada com 1,57 xG. xG representa potencial ofensivo, não uma previsão exata de gols.",
  melhorCombinacao: "Athletico-PR",
  duelo: { titulo: "Santos x Flamengo", texto: "Santos: 1,04 xG e 30,22% SG. Flamengo: 1,21 xG, 34,90% SG e xGA de 13,73. Apesar dos bons números defensivos do Flamengo, as 5 vitórias do Santos nos últimos 6 jogos tornam este confronto um dos pontos de atenção da rodada. A leitura é de risco para o SG, não de derrota prevista." },
  // No projected scores were supplied for R29. Keep the valid agenda instead.
  placares: [],
  jogos: [
    { mandante: "RB Bragantino", visitante: "Mirassol", dia: "Quarta-feira (7)", horario: "19h30" },
    { mandante: "Internacional", visitante: "Corinthians", dia: "Quarta-feira (7)", horario: "19h30" },
    { mandante: "Remo", visitante: "Grêmio", dia: "Quarta-feira (7)", horario: "19h30" },
    { mandante: "Vitória", visitante: "Chapecoense", dia: "Quarta-feira (7)", horario: "20h00" },
    { mandante: "Botafogo", visitante: "Vasco", dia: "Quarta-feira (7)", horario: "20h30" },
    { mandante: "Cruzeiro", visitante: "São Paulo", dia: "Quarta-feira (7)", horario: "21h30" },
    { mandante: "Santos", visitante: "Flamengo", dia: "Quinta-feira (8)", horario: "19h30" },
    { mandante: "Athletico-PR", visitante: "Atlético-MG", dia: "Quinta-feira (8)", horario: "20h00" },
    { mandante: "Fluminense", visitante: "Coritiba", dia: "Quinta-feira (8)", horario: "21h30" },
    { mandante: "Palmeiras", visitante: "Bahia", dia: "Quinta-feira (8)", horario: "21h30" },
  ],
  resumo: [
    ...topSg.map((team, index) => ({ rotulo: `SG Nº ${index + 1}`, valor: team.clube })),
    { rotulo: "Ataques líderes", valor: "Athletico-PR, Fluminense e Botafogo — 1,57 xG" },
    { rotulo: "Melhor combinação ataque + defesa", valor: "Athletico-PR" },
    { rotulo: "Alerta de contexto", valor: "Santos em alta aumenta o risco do SG do Flamengo" },
    { rotulo: "Exposição controlada", valor: "Bragantino: números excelentes, atenção à volatilidade" },
  ],
};
