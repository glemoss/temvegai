import type { Restaurant, RestaurantType } from './api/restaurants';

const TYPE_LABELS: Record<RestaurantType, string> = {
  fully_vegan: '100% vegano',
  vegan_options: 'Opções veganas',
};

interface RestaurantDetailsProps {
  restaurant: Restaurant;
  onClose: () => void;
}

export function RestaurantDetails({
  restaurant,
  onClose,
}: RestaurantDetailsProps) {
  return (
    <aside className="restaurant-details" aria-label={restaurant.name}>
      <button
        type="button"
        className="restaurant-details-close"
        onClick={onClose}
        aria-label="Fechar"
      >
        ×
      </button>
      <h2>{restaurant.name}</h2>
      <p className="restaurant-details-type">{TYPE_LABELS[restaurant.type]}</p>
      {restaurant.description && <p>{restaurant.description}</p>}
      <dl>
        <dt>Endereço</dt>
        <dd>{`${restaurant.address} — ${restaurant.neighborhood}`}</dd>
        {restaurant.openingHours && (
          <>
            <dt>Horário</dt>
            <dd>{restaurant.openingHours}</dd>
          </>
        )}
        {restaurant.phone && (
          <>
            <dt>Telefone</dt>
            <dd>
              <a href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
            </dd>
          </>
        )}
        {restaurant.website && (
          <>
            <dt>Site</dt>
            <dd>
              <a href={restaurant.website} target="_blank" rel="noreferrer">
                {restaurant.website}
              </a>
            </dd>
          </>
        )}
        {restaurant.instagram && (
          <>
            <dt>Instagram</dt>
            <dd>
              <a
                href={`https://www.instagram.com/${restaurant.instagram}`}
                target="_blank"
                rel="noreferrer"
              >
                {`@${restaurant.instagram}`}
              </a>
            </dd>
          </>
        )}
      </dl>
    </aside>
  );
}
