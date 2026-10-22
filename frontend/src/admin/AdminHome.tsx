import { Outlet, useOutletContext } from 'react-router';
import { toast } from 'sonner';
import type { Restaurant } from '../api/restaurants';
import { RestaurantList } from './RestaurantList';
import { useAdminRestaurants } from './useAdminRestaurants';

interface AdminHomeContext {
  onCreated: (restaurant: Restaurant) => void;
}

// The list of restaurants, with the forms opening over it as modals in
// child routes.
export function AdminHome() {
  const [restaurants, reload] = useAdminRestaurants();

  const context: AdminHomeContext = {
    onCreated: (restaurant) => {
      toast.success(`Restaurante “${restaurant.name}” adicionado.`);
      reload();
    },
  };

  return (
    <>
      <RestaurantList state={restaurants} />
      <Outlet context={context} />
    </>
  );
}

// For the modals opened over the list.
export function useAdminHome(): AdminHomeContext {
  return useOutletContext<AdminHomeContext>();
}
