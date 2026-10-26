import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface RestaurantDialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// The modal of the restaurant forms, over the list. Esc and the close
// button call onClose; a click outside does not, so nothing typed is lost
// by accident.
export function RestaurantDialog({
  title,
  onClose,
  children,
}: RestaurantDialogProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* Full screen on narrow screens. The content scrolls inside the
        modal, under the header. */}
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        onInteractOutside={(event) => event.preventDefault()}
        className="block max-h-[calc(100%-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl max-sm:h-full max-sm:max-h-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background px-6 py-4 max-sm:px-4 max-sm:py-3">
          <DialogTitle className="text-xl font-bold text-secondary-foreground">
            {title}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="text-muted-foreground"
              aria-label="Fechar"
              title="Fechar"
            >
              <X className="size-5" />
            </Button>
          </DialogClose>
        </header>
        {children}
      </DialogContent>
    </Dialog>
  );
}
