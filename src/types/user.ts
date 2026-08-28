export enum UserRole {
  PLAYER = "PLAYER",
  ORGANIZER = "ORGANIZER",
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
}

export type User = { id: string; name: string; role: UserRole };
