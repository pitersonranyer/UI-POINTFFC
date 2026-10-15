// Synthetic fixtures exclusively for automated tests. Never imported by the real flow.
import type { PointFantasyAthlete } from "@/types/pointFantasy";
import type { FantasyLineup, Formation, LineupContext, LineupSelection } from "@/types/pointFantasyLineup";
import { emptySelection, formationCounts, reserveCounts } from "./lineupPresentation";
export const testAthlete = (id: number, posicaoId = 1, extra: Partial<PointFantasyAthlete> = {}): PointFantasyAthlete => ({ id, atletaIdExterno:10000 + id, catalogoId:9, clubeIdExterno:262, posicaoId, statusId:7, apelido:`Jogador ${id}`, categoriaId:posicaoId === 6 ? null : 2, pointcoins:posicaoId === 6 ? 10 : 20, precoCartola:"8.55", ...extra });
export function testContext(): LineupContext {
  return {
    competition:{ id:8, catalogoId:9, nome:"Competição de teste", temporada:2026, rodada:31, tipoAcesso:"FREE", valorInscricao:"0.00", status:"PUBLICADA", inicioInscricao:"2026-01-01T00:00:00Z", fimInscricao:"2098-01-01T00:00:00Z", fechamentoDefinitivoEm:null, limiteEscalacoesUsuario:null, criadoEm:"", atualizadoEm:"", partidas:[{ id:1, competicaoId:8, partidaIdExterno:100, clubeMandanteId:262, clubeVisitanteId:263, inicioPrevisto:"2099-01-01T00:00:00Z", inicioReal:null, status:"AGENDADA" }] },
    catalog:{ id:9, temporada:2026, rodada:31, versao:1, status:"CONGELADO", capturadoEm:"", congeladoEm:"", criadoEm:"" },
    athletes:[...Array.from({ length:80 }, (_, i) => testAthlete(i + 1, (i % 6) + 1)), testAthlete(100, 1, { apelido:"João Dúvida", statusId:2 }), testAthlete(101, 1, { apelido:"Suspenso Teste", statusId:3 }), testAthlete(102, 1, { apelido:"Sem situação", statusId:999 })],
    clubs:[{ id:262, dados:{ nome:"FLA", abreviacao:"FLA" } }, { id:263, dados:{ nome:"BOT", abreviacao:"BOT" } }],
    positions:[1,2,3,4,5,6].map(id => ({ id, dados:{ nome:String(id), abreviacao:String(id) } })),
  };
}
export const testLineup = (selection: LineupSelection = emptySelection(), extra: Partial<FantasyLineup> = {}): FantasyLineup => ({ ...selection, id:12, competicaoId:8, status:"RASCUNHO", versao:1, criadoEm:"", atualizadoEm:"", atletas:[], validacao:{ completa:false, pendencias:["Selecionar tecnico", "Selecionar capitao"] }, ...extra });
export function completeTestSelection(formation: Formation) {
  const context = testContext(); const selection = { ...emptySelection(), formacao:formation };
  const athletes: PointFantasyAthlete[] = []; let id = 1;
  for (const [role, counts] of [["titulares", formationCounts[formation]], ["reservas", reserveCounts(formation)]] as const) {
    for (const pos of [1,2,3,4,5]) for (let n = 0; n < counts[pos]; n++) { const a = testAthlete(id++, pos); athletes.push(a); selection[role].push(a.id); }
  }
  const coach = testAthlete(id, 6); athletes.push(coach); selection.tecnico = id;
  selection.capitaoAtletaId = selection.titulares[0]; selection.reservaMagoAtletaId = selection.reservas[0];
  context.athletes = athletes;
  return { context, selection };
}
