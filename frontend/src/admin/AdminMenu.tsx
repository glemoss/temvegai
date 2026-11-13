import { Lightbulb, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SuggestionStatus } from '../api/suggestions';
import type { AdminSuggestionsState } from './useAdminSuggestions';

// Suggestions that wait for the admin: ready to review, or failed and to be
// processed again or rejected.
const PENDING: readonly SuggestionStatus[] = ['ready', 'failed'];

export function pendingCount(state: AdminSuggestionsState): number {
  return state.status === 'success'
    ? state.suggestions.filter(({ status }) => PENDING.includes(status)).length
    : 0;
}

function ModuleLink({
  to,
  label,
  icon: Icon,
  count = 0,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}) {
  return (
    <NavLink
      to={to}
      aria-label={
        count > 0
          ? `${label}, ${count} ${count === 1 ? 'pendente' : 'pendentes'}`
          : label
      }
      title={label}
      className={({ isActive }) =>
        cn(
          buttonVariants({
            variant: isActive ? 'default' : 'ghost',
            size: 'icon-lg',
          }),
          'relative',
          !isActive && 'text-muted-foreground',
        )
      }
    >
      <Icon className="size-5" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-white"
        >
          {count}
        </span>
      )}
    </NavLink>
  );
}

// The modules of the panel, as icons in a row; the name shows on hover and
// is read by screen readers.
export function AdminMenu({
  suggestions,
}: {
  suggestions: AdminSuggestionsState;
}) {
  return (
    <nav aria-label="Módulos do painel" className="flex gap-2">
      <ModuleLink
        to="/admin/restaurants"
        label="Restaurantes"
        icon={UtensilsCrossed}
      />
      <ModuleLink
        to="/admin/suggestions"
        label="Sugestões"
        icon={Lightbulb}
        count={pendingCount(suggestions)}
      />
    </nav>
  );
}
