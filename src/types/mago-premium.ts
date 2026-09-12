export interface MagoTeam {
  clube: string;
  adversario: string;
  sg: number;
  xgAdversario: number | null;
  confianca: string;
  pelotao?: string;
  veredito: string;
}

export interface MagoRound {
  rodada: number;
  topSg: MagoTeam[];
  alternativas: MagoTeam[];
  alerta: MagoTeam & { texto: string };
  escolhaTexto: string;
  ataques: { clube: string; xg: number }[];
  melhorCombinacao: string;
  placares: { mandante: string; visitante: string; golsMandante: number; golsVisitante: number }[];
  resumo: { rotulo: string; valor: string }[];
  pelotoes: { nome: string; descricao: string; clubes: string[] }[];
  cruzamentos: { clube: string; resultado: string }[];
  convergencia: { rotulo: string; valor: string }[];
}
