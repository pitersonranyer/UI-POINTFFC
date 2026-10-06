export interface MagoTeam {
  clube: string;
  adversario: string;
  sg: number;
  xgAdversario: number | null;
  confianca: string;
  pelotao?: string;
  veredito: string;
  xga?: number;
  golsSofridos?: number;
  analise?: string;
}

export interface MagoRound {
  rodada: number;
  pelotoesDoMago?: boolean;
  ataquesTexto?: string;
  teaserAlerta?: { titulo: string; subtitulo: string; texto: string; detalhe: string };
  duelo?: { titulo: string; texto: string };
  jogos?: { mandante: string; visitante: string; dia: string; horario: string }[];
  indicadores?: { clube: string; xgRodada: number; xgTotal: number; gols: number; sg: number; xga?: number; golsSofridos?: number }[];
  topSg: MagoTeam[];
  alternativas: MagoTeam[];
  alerta: MagoTeam & { texto: string };
  alertas?: (MagoTeam & { texto: string })[];
  escolhaTexto: string;
  ataques: { clube: string; xg: number }[];
  melhorCombinacao: string;
  placares: { mandante: string; visitante: string; golsMandante: number; golsVisitante: number }[];
  resumo: { rotulo: string; valor: string }[];
  pelotoes: { nome: string; descricao: string; clubes: string[] }[];
  cruzamentos: { clube: string; resultado: string }[];
  convergencia: { rotulo: string; valor: string }[];
}
