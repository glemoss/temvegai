import { useCallback, useState } from 'react';
import { Outlet, useOutletContext } from 'react-router';
import type { Restaurant } from '../api/restaurants';
import { RestaurantList } from './RestaurantList';
import { Toast, type ToastMessage } from './Toast';
import { useAdminRestaurants } from './useAdminRestaurants';

interface AdminHomeContext {
  onCreated: (restaurant: Restaurant) => void;
}

// The list of restaurants, with the forms opening over it as modals in
// child routes.
export function AdminHome() {
  const [restaurants, reload] = useAdminRestaurants();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const context: AdminHomeContext = {
    onCreated: (restaurant) => {
      setToast({
        id: Date.now(),
        text: `Restaurante “${restaurant.name}” adicionado.`,
      });
      reload();
    },
  };

  return (
    <>
      <RestaurantList state={restaurants} />
      <Outlet context={context} />
      <Toast message={toast} onDismiss={dismissToast} />
    </>
  );
}

// For the modals opened over the list.
export function useAdminHome(): AdminHomeContext {
  return useOutletContext<AdminHomeContext>();
}
