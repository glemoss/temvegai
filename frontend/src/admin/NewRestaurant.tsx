import { X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createRestaurant,
  UnauthenticatedError,
  type RestaurantInput,
} from '../api/restaurants';
import { useAdminHome } from './AdminHome';
import { RestaurantForm } from './RestaurantForm';
import { emptyRestaurantForm } from './restaurantFormSchema';

// A modal over the list. Esc, the close button and Cancel go back to the
// list; a click outside does not, so nothing typed is lost by accident.
export function NewRestaurant() {
  const navigate = useNavigate();
  const { onCreated } = useAdminHome();

  function close() {
    navigate('/admin', { replace: true });
  }

  async function create(input: RestaurantInput) {
    try {
      const restaurant = await createRestaurant(input);
      onCreated(restaurant);
      close();
    } catch (reason) {
      if (reason instanceof UnauthenticatedError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      throw reason;
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
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
            Novo restaurante
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
        <RestaurantForm
          initialValues={emptyRestaurantForm}
          submitLabel="Adicionar"
          submittingLabel="Adicionando…"
          onSubmit={create}
          onCancel={close}
        />
      </DialogContent>
    </Dialog>
  );
}
