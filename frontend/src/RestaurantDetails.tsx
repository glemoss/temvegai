import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Restaurant } from './api/restaurants';
import { displayWebsite } from './displayWebsite';
import { LeafIcon } from './leaf';
import { OpeningHours } from './OpeningHours';
import { TYPE_LABELS } from './restaurantTypeLabels';

// The labels of the fields, and the values below them.
const TERM =
  'text-[0.8125rem] font-semibold tracking-[0.04em] text-muted-foreground uppercase';
const DESCRIPTION = 'mt-0.5 mb-3.5 wrap-anywhere';
const LINK = 'font-semibold text-primary underline';

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
    // A panel on the right, or a sheet at the bottom on narrow screens.
    <aside
      ref={panel}
      className="absolute top-0 right-0 z-(--z-overlay) max-h-dvh w-96 overflow-y-auto bg-card px-6 pt-5 pb-6 shadow-(--shadow) focus:outline-none max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[60dvh] max-sm:w-auto max-sm:rounded-t-lg max-sm:px-5 max-sm:pt-4 max-sm:pb-5"
      aria-label={restaurant.name}
      tabIndex={-1}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-6"
        onClick={onClose}
        aria-label="Fechar"
      >
        <X aria-hidden="true" />
      </Button>
      <h2 className="mr-10 mb-2 text-2xl leading-tight font-bold text-secondary-foreground">
        {restaurant.name}
      </h2>
      <Badge
        variant="secondary"
        className="mb-3 flex gap-1.5 py-1 pr-3 pl-2 text-sm font-semibold [&>svg]:size-[1.1rem]"
      >
        <LeafIcon type={restaurant.type} />
        {TYPE_LABELS[restaurant.type]}
      </Badge>
      {restaurant.description && <p>{restaurant.description}</p>}
      <dl className="mt-4">
        <dt className={TERM}>Endereço</dt>
        <dd
          className={DESCRIPTION}
        >{`${restaurant.address} — ${restaurant.neighborhood}`}</dd>
        {restaurant.openingHours && (
          <>
            <dt className={TERM}>Horário</dt>
            <dd className={DESCRIPTION}>
              <OpeningHours hours={restaurant.openingHours} />
            </dd>
          </>
        )}
        {restaurant.phone && (
          <>
            <dt className={TERM}>Telefone</dt>
            <dd className={DESCRIPTION}>
              <a className={LINK} href={`tel:${restaurant.phone}`}>
                {restaurant.phone}
              </a>
            </dd>
          </>
        )}
        {restaurant.website && (
          <>
            <dt className={TERM}>Site</dt>
            <dd className={DESCRIPTION}>
              <a
                className={LINK}
                href={restaurant.website}
                target="_blank"
                rel="noreferrer"
              >
                {displayWebsite(restaurant.website)}
              </a>
            </dd>
          </>
        )}
        {restaurant.instagram && (
          <>
            <dt className={TERM}>Instagram</dt>
            <dd className={DESCRIPTION}>
              <a
                className={LINK}
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
