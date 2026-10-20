import { useId, useState, type KeyboardEvent } from 'react';
import type { Restaurant } from './api/restaurants';
import { useDebouncedValue } from './useDebouncedValue';
import { useRestaurantSuggestions } from './useRestaurantSuggestions';

// Waits for a pause in typing before asking for suggestions, instead of
// one request per key.
const SUGGESTIONS_DELAY_MS = 300;

interface RestaurantSearchProps {
  value: string;
  onChange: (value: string) => void;
  // Enter with no suggestion highlighted: search the map by name.
  onSubmit: () => void;
  onSelect: (restaurant: Restaurant) => void;
}

// A search field with a list of suggestions below it, following the ARIA
// combobox pattern: the focus stays in the field and the arrow keys move
// the highlighted suggestion.
export function RestaurantSearch({
  value,
  onChange,
  onSubmit,
  onSelect,
}: RestaurantSearchProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();

  const debouncedValue = useDebouncedValue(value, SUGGESTIONS_DELAY_MS);
  const suggestions = useRestaurantSuggestions(debouncedValue);
  const restaurants =
    suggestions.status === 'success' ? suggestions.restaurants : [];

  const showPopup =
    open &&
    value.trim() !== '' &&
    (suggestions.status === 'success' || suggestions.status === 'error');
  const showList = showPopup && restaurants.length > 0;
  const active = showList ? restaurants[activeIndex] : undefined;

  function close() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function select(restaurant: Restaurant) {
    close();
    onSelect(restaurant);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!showList) {
          setOpen(true);
          return;
        }
        setActiveIndex(Math.min(activeIndex + 1, restaurants.length - 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        // Going up from the first suggestion goes back to the typed text.
        setActiveIndex(Math.max(activeIndex - 1, -1));
        return;
      case 'Enter':
        event.preventDefault();
        if (active) {
          select(active);
        } else {
          close();
          onSubmit();
        }
        return;
      case 'Escape':
        if (showPopup) {
          // Closes only the list: the details panel listens for Esc on the
          // document, and the browser would clear the search field.
          event.preventDefault();
          event.stopPropagation();
          close();
        }
        return;
    }
  }

  return (
    <div className="restaurant-search">
      <label>
        {/* The placeholder already says what the field is for; the label
            stays for screen readers. */}
        <span className="visually-hidden">Nome</span>
        <input
          type="search"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={
            active ? `${listId}-${activeIndex}` : undefined
          }
          value={value}
          placeholder="Buscar restaurante"
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onBlur={close}
        />
      </label>
      {showPopup && (
        <div className="restaurant-search-popup">
          {showList ? (
            <ul id={listId} role="listbox" aria-label="Sugestões">
              {restaurants.map((restaurant, index) => (
                <li
                  key={restaurant.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className="restaurant-search-option"
                  // Keeps the focus in the field, so the click is not lost
                  // to the blur that closes the list.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(restaurant)}
                >
                  <span className="restaurant-search-name">
                    {restaurant.name}
                  </span>
                  <span className="restaurant-search-neighborhood">
                    {restaurant.neighborhood}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="restaurant-search-message">
              {suggestions.status === 'error'
                ? 'Não foi possível buscar sugestões.'
                : 'Nenhum restaurante com esse nome.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
