// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '@/components/ui/sonner';
import { createSuggestion, TooManySuggestionsError } from './api/suggestions';
import { SuggestRestaurant } from './SuggestRestaurant';

vi.mock('./api/suggestions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api/suggestions')>()),
  createSuggestion: vi.fn(),
}));

function open() {
  render(
    <>
      <SuggestRestaurant />
      <Toaster />
    </>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Sugerir restaurante' }));
}

function dialog() {
  return screen.queryByRole('dialog', { name: 'Sugerir restaurante' });
}

function field() {
  return screen.getByLabelText('Nome ou link');
}

function type(value: string) {
  fireEvent.change(field(), { target: { value } });
}

function sendButton() {
  return screen.getByRole('button', { name: 'Enviar' });
}

beforeEach(() => {
  vi.mocked(createSuggestion).mockReset();
});

afterEach(() => {
  cleanup();
});

describe('SuggestRestaurant', () => {
  it('opens a dialog with the field and the counter', () => {
    open();

    expect(dialog()).not.toBeNull();
    expect(field().getAttribute('maxLength')).toBe('300');
    expect(screen.getByText('0/300')).not.toBeNull();
  });

  it('counts the typed characters', () => {
    open();
    type('Kairú, no Rio Tavares');

    expect(screen.getByText('21/300')).not.toBeNull();
  });

  it('only sends when there is text', () => {
    open();
    expect(sendButton().hasAttribute('disabled')).toBe(true);

    type('   ');
    expect(sendButton().hasAttribute('disabled')).toBe(true);

    type('Kairú');
    expect(sendButton().hasAttribute('disabled')).toBe(false);
  });

  it('sends the trimmed text, thanks and closes the dialog', async () => {
    vi.mocked(createSuggestion).mockResolvedValue();
    open();
    type('  Kairú, no Rio Tavares  ');
    fireEvent.click(sendButton());

    expect(
      await screen.findByText(
        'Obrigado! Sua sugestão foi enviada e será revisada.',
      ),
    ).not.toBeNull();
    expect(createSuggestion).toHaveBeenCalledWith('Kairú, no Rio Tavares');
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('starts empty after a suggestion was sent', async () => {
    vi.mocked(createSuggestion).mockResolvedValue();
    open();
    type('Kairú');
    fireEvent.click(sendButton());
    await waitFor(() => expect(dialog()).toBeNull());

    fireEvent.click(
      screen.getByRole('button', { name: 'Sugerir restaurante' }),
    );

    expect((field() as HTMLTextAreaElement).value).toBe('');
  });

  it('warns when the limit of suggestions was reached', async () => {
    vi.mocked(createSuggestion).mockRejectedValue(
      new TooManySuggestionsError(),
    );
    open();
    type('Kairú');
    fireEvent.click(sendButton());

    expect(
      await screen.findByText(
        'Você já enviou muitas sugestões. Tente novamente mais tarde.',
      ),
    ).not.toBeNull();
  });

  it('keeps the dialog and the text when sending fails', async () => {
    vi.mocked(createSuggestion).mockRejectedValue(new Error('offline'));
    open();
    type('Kairú');
    fireEvent.click(sendButton());

    expect(
      await screen.findByText(
        'Não foi possível enviar a sugestão. Tente novamente.',
      ),
    ).not.toBeNull();
    expect(dialog()).not.toBeNull();
    expect((field() as HTMLTextAreaElement).value).toBe('Kairú');
  });
});
