import { useNavigate } from 'react-router';
import {
  createRestaurant,
  UnauthenticatedError,
  type RestaurantInput,
} from '../api/restaurants';
import { useRestaurantsPage } from './RestaurantsPage';
import { RestaurantDialog } from './RestaurantDialog';
import { RestaurantForm } from './RestaurantForm';
import { emptyRestaurantForm } from './restaurantFormSchema';

// Esc, the close button and Cancel go back to the list.
export function NewRestaurant() {
  const navigate = useNavigate();
  const { onCreated } = useRestaurantsPage();

  function close() {
    navigate('/admin/restaurants', { replace: true });
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
    <RestaurantDialog title="Novo restaurante" onClose={close}>
      <RestaurantForm
        initialValues={emptyRestaurantForm}
        submitLabel="Adicionar"
        submittingLabel="Adicionando…"
        onSubmit={create}
        onCancel={close}
      />
    </RestaurantDialog>
  );
}
