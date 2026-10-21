import { useState } from 'react';
import { Link } from 'react-router';
import { normalize } from '../normalize';
import { TYPE_LABELS } from '../restaurantTypeLabels';
import { PlusIcon } from './icons';
import type { AdminRestaurantsState } from './useAdminRestaurants';

interface RestaurantListProps {
  state: AdminRestaurantsState;
}

export function RestaurantList({ state }: RestaurantListProps) {
  const [search, setSearch] = useState('');
  const hasRestaurants =
    state.status === 'success' && state.restaurants.length > 0;

  return (
    <section className="admin-restaurants" aria-labelledby="restaurants-title">
      <h2 id="restaurants-title" className="admin-subtitle">
        Restaurantes
      </h2>
      {/* The button to add stays even when there is nothing to search. */}
      <div className="admin-toolbar">
        {hasRestaurants && (
          <label className="admin-search">
            Buscar por nome
            <input
              type="search"
              name="search"
              autoComplete="off"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        )}
        <Link
          to="restaurants/new"
          className="admin-icon-button admin-add"
          aria-label="Novo restaurante"
          title="Novo restaurante"
        >
          <PlusIcon />
        </Link>
      </div>
      <RestaurantTable state={state} search={search} />
    </section>
  );
}

function RestaurantTable({
  state,
  search,
}: {
  state: AdminRestaurantsState;
  search: string;
}) {
  if (state.status === 'loading') {
    return (
      <p role="status" className="admin-message">
        Carregando restaurantes…
      </p>
    );
  }

  if (state.status === 'error') {
    return (
      <p role="alert" className="admin-error admin-message">
        Não foi possível carregar os restaurantes. Tente novamente mais tarde.
      </p>
    );
  }

  if (state.restaurants.length === 0) {
    return (
      <p role="status" className="admin-message">
        Nenhum restaurante cadastrado.
      </p>
    );
  }

  const term = normalize(search.trim());
  const restaurants = term
    ? state.restaurants.filter((restaurant) =>
        normalize(restaurant.name).includes(term),
      )
    : state.restaurants;

  if (restaurants.length === 0) {
    return (
      <p role="status" className="admin-message">
        Nenhum restaurante com esse nome.
      </p>
    );
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Tipo</th>
            <th scope="col">Bairro</th>
          </tr>
        </thead>
        <tbody>
          {restaurants.map((restaurant) => (
            <tr key={restaurant.id}>
              <td>{restaurant.name}</td>
              <td>{TYPE_LABELS[restaurant.type]}</td>
              <td>{restaurant.neighborhood}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
