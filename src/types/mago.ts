export type ClassificacaoSg = "MUITO FORTE" | "FORTE" | "BOA OPÇÃO" | "DIFERENCIAL" | "COBERTURA";
export type ConfiancaSg = "MUITO ALTA" | "ALTA" | "BOA" | "MÉDIA" | "BAIXA";

export interface AnaliseSgItem {
  posicao?: number;
  clube: string;
  classificacao: ClassificacaoSg;
  probabilidadeSg: number;
  adversario: string;
  xgAdversario: number;
  texto: string;
  placarImaginario: string;
  confianca: ConfiancaSg;
}

export interface AnaliseSgRodada {
  rodada: number;
  introducao: string;
  analises: AnaliseSgItem[];
  rankingFinal: string[];
  placaresRodada: string[];
  nucleoPrincipal: string[];
  segundoBloco: string[];
}
