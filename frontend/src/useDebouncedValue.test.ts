// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('starts with the initial value', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 300));

    expect(result.current).toBe('a');
  });

  it('updates only after the value stops changing for the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'm' } },
    );

    rerender({ value: 'ma' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'man' });
    act(() => vi.advanceTimersByTime(200));

    expect(result.current).toBe('m');

    act(() => vi.advanceTimersByTime(100));

    expect(result.current).toBe('man');
  });
});
