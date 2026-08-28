import type { RoundMatches } from "@/types/match";

const shield = (team: string) => `https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/${team}/45x45.png`;
const match = (id: number, home: string, away: string, date: string, venue: string) => ({ id, home: { abbreviation: home, shieldUrl: shield(home) }, away: { abbreviation: away, shieldUrl: shield(away) }, date, venue, homeScore: null, awayScore: null });

export const roundMatches: RoundMatches = {
  round: 24,
  matches: [
    match(346371, "FLU", "REM", "2026-08-22 16:00:00", "Maracanã"),
    match(346381, "INT", "CAM", "2026-08-22 18:30:00", "Beira-Rio"),
    match(346379, "CRU", "FLA", "2026-08-22 20:30:00", "Mineirão"),
    match(346385, "VIT", "BAH", "2026-08-23 16:00:00", "Barradão"),
    match(346377, "RBB", "GRE", "2026-08-23 16:00:00", "Cícero de Souza Marques"),
    match(346375, "PAL", "VAS", "2026-08-23 16:00:00", "Nubank Parque"),
    match(346387, "CHA", "SAO", "2026-08-23 18:30:00", "Arena Condá"),
    match(346373, "SAN", "MIR", "2026-08-23 18:30:00", "Vila Belmiro"),
    match(346383, "CFC", "COR", "2026-08-23 19:30:00", "Couto Pereira"),
    match(346372, "BOT", "CAP", "2026-08-24 20:00:00", "Nilton Santos (Engenhão)"),
  ],
};
