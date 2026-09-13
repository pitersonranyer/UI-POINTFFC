export const futebolCompeticoes = [
  { codigo: "BSA", nome: "Brasileirão Série A", aba: "Brasileirão" },
  { codigo: "CL", nome: "Champions League", aba: "Champions" },
  { codigo: "PL", nome: "Premier League", aba: "Premier League" },
  { codigo: "PD", nome: "La Liga", aba: "La Liga" },
  { codigo: "SA", nome: "Serie A Itália", aba: "Serie A Itália" },
  { codigo: "BL1", nome: "Bundesliga", aba: "Bundesliga" },
  { codigo: "FL1", nome: "Ligue 1", aba: "Ligue 1" },
  { codigo: "PPL", nome: "Primeira Liga", aba: "Primeira Liga" },
  { codigo: "DED", nome: "Eredivisie", aba: "Eredivisie" },
  { codigo: "ELC", nome: "Championship", aba: "Championship" },
] as const;

export type FutebolCompeticaoCodigo = typeof futebolCompeticoes[number]["codigo"];

export function codigoCompeticao(value: string | null): FutebolCompeticaoCodigo {
  return futebolCompeticoes.find(item => item.codigo === value)?.codigo ?? "BSA";
}
