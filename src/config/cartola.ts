const positiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// Fonte central e configuravel enquanto a rodada/temporada ainda nao vivem em um contexto global.
export const CARTOLA_SEASON = positiveInteger(process.env.NEXT_PUBLIC_CARTOLA_SEASON, 2026);
export const CARTOLA_CURRENT_ROUND = positiveInteger(process.env.NEXT_PUBLIC_CARTOLA_ROUND, 25);
