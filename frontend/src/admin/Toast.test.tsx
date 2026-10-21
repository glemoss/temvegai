// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toast, TOAST_DURATION, type ToastMessage } from './Toast';

const saved: ToastMessage = {
  id: 1,
  text: 'Restaurante “Mandarina” adicionado.',
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Toast', () => {
  it('keeps an empty live region when there is no message', () => {
    render(<Toast message={null} onDismiss={vi.fn()} />);

    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('shows the message and dismisses it after a while', () => {
    const onDismiss = vi.fn();
    render(<Toast message={saved} onDismiss={onDismiss} />);

    expect(screen.getByRole('status').textContent).toBe(saved.text);

    act(() => vi.advanceTimersByTime(TOAST_DURATION - 1));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('gives a new message its full time', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <Toast message={saved} onDismiss={onDismiss} />,
    );

    act(() => vi.advanceTimersByTime(TOAST_DURATION - 1));
    rerender(<Toast message={{ ...saved, id: 2 }} onDismiss={onDismiss} />);
    act(() => vi.advanceTimersByTime(TOAST_DURATION - 1));

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('closes with its button', () => {
    const onDismiss = vi.fn();
    render(<Toast message={saved} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
