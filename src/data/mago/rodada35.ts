import type { MagoRound } from "@/types/mago-premium";

// Dados fornecidos no briefing da Rodada 35 de 2026. A ordem dos pelotões é editorial.
export const magoRodada35: MagoRound = {
  rodada: 35,
  pelotoesDoMago: true,
  editorial: {
    titulo: "Mago POINT FFC — Rodada 35",
    tituloCompleto: true,
    subtitulo: "Rodada sem SG seguro! Quem vai surpreender?",
    visao: [
      "A Rodada 35 apresenta um cenário desafiador para o Cartola: nenhuma equipe alcança 40% de probabilidade de SG nas projeções disponíveis.",
      "Mais do que apostar nas defesas favoritas, será importante identificar jogadores com potencial de desarmes, defesas e participação ofensiva.",
      "O Mago analisou os confrontos e selecionou suas principais oportunidades."
    ],
    mercado: "",
    veredito: [
      "São Paulo, Corinthians e Flamengo são nossas principais escolhas defensivas. Mas o ataque do Remo pode ser a grande oportunidade fora da caixa da Rodada 35.",
      "Em uma rodada sem favoritos absolutos para SG, os scouts individuais podem ser decisivos."
    ],
    estrategia: []
  },
  topSg: [
    {
      clube: "São Paulo", adversario: "Fluminense", sg: 35.34, xgAdversario: 1.03,
      pelotao: "Pelotão 1", analise: "Enfrenta o Fluminense, que apresenta apenas 1,03 xG na rodada.",
      veredito: "Escolha editorial · projeção, não garantia."
    },
    {
      clube: "Corinthians", adversario: "Botafogo", sg: 34.68, xgAdversario: 1.07,
      pelotao: "Pelotão 1", analise: "Recebe o Botafogo, com 1,07 xG projetado.",
      veredito: "Escolha editorial · projeção, não garantia."
    },
    {
      clube: "Flamengo", adversario: "Athletico-PR", sg: 32.90, xgAdversario: 1.10,
      pelotao: "Pelotão 1", analise: "Enfrenta o Athletico-PR, com 1,10 xG.",
      veredito: "Escolha editorial · projeção, não garantia."
    },
    {
      clube: "Vasco", adversario: "Internacional", sg: 33.65, xgAdversario: 1.10,
      pelotao: "Pelotão 1", analise: "Recebe o Internacional, com 1,10 xG.",
      veredito: "Escolha editorial · projeção, não garantia."
    },
    {
      clube: "Vitória", adversario: "RB Bragantino", sg: 35.71, xgAdversario: null,
      pelotao: "Pelotão 1", analise: "Lidera a projeção estatística de SG informada, mas exige cautela diante do Bragantino.",
      veredito: "Escolha editorial · projeção, não garantia."
    }
  ],
  alternativas: [
    {
      clube: "Mirassol", adversario: "Adversário não informado", sg: 32.15, xgAdversario: null,
      pelotao: "Pelotão 2", analise: "Alternativa defensiva fora das escolhas mais tradicionais.",
      veredito: "Diferencial editorial · projeção, não garantia."
    },
    {
      clube: "Remo", adversario: "Chapecoense", sg: 28.79, xgAdversario: null,
      pelotao: "Pelotão 2", analise: "Equipe especialmente interessante no ataque; lidera o xG da rodada.",
      veredito: "Diferencial editorial · projeção, não garantia."
    },
    {
      clube: "Palmeiras", adversario: "Cruzeiro", sg: 30.82, xgAdversario: null,
      pelotao: "Pelotão 2", analise: "Alternativa complementar para diversificar a defesa.",
      veredito: "Diferencial editorial · projeção, não garantia."
    },
    {
      clube: "Cruzeiro", adversario: "Palmeiras", sg: 29.78, xgAdversario: null,
      pelotao: "Pelotão 2", analise: "Alternativa complementar para diversificar a defesa.",
      veredito: "Diferencial editorial · projeção, não garantia."
    },
    {
      clube: "Grêmio", adversario: "Bahia", sg: 23.11, xgAdversario: null,
      pelotao: "Pelotão 2", analise: "Alternativa defensiva com potencial ofensivo relevante na rodada.",
      veredito: "Diferencial editorial · projeção, não garantia."
    }
  ],
  alerta: {
    clube: "Remo", adversario: "Chapecoense", sg: 28.79, xgAdversario: null,
    pelotao: "Pelotão 2", veredito: "Oportunidade ofensiva fora da caixa.",
    texto: "Com 1,86 xG, o Remo lidera a projeção ofensiva da rodada. A oportunidade principal está nos jogadores de ataque, não necessariamente no SG."
  },
  alertas: [
    {
      clube: "Remo", adversario: "Chapecoense", sg: 28.79, xgAdversario: null,
      pelotao: "Pelotão 2", veredito: "Ataque em evidência · 1,86 xG.",
      texto: "Com 1,86 xG, o Remo lidera a projeção ofensiva da rodada. A oportunidade principal está nos jogadores de ataque, não necessariamente no SG."
    },
    {
      clube: "Mirassol", adversario: "Adversário não informado", sg: 32.15, xgAdversario: null,
      pelotao: "Pelotão 2", veredito: "Alternativa defensiva.",
      texto: "Com 32,15% de SG projetado, merece atenção como opção fora das escolhas tradicionais."
    },
    {
      clube: "Corinthians", adversario: "Botafogo", sg: 34.68, xgAdversario: 1.07,
      pelotao: "Pelotão 1", veredito: "SG e scouts defensivos.",
      texto: "O Botafogo apresenta apenas 1,07 xG na rodada. Investigue jogadores com potencial de desarmes e outras pontuações independentes do SG."
    }
  ],
  escolhaTexto: "São Paulo, Corinthians e Flamengo são nossas principais escolhas defensivas. Mas o ataque do Remo pode ser a grande oportunidade fora da caixa da Rodada 35. Em uma rodada sem favoritos absolutos para SG, os scouts individuais podem ser decisivos.",
  ataquesTexto: "Projeção ofensiva da rodada, ordenada pelo xG informado.",
  ataques: [
    { clube: "Remo", xg: 1.86, adversario: "Chapecoense" },
    { clube: "Grêmio", xg: 1.71, adversario: "Bahia" },
    { clube: "Flamengo", xg: 1.70, adversario: "Athletico-PR" },
    { clube: "Vitória", xg: 1.57, adversario: "RB Bragantino" },
    { clube: "Vasco", xg: 1.56, adversario: "Internacional" },
    { clube: "São Paulo", xg: 1.56, adversario: "Fluminense" },
    { clube: "Corinthians", xg: 1.51, adversario: "Botafogo" }
  ],
  radar: [
    {
      clube: "Remo", titulo: "Ataque em evidência",
      texto: "Com 1,86 xG, o Remo lidera a projeção ofensiva da rodada. A oportunidade principal está nos jogadores de ataque, não necessariamente no SG."
    },
    {
      clube: "Mirassol", titulo: "Alternativa defensiva",
      texto: "Com 32,15% de SG projetado, merece atenção como opção fora das escolhas tradicionais."
    },
    {
      clube: "Corinthians", titulo: "SG e scouts defensivos",
      texto: "O Botafogo apresenta apenas 1,07 xG na rodada. Investigue jogadores com potencial de desarmes e outras pontuações independentes do SG."
    }
  ],
  placares: [
    { mandante: "Coritiba", visitante: "Santos", golsMandante: 1, golsVisitante: 1 },
    { mandante: "Remo", visitante: "Chapecoense", golsMandante: 2, golsVisitante: 1 },
    { mandante: "Flamengo", visitante: "Athletico-PR", golsMandante: 2, golsVisitante: 0 },
    { mandante: "Cruzeiro", visitante: "Palmeiras", golsMandante: 1, golsVisitante: 1 },
    { mandante: "Corinthians", visitante: "Botafogo", golsMandante: 1, golsVisitante: 0 },
    { mandante: "Grêmio", visitante: "Bahia", golsMandante: 2, golsVisitante: 1 },
    { mandante: "Vasco", visitante: "Internacional", golsMandante: 2, golsVisitante: 0 },
    { mandante: "Vitória", visitante: "RB Bragantino", golsMandante: 1, golsVisitante: 1 },
    { mandante: "São Paulo", visitante: "Fluminense", golsMandante: 1, golsVisitante: 0 }
  ],
  resumo: [
    { rotulo: "Pelotão 1", valor: "São Paulo · Corinthians · Flamengo · Vasco · Vitória" },
    { rotulo: "Destaque ofensivo", valor: "Remo · 1,86 xG · adversário: Chapecoense" },
    { rotulo: "Cenário defensivo", valor: "Nenhuma equipe alcança 40% de SG nas projeções disponíveis." }
  ],
  pelotoes: [
    {
      nome: "Pelotão 1",
      descricao: "Favoritos ao SG por ordem editorial do Mago; a sequência não representa classificação decrescente dos percentuais.",
      clubes: ["São Paulo", "Corinthians", "Flamengo", "Vasco", "Vitória"]
    },
    {
      nome: "Pelotão 2",
      descricao: "Alternativas e diferenciais por ordem editorial do Mago; a sequência não representa classificação decrescente dos percentuais.",
      clubes: ["Mirassol", "Remo", "Palmeiras", "Cruzeiro", "Grêmio"]
    }
  ],
  cruzamentos: [
    { clube: "Remo", resultado: "Principal oportunidade fora da caixa identificada pelo Mago." },
    { clube: "Mirassol", resultado: "Alternativa defensiva fora das escolhas tradicionais." },
    { clube: "Corinthians", resultado: "Combinação de perspectiva de SG e potencial de scouts defensivos." }
  ],
  convergencia: [
    { rotulo: "Pelotões", valor: "Curadoria editorial própria, distinta da ordem estatística dos percentuais." },
    { rotulo: "Cartada", valor: "Combinar escolhas defensivas com potencial ofensivo e scouts individuais." }
  ]
};
