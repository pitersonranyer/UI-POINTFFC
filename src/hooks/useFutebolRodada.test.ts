import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useFutebolRodada } from './useFutebolRodada';
import { buscarRodadaAtualBsa } from '@/services/futebolService';
import type { FutebolRodada } from '@/types/futebol';

vi.mock('@/services/futebolService', () => ({ buscarRodadaAtualBsa: vi.fn() }));
const fetchRound = vi.mocked(buscarRodadaAtualBsa);
const first = { rodada: 27, jogos: [] } as unknown as FutebolRodada;
const next = { rodada: 28, jogos: [] } as unknown as FutebolRodada;
beforeEach(() => { vi.useFakeTimers(); fetchRound.mockReset(); fetchRound.mockResolvedValue(first); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

it('refreshes after five minutes and stops after unmount', async () => {
  const { result, unmount } = renderHook(() => useFutebolRodada());
  await act(async () => {});
  expect(result.current.data).toBe(first);
  fetchRound.mockResolvedValue(next);
  await act(async () => { await vi.advanceTimersByTimeAsync(299999); });
  expect(fetchRound).toHaveBeenCalledTimes(1);
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(result.current.data).toBe(next);
  expect(result.current.loading).toBe(false);
  unmount();
  await act(async () => { await vi.advanceTimersByTimeAsync(300000); });
  expect(fetchRound).toHaveBeenCalledTimes(2);
});

it('preserves scores on refresh failure and retries on the next interval', async () => {
  const { result } = renderHook(() => useFutebolRodada());
  await act(async () => {});
  fetchRound.mockRejectedValueOnce(new Error('offline'));
  await act(async () => { await vi.advanceTimersByTimeAsync(300000); });
  expect(result.current.data).toBe(first);
  expect(result.current.error).toBeNull();
  fetchRound.mockResolvedValue(next);
  await act(async () => { await vi.advanceTimersByTimeAsync(300000); });
  expect(result.current.data).toBe(next);
});

it('does not overlap requests or fetch while disabled', async () => {
  fetchRound.mockReturnValue(new Promise(() => {}));
  const { rerender } = renderHook(({ enabled }) => useFutebolRodada(enabled), { initialProps: { enabled: false } });
  await act(async () => { await vi.advanceTimersByTimeAsync(300000); });
  expect(fetchRound).not.toHaveBeenCalled();
  rerender({ enabled: true });
  await act(async () => { await vi.advanceTimersByTimeAsync(600000); });
  expect(fetchRound).toHaveBeenCalledTimes(1);
});
