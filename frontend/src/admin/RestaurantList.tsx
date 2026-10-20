import { useState } from 'react';
import { TYPE_LABELS } from '../restaurantTypeLabels';
import { useAdminRestaurants } from './useAdminRestaurants';

// Lower case and without accents, so "conceicao" finds "Conceição", like
// the `unaccent` search of the API.
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function RestaurantList() {
  const state = useAdminRestaurants();
  const [search, setSearch] = useState('');

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

  return (
    <section className="admin-restaurants" aria-labelledby="restaurants-title">
      <h2 id="restaurants-title" className="admin-subtitle">
        Restaurantes
      </h2>
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
      {restaurants.length === 0 ? (
        <p role="status" className="admin-message">
          Nenhum restaurante com esse nome.
        </p>
      ) : (
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
      )}
    </section>
  );
}
