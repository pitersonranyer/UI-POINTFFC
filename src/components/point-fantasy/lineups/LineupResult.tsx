import React from "react";
import type { FantasyLineup } from "@/types/pointFantasyLineup";
import { formatOfficialScore, scoreState } from "@/lib/fantasyScore";

export function LineupResult({ lineup }: { lineup: FantasyLineup }) {
  if (lineup.status !== "INSCRITA") return null;
  const result = lineup.resultado;
  const name = (id: number) => lineup.atletas.find(a => a.catalogoAtletaId === id)?.atleta.apelido ?? `Atleta #${id}`;
  return <section aria-label="Resultado oficial"><h3>Pontuação oficial: {formatOfficialScore(result?.pontuacao ?? null)}</h3>
    <p role="status">{result ? scoreState(result.estadoPontuacao) : "Resultado ainda não disponível"}</p>
    {result && "substituicoes" in result && result.substituicoes.length > 0 && <ul aria-label="Substituições automáticas">{result.substituicoes.map(sub =>
      <li key={sub.titularSaiuId}>{sub.regra === "MAGO" ? "M · Reserva do Mago" : "Substituição comum"}: saiu {name(sub.titularSaiuId)}, entrou {name(sub.reservaEntrouId)} · {formatOfficialScore(sub.pontuacaoContabilizada)} pts contabilizados{sub.herdouCapitao ? " · C 2x herdado" : ""}</li>
    )}</ul>}
  </section>;
}
