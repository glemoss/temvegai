import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  deleteRestaurant,
  RestaurantNotFoundError,
  UnauthenticatedError,
  type Restaurant,
} from '../api/restaurants';

interface DeleteRestaurantDialogProps {
  restaurant: Restaurant;
  onClose: () => void;
  onDeleted: (restaurant: Restaurant) => void;
  // Removed by someone else before the confirmation.
  onNotFound: () => void;
}

// Asks before removing. While the removal is on its way the dialog cannot
// be closed, so the admin sees how it ended.
export function DeleteRestaurantDialog({
  restaurant,
  onClose,
  onDeleted,
  onNotFound,
}: DeleteRestaurantDialogProps) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function confirm() {
    setDeleting(true);
    setFailed(false);
    try {
      await deleteRestaurant(restaurant.id);
      onDeleted(restaurant);
    } catch (reason) {
      if (reason instanceof UnauthenticatedError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      if (reason instanceof RestaurantNotFoundError) {
        onNotFound();
        return;
      }
      setDeleting(false);
      setFailed(true);
    }
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !deleting) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-secondary-foreground">
            Remover restaurante?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            “{restaurant.name}” será removido do mapa e do painel. Essa ação não
            pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p role="alert" className="font-semibold text-destructive empty:hidden">
          {failed &&
            'Não foi possível remover o restaurante. Tente novamente mais tarde.'}
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={deleting}>
            Cancelar
          </AlertDialogCancel>
          {/* A plain button rather than AlertDialogAction, which would
            close the dialog before the API answers. */}
          <Button
            type="button"
            variant="destructive"
            size="lg"
            disabled={deleting}
            onClick={confirm}
          >
            {deleting ? 'Removendo…' : 'Remover'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
