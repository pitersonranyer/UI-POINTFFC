import type { MagoRound } from "@/types/mago-premium";

export const magoRodada27: MagoRound = {
  rodada: 27,
  pelotoes: [
    { nome: "Pelotão 1", descricao: "Principais indicações dos especialistas", clubes: ["Flamengo", "Palmeiras", "Grêmio", "Mirassol", "Bahia"] },
    { nome: "Pelotão 2", descricao: "Alternativas e diferenciais considerados pelos especialistas", clubes: ["Atlético-MG", "Botafogo", "Bragantino", "Santos", "Cruzeiro"] },
  ],
  cruzamentos: [
    { clube: "Flamengo", resultado: "SG Nº 1 do Mago" },
    { clube: "Grêmio", resultado: "Bom diferencial, mas abaixo do núcleo principal" },
    { clube: "Bragantino", resultado: "Alerta do Mago / evitar SG" },
  ],
  convergencia: [
    { rotulo: "Pelotão 1 confirmados pelo Mago", valor: "Flamengo, Bahia, Palmeiras e Mirassol" },
    { rotulo: "Pelotão 1 usado como diferencial", valor: "Grêmio" },
    { rotulo: "Pelotão 2 aproveitados", valor: "Botafogo, Santos e Cruzeiro" },
    { rotulo: "Pelotão 2 rejeitado pelo Mago", valor: "Bragantino" },
    { rotulo: "Atlético-MG", valor: "Não entra no ranking principal de SG da rodada" },
  ],
  escolhaTexto: "O Flamengo lidera o ranking do Mago. Possui a maior probabilidade de SG da rodada, enfrenta um Corinthians com apenas 0,84 de xG projetado e vem apresentando excelente consistência defensiva.",
  topSg: [
    { clube: "Flamengo", adversario: "Corinthians", sg: 42.66, xgAdversario: 0.84, confianca: "MUITO ALTA", pelotao: "Pelotão 1", veredito: "Principal SG da rodada" },
    { clube: "Bahia", adversario: "Remo", sg: 41.59, xgAdversario: null, confianca: "MUITO ALTA", veredito: "Equilíbrio entre ataque e defesa" },
    { clube: "Palmeiras", adversario: "São Paulo", sg: 36.86, xgAdversario: null, confianca: "ALTA", veredito: "Terceira escolha para SG" },
    { clube: "Mirassol", adversario: "Vitória", sg: 35.01, xgAdversario: null, confianca: "ALTA", veredito: "Ótima opção para a rodada" },
    { clube: "Grêmio", adversario: "Vasco", sg: 28.24, xgAdversario: 1.27, confianca: "MODERADA", veredito: "Diferencial com mais risco" },
  ],
  alternativas: [
    { clube: "Botafogo", adversario: "Bragantino", sg: 30.10, xgAdversario: 1.19, confianca: "BOA", veredito: "Alternativa para diversificar" },
    { clube: "Santos", adversario: "Cruzeiro", sg: 31.55, xgAdversario: 1.15, confianca: "BOA COM RISCO", veredito: "Boa opção, com cautela" },
    { clube: "Cruzeiro", adversario: "Santos", sg: 22.60, xgAdversario: 1.50, confianca: "MÉDIA", veredito: "Menor confiança defensiva" },
  ],
  alerta: { clube: "Bragantino", adversario: "Botafogo", sg: 17.03, xgAdversario: 1.76, confianca: "RISCO ELEVADO", veredito: "Evitar para SG", texto: "Apesar de aparecer entre as alternativas dos especialistas, os números da rodada indicam risco elevado para SG." },
  ataques: [
    { clube: "Mirassol", xg: 1.82 }, { clube: "Botafogo", xg: 1.76 },
    { clube: "Bahia", xg: 1.73 }, { clube: "Grêmio", xg: 1.58 },
    { clube: "Atlético-MG", xg: 1.55 }, { clube: "Santos", xg: 1.50 },
    { clube: "Flamengo", xg: 1.48 },
  ],
  melhorCombinacao: "Bahia",
  placares: [
    { mandante: "Atlético-MG", visitante: "Fluminense", golsMandante: 2, golsVisitante: 1 },
    { mandante: "Grêmio", visitante: "Vasco", golsMandante: 2, golsVisitante: 1 },
    { mandante: "Chapecoense", visitante: "Internacional", golsMandante: 1, golsVisitante: 1 },
    { mandante: "Palmeiras", visitante: "São Paulo", golsMandante: 1, golsVisitante: 0 },
    { mandante: "Botafogo", visitante: "Bragantino", golsMandante: 2, golsVisitante: 1 },
    { mandante: "Santos", visitante: "Cruzeiro", golsMandante: 1, golsVisitante: 1 },
    { mandante: "Mirassol", visitante: "Vitória", golsMandante: 2, golsVisitante: 0 },
    { mandante: "Flamengo", visitante: "Corinthians", golsMandante: 2, golsVisitante: 0 },
    { mandante: "Bahia", visitante: "Remo", golsMandante: 2, golsVisitante: 0 },
  ],
  resumo: [
    { rotulo: "SG Nº 1", valor: "Flamengo" }, { rotulo: "SG Nº 2", valor: "Bahia" },
    { rotulo: "SG Nº 3", valor: "Palmeiras" }, { rotulo: "Ótima opção", valor: "Mirassol" },
    { rotulo: "Diferencial", valor: "Grêmio" }, { rotulo: "Alternativas", valor: "Botafogo e Santos" },
    { rotulo: "Melhor ataque projetado", valor: "Mirassol" },
    { rotulo: "Melhor combinação ataque + defesa", valor: "Bahia" },
    { rotulo: "Evitar SG", valor: "Bragantino" },
  ],
};
