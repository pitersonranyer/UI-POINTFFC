export function isOfficialScore(value: unknown): value is string | number {
 return typeof value === "number" ? Number.isFinite(value) : typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value));
}
export function formatOfficialScore(value: string | number | null) {
 return value === null ? "—" : Number(value).toLocaleString("pt-BR", { maximumFractionDigits:20 });
}
export function scoreState(state: string) {
 return ({PARCIAL:"Resultado parcial",DEFINITIVO:"Resultado definitivo",INDISPONIVEL:"Resultado indisponível",NAO_INICIADA:"Pontuação não iniciada"} as Record<string,string>)[state] ?? "Estado da pontuação não reconhecido";
}
