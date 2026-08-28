import type { RoundCenterDataset } from "@/types/round-center";

const matches = [
  ["fluminense-remo", "Fluminense", "Remo"],
  ["internacional-atletico-mg", "Internacional", "Atlético-MG"],
  ["cruzeiro-flamengo", "Cruzeiro", "Flamengo"],
  ["vitoria-bahia", "Vitória", "Bahia"],
  ["bragantino-gremio", "Red Bull Bragantino", "Grêmio"],
  ["palmeiras-vasco", "Palmeiras", "Vasco"],
  ["chapecoense-sao-paulo", "Chapecoense", "São Paulo"],
  ["santos-mirassol", "Santos", "Mirassol"],
  ["coritiba-corinthians", "Coritiba", "Corinthians"],
  ["botafogo-athletico-pr", "Botafogo", "Athletico-PR"],
] as const;

export const round24Analysis: RoundCenterDataset = {
  round: 24,
  competition: "Brasileirão",
  matches: matches.map(([id, homeTeam, awayTeam]) => ({ id, homeTeam, awayTeam })),
  cleanSheetAnalysis: [
    { team: "Palmeiras", tier: 1 }, { team: "Flamengo", tier: 1 }, { team: "Vitória", tier: 1 },
    { team: "Santos", tier: 2 }, { team: "Botafogo", tier: 2 }, { team: "Athletico-PR", tier: 2 },
    { team: "São Paulo", tier: 2 }, { team: "Corinthians", tier: 2 }, { team: "Internacional", tier: 3 },
  ],
};
