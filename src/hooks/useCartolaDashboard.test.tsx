import { afterEach, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { useCartolaDashboard } from "./useCartolaDashboard";
import * as service from "@/services/cartola/cartola.service";
vi.mock("@/services/cartola/cartola.service", () => ({ buscarDashboardComMetadados: vi.fn(), buscarAtletasPontuados: vi.fn().mockResolvedValue({ atletas: {} }), buscarAtletasPontuadosRodada: vi.fn().mockResolvedValue({ atletas: {} }), buscarPartidasRodada: vi.fn().mockResolvedValue({ partidas: [] }) }));
afterEach(cleanup);
it.each([[true, 1], [true, 28], [false, 27]])("preserva mercado aberto=%s rodada Cartola=%i", async (mercadoAberto, rodada) => {
  vi.mocked(service.buscarDashboardComMetadados).mockResolvedValue({ data: { mercadoAberto, rodada, partidas: [] }, stale: false } as unknown as Awaited<ReturnType<typeof service.buscarDashboardComMetadados>>);
  const { result } = renderHook(() => useCartolaDashboard());
  await waitFor(() => expect(result.current.loading).toBe(false));
  if (mercadoAberto && rodada === 1) { expect(service.buscarAtletasPontuados).not.toHaveBeenCalled(); expect(service.buscarAtletasPontuadosRodada).not.toHaveBeenCalled(); }
  else if (mercadoAberto) { expect(service.buscarAtletasPontuadosRodada).toHaveBeenCalledWith(27); expect(service.buscarAtletasPontuados).not.toHaveBeenCalled(); }
  else { expect(service.buscarAtletasPontuados).toHaveBeenCalledOnce(); expect(service.buscarAtletasPontuadosRodada).not.toHaveBeenCalled(); }
});
