import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  createRestaurant,
  UnauthenticatedError,
  type RestaurantInput,
} from '../api/restaurants';
import { useAdminHome } from './AdminHome';
import { CloseIcon } from './icons';
import { RestaurantForm } from './RestaurantForm';
import { emptyRestaurantForm } from './restaurantFormSchema';

// A modal over the list. Esc, the close button and Cancel go back to the
// list; a click outside does not, so nothing typed is lost by accident.
export function NewRestaurant() {
  const navigate = useNavigate();
  const { onCreated } = useAdminHome();
  // The map inside the form measures itself when created, so the form is
  // only rendered once the dialog is open and has a size.
  const [open, setOpen] = useState(false);

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
    <dialog
      ref={(node) => {
        if (node && !node.open) {
          node.showModal();
          setOpen(true);
        }
      }}
      className="admin-modal"
      aria-labelledby="new-restaurant-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <header className="admin-modal-header">
        <h2 id="new-restaurant-title" className="admin-subtitle">
          Novo restaurante
        </h2>
        <button
          type="button"
          className="admin-icon-button admin-icon-button-quiet"
          aria-label="Fechar"
          title="Fechar"
          onClick={close}
        >
          <CloseIcon />
        </button>
      </header>
      {open && (
        <RestaurantForm
          initialValues={emptyRestaurantForm}
          submitLabel="Adicionar"
          submittingLabel="Adicionando…"
          onSubmit={create}
          onCancel={close}
        />
      )}
    </dialog>
  );
}
