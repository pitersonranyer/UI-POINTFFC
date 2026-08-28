export type CartolaTeam = {
  timeId: number;
  nome: string;
  nomeCartoleiro: string;
  escudoUrl: string;
  slug?: string;
  fotoPerfil?: string;
  assinante?: boolean;
};
export type AddTeamResult = { status?: string; time?: CartolaTeam };
export type FindByIdsResult = { times: CartolaTeam[]; naoEncontrados: number[]; tentarNovamente: number[] };
export type ImportResult = { adicionados: number; jaExistentes: number; naoEncontrados: number[]; tentarNovamente: number[]; naoProcessados: number; times?: CartolaTeam[] };

export type UserCartolaTeam = {
  id: string;
  userId: string;
  cartolaTeamId: number;
  name: string;
  ownerName: string;
  slug: string;
  shieldUrl: string;
  active: boolean;
  linkedAt: string;
};
