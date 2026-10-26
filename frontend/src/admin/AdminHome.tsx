import { useState } from 'react';
import { Outlet, useOutletContext } from 'react-router';
import { toast } from 'sonner';
import type { Restaurant } from '../api/restaurants';
import { DeleteRestaurantDialog } from './DeleteRestaurantDialog';
import { RestaurantList } from './RestaurantList';
import { useAdminRestaurants } from './useAdminRestaurants';

interface AdminHomeContext {
  onCreated: (restaurant: Restaurant) => void;
  onUpdated: (restaurant: Restaurant) => void;
  // The restaurant being saved no longer exists.
  onNotFound: () => void;
}

// The list of restaurants, with the forms opening over it as modals in
// child routes. The removal confirmation has no route of its own.
export function AdminHome() {
  const [restaurants, reload] = useAdminRestaurants();
  const [deleting, setDeleting] = useState<Restaurant | null>(null);

  function notFound() {
    toast.error('Oops, esse restaurante não existe mais.');
    reload();
  }

  const context: AdminHomeContext = {
    onCreated: (restaurant) => {
      toast.success(`Restaurante “${restaurant.name}” adicionado.`);
      reload();
    },
    onUpdated: (restaurant) => {
      toast.success(`Restaurante “${restaurant.name}” atualizado.`);
      reload();
    },
    onNotFound: notFound,
  };

  return (
    <>
      <RestaurantList state={restaurants} onDelete={setDeleting} />
      <Outlet context={context} />
      {deleting && (
        <DeleteRestaurantDialog
          restaurant={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(restaurant) => {
            setDeleting(null);
            toast.success(`Restaurante “${restaurant.name}” removido.`);
            reload();
          }}
          onNotFound={() => {
            setDeleting(null);
            notFound();
          }}
        />
      )}
    </>
  );
}

// For the modals opened over the list.
export function useAdminHome(): AdminHomeContext {
  return useOutletContext<AdminHomeContext>();
}
