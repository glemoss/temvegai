import { Share } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

const INSTALL_TOAST = 'pwa-install';
// When the visitor closed the invitation, kept only on the device.
const DISMISSED_AT_KEY = 'installPromptDismissedAt';
const DISMISS_DAYS = 30;

// The event Chrome and Edge fire when the site can be installed. It is
// not in the DOM types of TypeScript.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isInstalled(): boolean {
  return (
    (window.matchMedia?.('(display-mode: standalone)')?.matches ?? false) ||
    ('standalone' in navigator && navigator.standalone === true)
  );
}

// Safari on the iPhone or iPad, which has no install event: the site can
// only explain the way through the share menu. The iPad says it is a Mac,
// told apart by the touch screen; other browsers on iOS add their name.
function isIosSafari(): boolean {
  const { userAgent, maxTouchPoints } = navigator;
  const ios =
    /iPhone|iPad|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  return ios && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
}

function wasDismissedRecently(): boolean {
  const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY));
  return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function rememberDismissal() {
  localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
}

// The invitation to install the site, at the bottom of the map, while it
// is not installed. With the install event (Android and computers), the
// "Instalar" button opens the install of the system; on the iPhone, it
// explains the share menu. Once closed, it comes back only after 30 days.
export function InstallPrompt() {
  useEffect(() => {
    if (isInstalled() || wasDismissedRecently()) {
      return;
    }

    if (isIosSafari()) {
      toast('Instale o Tem Veg Aí? no seu iPhone', {
        id: INSTALL_TOAST,
        duration: Infinity,
        description: (
          <>
            Toque em <Share className="inline size-4 align-text-bottom" />
            <span className="sr-only">Compartilhar</span> e depois em
            &ldquo;Adicionar à Tela de Início&rdquo;.
          </>
        ),
        action: { label: 'Entendi', onClick: rememberDismissal },
        onDismiss: rememberDismissal,
      });
      return;
    }

    function offerInstall(event: Event) {
      const installEvent = event as BeforeInstallPromptEvent;
      // Without this, Chrome may show its own bar as well.
      event.preventDefault();
      toast('Instale o Tem Veg Aí?', {
        id: INSTALL_TOAST,
        duration: Infinity,
        description: 'Abra o mapa direto da tela inicial, como um app.',
        action: {
          label: 'Instalar',
          onClick: () => {
            void installEvent.prompt();
            void installEvent.userChoice.then(({ outcome }) => {
              if (outcome === 'dismissed') {
                rememberDismissal();
              }
            });
          },
        },
        onDismiss: rememberDismissal,
      });
    }
    function hideOffer() {
      toast.dismiss(INSTALL_TOAST);
    }

    window.addEventListener('beforeinstallprompt', offerInstall);
    window.addEventListener('appinstalled', hideOffer);
    return () => {
      window.removeEventListener('beforeinstallprompt', offerInstall);
      window.removeEventListener('appinstalled', hideOffer);
    };
  }, []);

  return null;
}
