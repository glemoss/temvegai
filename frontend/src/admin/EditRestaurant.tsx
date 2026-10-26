import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { cn } from '@/lib/utils';
import {
  fetchRestaurant,
  RestaurantNotFoundError,
  UnauthenticatedError,
  updateRestaurant,
  type Restaurant,
  type RestaurantInput,
} from '../api/restaurants';
import { useAdminHome } from './AdminHome';
import { RestaurantDialog } from './RestaurantDialog';
import { RestaurantForm } from './RestaurantForm';
import { toRestaurantFormValues } from './restaurantFormSchema';

type EditState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'success'; restaurant: Restaurant };

const MESSAGE = 'p-6 max-sm:p-4';

const ERROR = cn(MESSAGE, 'font-semibold text-destructive');

// The restaurant is loaded from the API rather than from the list, so an
// edit opened from its address works too. Esc, the close button and
// Cancel go back to the list.
export function EditRestaurant() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { onUpdated, onNotFound } = useAdminHome();
  const [state, setState] = useState<EditState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    fetchRestaurant(id, controller.signal).then(
      (restaurant) =>
        setState(
          restaurant
            ? { status: 'success', restaurant }
            : { status: 'not-found' },
        ),
      () => {
        if (!controller.signal.aborted) {
          setState({ status: 'error' });
        }
      },
    );

    return () => controller.abort();
  }, [id]);

  function close() {
    navigate('/admin', { replace: true });
  }

  async function save(input: RestaurantInput) {
    try {
      const restaurant = await updateRestaurant(id, input);
      onUpdated(restaurant);
      close();
    } catch (reason) {
      if (reason instanceof UnauthenticatedError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      // Removed while the form was open; the list is reloaded without it.
      if (reason instanceof RestaurantNotFoundError) {
        onNotFound();
        close();
        return;
      }
      throw reason;
    }
  }

  return (
    <RestaurantDialog title="Editar restaurante" onClose={close}>
      {state.status === 'loading' && (
        <p role="status" className={MESSAGE}>
          Carregando restaurante…
        </p>
      )}
      {state.status === 'not-found' && (
        <p role="alert" className={ERROR}>
          Restaurante não encontrado.
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className={ERROR}>
          Não foi possível carregar o restaurante. Tente novamente mais tarde.
        </p>
      )}
      {state.status === 'success' && (
        <RestaurantForm
          initialValues={toRestaurantFormValues(state.restaurant)}
          submitLabel="Salvar"
          submittingLabel="Salvando…"
          onSubmit={save}
          onCancel={close}
        />
      )}
    </RestaurantDialog>
  );
}
