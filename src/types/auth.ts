export type UserType = "PLAYER" | "ORGANIZER" | "PLATFORM_ADMIN";
export type UserStatus = "ATIVO" | "INATIVO" | "BLOQUEADO";

export interface AuthenticatedUser {
  idUsuario: string;
  nome: string | null;
  email: string;
  fotoUrl: string | null;
  tipoUsuario: UserType;
  status: UserStatus;
  saldo?: number;
}

export interface AuthResponse { accessToken:string; tokenType:"Bearer"; expiresIn:string; user:AuthenticatedUser }
