// Mirrors the backend's team-identity.ts validation. The server remains authoritative.
export function normalizeTeamName(value: string): string | null {
  if (value.length > 120) return null;
  const name = value.normalize("NFC").trim().replace(/ +/g, " ");
  return [...name].length >= 2 && [...name].length <= 60 && /^[\p{L}\p{N}][\p{L}\p{M}\p{N} .'-]*$/u.test(name) ? name : null;
}
