export const futebolCompeticoes = [
  { codigo: "BSA", nome: "Brasileirão Série A", aba: "Brasileirão", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/72/Brasileir%C3%A3o_logo_%282024%29.svg" },
  { codigo: "CL", nome: "Champions League", aba: "Champions", logoUrl: "https://crests.football-data.org/CL.png" },
  { codigo: "PL", nome: "Premier League", aba: "Premier League", logoUrl: "https://crests.football-data.org/PL.png" },
  { codigo: "PD", nome: "La Liga", aba: "La Liga", logoUrl: "https://crests.football-data.org/PD.png" },
  { codigo: "SA", nome: "Serie A Itália", aba: "Serie A Itália", logoUrl: "https://crests.football-data.org/SA.png" },
  { codigo: "BL1", nome: "Bundesliga", aba: "Bundesliga", logoUrl: "https://crests.football-data.org/BL1.png" },
  { codigo: "FL1", nome: "Ligue 1", aba: "Ligue 1", logoUrl: "https://crests.football-data.org/FL1.png" },
  { codigo: "PPL", nome: "Primeira Liga", aba: "Primeira Liga", logoUrl: "https://crests.football-data.org/PPL.png" },
  { codigo: "DED", nome: "Eredivisie", aba: "Eredivisie", logoUrl: "https://crests.football-data.org/ED.png" },
  { codigo: "ELC", nome: "Championship", aba: "Championship", logoUrl: "https://crests.football-data.org/ELC.png" },
] as const;

export type FutebolCompeticaoCodigo = typeof futebolCompeticoes[number]["codigo"];

export function codigoCompeticao(value: string | null): FutebolCompeticaoCodigo {
  return futebolCompeticoes.find(item => item.codigo === value)?.codigo ?? "BSA";
}
