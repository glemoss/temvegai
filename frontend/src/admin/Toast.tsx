import { useEffect } from 'react';
import { CheckIcon, CloseIcon } from './icons';

// How long a toast stays on screen.
export const TOAST_DURATION = 4000;

export interface ToastMessage {
  // Tells two equal messages apart, so each gets its full time.
  id: number;
  text: string;
}

interface ToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
}

// A short notice at the bottom of the screen that goes away by itself. The
// region is always present, so screen readers announce what appears in it.
export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div role="status" className="admin-toast-region">
      {message && (
        <div key={message.id} className="admin-toast">
          <CheckIcon />
          <p>{message.text}</p>
          <button
            type="button"
            className="admin-icon-button admin-icon-button-small admin-toast-close"
            aria-label="Fechar aviso"
            title="Fechar aviso"
            onClick={onDismiss}
          >
            <CloseIcon />
          </button>
        </div>
      )}
    </div>
  );
}
