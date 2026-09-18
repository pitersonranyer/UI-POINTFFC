import type { MagoRound } from "@/types/mago-premium";

export const magoRodada28: MagoRound = {
  rodada: 28,
  pelotoes: [
    { nome: "Pelotão 1", descricao: "Principais indicações dos especialistas", clubes: ["Flamengo", "Atlético-MG", "São Paulo", "Vasco", "Palmeiras"] },
    { nome: "Pelotão 2", descricao: "Alternativas e diferenciais considerados pelos especialistas", clubes: ["Corinthians", "Fluminense", "Vitória", "Santos", "Athletico-PR"] },
  ],
  cruzamentos: [
    { clube: "Flamengo", resultado: "SG Nº 1 do Mago" },
    { clube: "Corinthians", resultado: "Sobe para o Top 3 apesar de estar no segundo pelotão" },
    { clube: "Athletico-PR", resultado: "Sobe como ótima alternativa defensiva" },
  ],
  convergencia: [
    { rotulo: "Pelotão 1 confirmados pelo Mago", valor: "Flamengo, Atlético-MG, São Paulo, Vasco e Palmeiras" },
    { rotulo: "Pelotão 2 no Top 3", valor: "Corinthians" },
    { rotulo: "Pelotão 2 como alternativas", valor: "Vitória e Athletico-PR" },
    { rotulo: "Pelotão 2 fora das prioridades", valor: "Fluminense" },
  ],
  escolhaTexto: "O Flamengo permanece como uma das referências defensivas do campeonato e volta a apresentar excelente combinação entre força estrutural e confronto. O RB Bragantino possui apenas 0,97 de xG projetado, segunda menor expectativa ofensiva da rodada. Embora o Corinthians apresente probabilidade matemática ligeiramente superior, consistência defensiva, mando e momento colocam o Flamengo na primeira posição do Mago.",
  topSg: [
    { clube: "Flamengo", adversario: "RB Bragantino", sg: 37.79, xgAdversario: 0.97, xga: 9.10, golsSofridos: 9, confianca: "MUITO ALTA", pelotao: "Pelotão 1", veredito: "Principal SG do Mago na R28" },
    { clube: "São Paulo", adversario: "Internacional", sg: 37.31, xgAdversario: 0.99, xga: 11.64, golsSofridos: 10, confianca: "MUITO ALTA", pelotao: "Pelotão 1", analise: "Probabilidade, mando, defesa e especialistas apontam na mesma direção.", veredito: "SG fortíssimo" },
    { clube: "Corinthians", adversario: "Fluminense", sg: 40.10, xgAdversario: 0.92, xga: 11.28, confianca: "ALTA", pelotao: "Pelotão 2", analise: "Possui a maior probabilidade matemática de SG da rodada, com cautela pela volatilidade recente.", veredito: "Estatisticamente fortíssimo, mas com cautela" },
    { clube: "Atlético-MG", adversario: "Chapecoense", sg: 34.24, xgAdversario: 1.08, confianca: "ALTA", pelotao: "Pelotão 1", analise: "Mando, confronto e presença no primeiro pelotão criam um cenário bastante interessante.", veredito: "Forte candidato ao SG" },
    { clube: "Palmeiras", adversario: "Grêmio", sg: 28.87, xgAdversario: 1.23, xga: 9.25, golsSofridos: 9, confianca: "ALTA COM RISCO", pelotao: "Pelotão 1", analise: "A estrutura defensiva mantém o Palmeiras entre as escolhas mesmo fora de casa.", veredito: "Defesa forte em confronto de maior risco" },
  ],
  alternativas: [
    { clube: "Athletico-PR", adversario: "Bahia", sg: 33.99, xgAdversario: 1.06, xga: 9.97, golsSofridos: 10, confianca: "BOA", pelotao: "Pelotão 2", analise: "Os números defensivos colocam o Athletico em posição relevante.", veredito: "Ótima alternativa" },
    { clube: "Vitória", adversario: "Cruzeiro", sg: 33.30, xgAdversario: 1.12, confianca: "BOA", pelotao: "Pelotão 2", analise: "Números suficientes para funcionar como opção de diversificação.", veredito: "Boa opção de segundo bloco" },
    { clube: "Vasco", adversario: "Coritiba", sg: 32.17, xgAdversario: 1.14, confianca: "BOA COM RISCO", pelotao: "Pelotão 1", analise: "Recebe apoio dos especialistas, mas o adversário não é ofensivamente desprezível.", veredito: "Diferencial interessante, mas com risco" },
  ],
  alerta: { clube: "RB Bragantino", adversario: "Flamengo", sg: 14.90, xgAdversario: 1.89, confianca: "RISCO MUITO ALTO", veredito: "Evitar para SG", texto: "O Flamengo possui a maior expectativa ofensiva da rodada." },
  alertas: [
    { clube: "RB Bragantino", adversario: "Flamengo", sg: 14.90, xgAdversario: 1.89, confianca: "RISCO MUITO ALTO", veredito: "Evitar para SG", texto: "O Flamengo possui a maior expectativa ofensiva da rodada." },
    { clube: "Bahia", adversario: "Athletico-PR", sg: 17.48, xgAdversario: 1.75, confianca: "RISCO MUITO ALTO", veredito: "Risco muito alto para SG", texto: "O Athletico-PR apresenta 1,75 de xG projetado." },
    { clube: "Fluminense", adversario: "Corinthians", sg: 21.37, xgAdversario: 1.52, confianca: "CAUTELA", veredito: "Não está entre as prioridades do Mago", texto: "Apesar do segundo pelotão, os números específicos da rodada não são suficientemente favoráveis." },
  ],
  ataques: [
    { clube: "Flamengo", xg: 1.89 }, { clube: "Atlético-MG", xg: 1.77 }, { clube: "Athletico-PR", xg: 1.75 }, { clube: "Palmeiras", xg: 1.64 },
    { clube: "Mirassol", xg: 1.57 }, { clube: "Remo", xg: 1.54 }, { clube: "Santos", xg: 1.53 }, { clube: "Corinthians", xg: 1.52 },
  ],
  melhorCombinacao: "Flamengo",
  placares: [
    { mandante: "Atlético-MG", visitante: "Chapecoense", golsMandante: 2, golsVisitante: 0 }, { mandante: "Mirassol", visitante: "Botafogo", golsMandante: 2, golsVisitante: 1 },
    { mandante: "Remo", visitante: "Santos", golsMandante: 1, golsVisitante: 1 }, { mandante: "Vasco", visitante: "Coritiba", golsMandante: 1, golsVisitante: 0 },
    { mandante: "São Paulo", visitante: "Internacional", golsMandante: 1, golsVisitante: 0 }, { mandante: "Grêmio", visitante: "Palmeiras", golsMandante: 1, golsVisitante: 1 },
    { mandante: "Corinthians", visitante: "Fluminense", golsMandante: 1, golsVisitante: 0 }, { mandante: "Vitória", visitante: "Cruzeiro", golsMandante: 1, golsVisitante: 0 },
    { mandante: "Flamengo", visitante: "RB Bragantino", golsMandante: 2, golsVisitante: 0 }, { mandante: "Athletico-PR", visitante: "Bahia", golsMandante: 2, golsVisitante: 0 },
  ],
  resumo: [
    { rotulo: "SG Nº 1", valor: "Flamengo" }, { rotulo: "SG Nº 2", valor: "São Paulo" }, { rotulo: "SG Nº 3", valor: "Corinthians" },
    { rotulo: "Forte", valor: "Atlético-MG" }, { rotulo: "Defesa estrutural", valor: "Palmeiras" }, { rotulo: "Alternativa", valor: "Athletico-PR" },
    { rotulo: "Segundo bloco", valor: "Vitória" }, { rotulo: "Diferencial", valor: "Vasco" }, { rotulo: "Melhor ataque", valor: "Flamengo — 1,89 xG" },
    { rotulo: "Melhor combinação ataque + defesa", valor: "Flamengo" }, { rotulo: "Evitar SG", valor: "RB Bragantino" },
  ],
};
