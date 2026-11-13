// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSuggestions, type Suggestion } from '../api/suggestions';
import {
  POLL_INTERVAL_MS,
  STALE_PROCESSING_MS,
  useAdminSuggestions,
} from './useAdminSuggestions';

vi.mock('../api/suggestions', () => ({ fetchSuggestions: vi.fn() }));

const suggestion: Suggestion = {
  id: '3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f',
  text: 'Kairú, no Rio Tavares',
  status: 'pending',
  draft: null,
  error: null,
  restaurantId: null,
  processingStartedAt: null,
  createdAt: '2026-11-10T12:00:00.000Z',
  updatedAt: '2026-11-10T12:00:00.000Z',
};

beforeEach(() => {
  vi.mocked(fetchSuggestions).mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useAdminSuggestions', () => {
  it('loads the suggestions', async () => {
    vi.mocked(fetchSuggestions).mockResolvedValue([suggestion]);

    const { result } = renderHook(() => useAdminSuggestions());

    expect(result.current[0]).toEqual({ status: 'loading' });
    await waitFor(() =>
      expect(result.current[0]).toEqual({
        status: 'success',
        suggestions: [suggestion],
        loadedAt: expect.any(Number),
      }),
    );
  });

  it('aborts the request on unmount', () => {
    vi.mocked(fetchSuggestions).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() => useAdminSuggestions());

    unmount();

    expect(vi.mocked(fetchSuggestions).mock.calls[0]?.[0]?.aborted).toBe(true);
  });

  it('reports an error when the request fails', async () => {
    vi.mocked(fetchSuggestions).mockRejectedValue(new Error('500'));

    const { result } = renderHook(() => useAdminSuggestions());

    await waitFor(() => expect(result.current[0]).toEqual({ status: 'error' }));
  });

  it('requests the list again on reload, keeping the current one meanwhile', async () => {
    vi.mocked(fetchSuggestions).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useAdminSuggestions());
    await waitFor(() =>
      expect(result.current[0]).toMatchObject({
        status: 'success',
        suggestions: [],
      }),
    );

    vi.mocked(fetchSuggestions).mockResolvedValueOnce([suggestion]);
    act(() => result.current[1]());

    expect(result.current[0]).toMatchObject({
      status: 'success',
      suggestions: [],
    });
    await waitFor(() =>
      expect(result.current[0]).toEqual({
        status: 'success',
        suggestions: [suggestion],
        loadedAt: expect.any(Number),
      }),
    );
    expect(fetchSuggestions).toHaveBeenCalledTimes(2);
  });

  describe('while the AI has work to do', () => {
    const now = new Date('2026-11-10T12:05:00.000Z');
    const ready: Suggestion = { ...suggestion, status: 'ready' };

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.setSystemTime(now);
    });

    async function loaded(result: {
      current: ReturnType<typeof useAdminSuggestions>;
    }) {
      await waitFor(() => expect(result.current[0].status).toBe('success'));
    }

    it('requests the list again until no suggestion is in progress', async () => {
      vi.mocked(fetchSuggestions)
        .mockResolvedValueOnce([suggestion])
        .mockResolvedValueOnce([{ ...suggestion, status: 'processing' }])
        .mockResolvedValueOnce([ready]);
      const { result } = renderHook(() => useAdminSuggestions());
      await loaded(result);

      await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS));
      await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS));

      expect(result.current[0]).toMatchObject({ suggestions: [ready] });
      await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3));
      expect(fetchSuggestions).toHaveBeenCalledTimes(3);
    });

    it('does not wait for a processing that got stuck', async () => {
      vi.mocked(fetchSuggestions).mockResolvedValue([
        {
          ...suggestion,
          status: 'processing',
          updatedAt: new Date(
            now.getTime() - STALE_PROCESSING_MS - 1,
          ).toISOString(),
        },
      ]);
      const { result } = renderHook(() => useAdminSuggestions());
      await loaded(result);

      await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3));

      expect(fetchSuggestions).toHaveBeenCalledOnce();
    });

    it('keeps the list on a failed request and tries again', async () => {
      vi.mocked(fetchSuggestions)
        .mockResolvedValueOnce([suggestion])
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce([ready]);
      const { result } = renderHook(() => useAdminSuggestions());
      await loaded(result);

      await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS));
      expect(fetchSuggestions).toHaveBeenCalledTimes(2);
      expect(result.current[0]).toMatchObject({ suggestions: [suggestion] });

      await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS));
      expect(result.current[0]).toMatchObject({ suggestions: [ready] });
    });

    it('stops requesting on unmount', async () => {
      vi.mocked(fetchSuggestions).mockResolvedValue([suggestion]);
      const { result, unmount } = renderHook(() => useAdminSuggestions());
      await loaded(result);

      unmount();
      await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3));

      expect(fetchSuggestions).toHaveBeenCalledOnce();
    });
  });
});
