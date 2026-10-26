import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { normalize } from '../normalize';
import { TYPE_LABELS } from '../restaurantTypeLabels';
import type { Restaurant } from '../api/restaurants';
import type { AdminRestaurantsState } from './useAdminRestaurants';

interface RestaurantListProps {
  state: AdminRestaurantsState;
  onDelete: (restaurant: Restaurant) => void;
}

export function RestaurantList({ state, onDelete }: RestaurantListProps) {
  const [search, setSearch] = useState('');
  const searchId = useId();
  const hasRestaurants =
    state.status === 'success' && state.restaurants.length > 0;

  return (
    <section
      className="mx-auto mt-6 flex max-w-240 flex-col gap-3"
      aria-labelledby="restaurants-title"
    >
      <h2
        id="restaurants-title"
        className="text-xl font-bold text-secondary-foreground"
      >
        Restaurantes
      </h2>
      {/* The search on the left and the add button at the right end, which
        stays even when there is nothing to search. */}
      <div className="flex items-end gap-3">
        {hasRestaurants && (
          <div className="flex max-w-88 flex-1 flex-col gap-2">
            <Label htmlFor={searchId}>Buscar por nome</Label>
            <Input
              id={searchId}
              type="search"
              name="search"
              autoComplete="off"
              className="bg-card"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        )}
        <Button asChild size="icon-lg" className="ml-auto">
          <Link
            to="restaurants/new"
            aria-label="Novo restaurante"
            title="Novo restaurante"
          >
            <Plus className="size-5" />
          </Link>
        </Button>
      </div>
      <RestaurantTable state={state} search={search} onDelete={onDelete} />
    </section>
  );
}

function RestaurantTable({
  state,
  search,
  onDelete,
}: {
  state: AdminRestaurantsState;
  search: string;
  onDelete: (restaurant: Restaurant) => void;
}) {
  if (state.status === 'loading') {
    return <p role="status">Carregando restaurantes…</p>;
  }

  if (state.status === 'error') {
    return (
      <p role="alert" className="font-semibold text-destructive">
        Não foi possível carregar os restaurantes. Tente novamente mais tarde.
      </p>
    );
  }

  if (state.restaurants.length === 0) {
    return <p role="status">Nenhum restaurante cadastrado.</p>;
  }

  const term = normalize(search.trim());
  const restaurants = term
    ? state.restaurants.filter((restaurant) =>
        normalize(restaurant.name).includes(term),
      )
    : state.restaurants;

  if (restaurants.length === 0) {
    return <p role="status">Nenhum restaurante com esse nome.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-(--shadow)">
      <Table className="text-base">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              scope="col"
              className="px-4 text-sm text-muted-foreground"
            >
              Nome
            </TableHead>
            <TableHead
              scope="col"
              className="px-4 text-sm text-muted-foreground"
            >
              Tipo
            </TableHead>
            <TableHead
              scope="col"
              className="px-4 text-sm text-muted-foreground"
            >
              Bairro
            </TableHead>
            <TableHead scope="col" className="w-0 px-2">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {restaurants.map((restaurant) => (
            <TableRow key={restaurant.id}>
              <TableCell className="px-4 py-3">{restaurant.name}</TableCell>
              <TableCell className="px-4 py-3">
                {TYPE_LABELS[restaurant.type]}
              </TableCell>
              <TableCell className="px-4 py-3">
                {restaurant.neighborhood}
              </TableCell>
              <TableCell className="px-2 py-1 text-right whitespace-nowrap">
                <Button
                  asChild
                  variant="ghost"
                  size="icon-lg"
                  className="text-muted-foreground"
                >
                  <Link
                    to={`restaurants/${restaurant.id}/edit`}
                    aria-label={`Editar ${restaurant.name}`}
                    title="Editar"
                  >
                    <Pencil className="size-5" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remover ${restaurant.name}`}
                  title="Remover"
                  onClick={() => onDelete(restaurant)}
                >
                  <Trash2 className="size-5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
