export type ClassificacaoSg = "MUITO FORTE" | "FORTE" | "FORTE / DIFERENCIAL" | "BOA OPÇÃO" | "DIFERENCIAL" | "OUSADO" | "COBERTURA";
export type ConfiancaSg = "MUITO ALTA" | "ALTA" | "ALTA, COM RISCO" | "BOA" | "MÉDIA" | "BAIXA";

export interface AnaliseSgItem {
  posicao?: number;
  clube: string;
  classificacao: ClassificacaoSg;
  probabilidadeSg: number;
  adversario: string;
  xgAdversario: number;
  especialistas: string;
  texto: string[];
  placarImaginario: string;
  confianca: ConfiancaSg;
}

export interface MelhorAtaque {
  posicao: number;
  clube: string;
  xg: number;
}

export interface DestaqueOfensivo {
  clube: string;
  texto: string[];
}

export interface ResumoMago {
  sgMaisForte: string;
  segundoSg: string;
  terceiroSg: string;
  diferencialDefensivo: string;
  defesaForteMaiorRisco: string;
  melhoresAtaques: string[];
  destaqueOfensivo: string;
}

export interface AnaliseSgRodada {
  rodada: number;
  introducao: string;
  analises: AnaliseSgItem[];
  rankingFinal: string[];
  placaresRodada: string[];
  nucleoPrincipal: string[];
  segundoBloco: string[];
  melhoresAtaques: MelhorAtaque[];
  destaqueOfensivo: DestaqueOfensivo;
  resumoMago: ResumoMago;
}
