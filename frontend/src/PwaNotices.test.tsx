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
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Toaster } from '@/components/ui/sonner';
import { PwaNotices } from './PwaNotices';

vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW: vi.fn() }));

const updateServiceWorker = vi.fn(() => Promise.resolve());

function mockRegisterSW(needRefresh: boolean) {
  vi.mocked(useRegisterSW).mockReturnValue({
    needRefresh: [needRefresh, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  });
}

function setOnline(online: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
}

function renderNotices() {
  render(
    <>
      <PwaNotices />
      <Toaster />
    </>,
  );
}

const OFFLINE_MESSAGE = /Sem conexão com a internet/;

describe('PwaNotices', () => {
  beforeEach(() => {
    mockRegisterSW(false);
    setOnline(true);
  });

  afterEach(() => {
    act(() => toast.dismiss());
    cleanup();
    vi.restoreAllMocks();
    updateServiceWorker.mockClear();
  });

  it('shows nothing when online and up to date', () => {
    renderNotices();

    expect(screen.queryByText('Nova versão disponível.')).toBeNull();
    expect(screen.queryByText(OFFLINE_MESSAGE)).toBeNull();
  });

  it('updates only when the visitor taps "Atualizar"', async () => {
    mockRegisterSW(true);
    renderNotices();

    await screen.findByText('Nova versão disponível.');
    expect(updateServiceWorker).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));

    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('warns when the site opens without internet', async () => {
    setOnline(false);
    renderNotices();

    expect(await screen.findByText(OFFLINE_MESSAGE)).toBeDefined();
  });

  it('warns when the connection drops and hides when it comes back', async () => {
    renderNotices();

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await screen.findByText(OFFLINE_MESSAGE);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    await waitFor(() => expect(screen.queryByText(OFFLINE_MESSAGE)).toBeNull());
  });
});
