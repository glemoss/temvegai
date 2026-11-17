// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '@/components/ui/sonner';
import { InstallPrompt } from './InstallPrompt';

const ANDROID =
  'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';
const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0 Mobile/15E148 Safari/604.1';

const DAY = 24 * 60 * 60 * 1000;

function setUserAgent(userAgent: string) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
}

function setStandalone(standalone: boolean) {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches: standalone,
  } as MediaQueryList);
}

function renderPrompt() {
  render(
    <>
      <InstallPrompt />
      <Toaster closeButton />
    </>,
  );
}

// The install event of Chrome, with the answer the visitor gives in the
// install window of the system.
function fireInstallEvent(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = Object.assign(
    new Event('beforeinstallprompt', { cancelable: true }),
    {
      prompt: vi.fn(() => Promise.resolve()),
      userChoice: Promise.resolve({ outcome }),
    },
  );
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

describe('InstallPrompt', () => {
  beforeEach(() => {
    // jsdom has no matchMedia.
    window.matchMedia = vi.fn();
    setStandalone(false);
    setUserAgent(ANDROID);
  });

  afterEach(() => {
    act(() => toast.dismiss());
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('with the install event', () => {
    it('waits for the event before inviting', () => {
      renderPrompt();

      expect(screen.queryByText('Instale o Tem Veg Aí?')).toBeNull();
    });

    it('opens the install of the system on "Instalar"', async () => {
      renderPrompt();
      const event = fireInstallEvent();

      expect(event.defaultPrevented).toBe(true);
      fireEvent.click(await screen.findByRole('button', { name: 'Instalar' }));

      expect(event.prompt).toHaveBeenCalled();
    });

    it('does not invite again for 30 days when the system install is declined', async () => {
      renderPrompt();
      fireInstallEvent('dismissed');
      fireEvent.click(await screen.findByRole('button', { name: 'Instalar' }));

      await waitFor(() =>
        expect(localStorage.getItem('installPromptDismissedAt')).not.toBeNull(),
      );
    });

    it('hides the invitation once the site is installed', async () => {
      renderPrompt();
      fireInstallEvent();
      await screen.findByText('Instale o Tem Veg Aí?');

      act(() => {
        window.dispatchEvent(new Event('appinstalled'));
      });

      await waitFor(() =>
        expect(screen.queryByText('Instale o Tem Veg Aí?')).toBeNull(),
      );
    });
  });

  describe('on Safari on the iPhone', () => {
    beforeEach(() => setUserAgent(IPHONE_SAFARI));

    it('explains the share menu', async () => {
      renderPrompt();

      expect(
        await screen.findByText('Instale o Tem Veg Aí? no seu iPhone'),
      ).toBeDefined();
      expect(screen.getByText(/Adicionar à Tela de Início/)).toBeDefined();
    });

    it('does not invite again for 30 days after "Entendi"', async () => {
      renderPrompt();
      fireEvent.click(await screen.findByRole('button', { name: 'Entendi' }));
      cleanup();

      renderPrompt();

      expect(
        screen.queryByText('Instale o Tem Veg Aí? no seu iPhone'),
      ).toBeNull();
    });

    it('does not invite again for 30 days after closing', async () => {
      renderPrompt();
      await screen.findByText('Instale o Tem Veg Aí? no seu iPhone');
      fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));

      await waitFor(() =>
        expect(localStorage.getItem('installPromptDismissedAt')).not.toBeNull(),
      );
    });

    it('invites again after 30 days', async () => {
      localStorage.setItem(
        'installPromptDismissedAt',
        String(Date.now() - 31 * DAY),
      );
      renderPrompt();

      expect(
        await screen.findByText('Instale o Tem Veg Aí? no seu iPhone'),
      ).toBeDefined();
    });

    it('does not invite in other browsers on the iPhone', () => {
      setUserAgent(IPHONE_CHROME);
      renderPrompt();

      expect(
        screen.queryByText('Instale o Tem Veg Aí? no seu iPhone'),
      ).toBeNull();
    });
  });

  it('does not invite when the site is already installed', () => {
    setUserAgent(IPHONE_SAFARI);
    setStandalone(true);
    renderPrompt();

    expect(screen.queryByText(/Instale o Tem Veg Aí\?/)).toBeNull();
  });
});
