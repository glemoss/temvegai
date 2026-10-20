import { useEffect, useRef } from 'react';
import type { Restaurant } from './api/restaurants';
import { LeafIcon } from './leaf';
import { TYPE_LABELS } from './restaurantTypeLabels';

interface RestaurantDetailsProps {
  restaurant: Restaurant;
  onClose: () => void;
}

export function RestaurantDetails({
  restaurant,
  onClose,
}: RestaurantDetailsProps) {
  const panel = useRef<HTMLElement>(null);

  // Moves the focus into the panel when it opens, so keyboard and screen
  // reader users land on the details, and gives it back to whatever had it
  // (usually the marker) when the panel closes. If the focus has already
  // moved elsewhere, such as to another marker, it stays there.
  useEffect(() => {
    const element = panel.current;
    const previous = document.activeElement;
    element?.focus();

    return () => {
      const active = document.activeElement;
      const focusWasInPanel =
        !active || active === document.body || element?.contains(active);
      if (
        focusWasInPanel &&
        previous instanceof HTMLElement &&
        previous.isConnected
      ) {
        previous.focus();
      }
    };
  }, []);

  // Esc closes the panel wherever the focus is, including on the map.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <aside
      ref={panel}
      className="restaurant-details"
      aria-label={restaurant.name}
      tabIndex={-1}
    >
      <button
        type="button"
        className="restaurant-details-close"
        onClick={onClose}
        aria-label="Fechar"
      >
        <span aria-hidden="true">×</span>
      </button>
      <h2>{restaurant.name}</h2>
      <p className="restaurant-details-type">
        <LeafIcon type={restaurant.type} className="leaf-icon" />
        {TYPE_LABELS[restaurant.type]}
      </p>
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
