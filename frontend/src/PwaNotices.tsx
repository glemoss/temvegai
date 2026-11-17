import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_TOAST = 'pwa-update';
const OFFLINE_TOAST = 'pwa-offline';

// The notices of the installed site: a new version waiting to take over,
// which only happens when the visitor taps "Atualizar", so a form being
// filled in the panel is not lost, and the device without internet, which
// the map and the restaurants need.
export function PwaNotices() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh) {
      return;
    }
    toast('Nova versão disponível.', {
      id: UPDATE_TOAST,
      duration: Infinity,
      action: {
        label: 'Atualizar',
        onClick: () => void updateServiceWorker(true),
      },
    });
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    function showOffline() {
      toast.warning(
        'Sem conexão com a internet. O mapa e os restaurantes voltam quando ela voltar.',
        { id: OFFLINE_TOAST, duration: Infinity },
      );
    }
    function hideOffline() {
      toast.dismiss(OFFLINE_TOAST);
    }

    if (!navigator.onLine) {
      showOffline();
    }
    window.addEventListener('offline', showOffline);
    window.addEventListener('online', hideOffline);
    return () => {
      window.removeEventListener('offline', showOffline);
      window.removeEventListener('online', hideOffline);
    };
  }, []);

  return null;
}
