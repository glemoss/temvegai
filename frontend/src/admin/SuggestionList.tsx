import { RotateCw, SquarePen, X } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TYPE_LABELS } from '../restaurantTypeLabels';
import type {
  RestaurantDraft,
  Suggestion,
  SuggestionStatus,
} from '../api/suggestions';
import {
  isStaleProcessing,
  type AdminSuggestionsState,
} from './useAdminSuggestions';

const STATUS_LABELS: Record<SuggestionStatus, string> = {
  pending: 'Na fila',
  processing: 'Processando',
  ready: 'Pronta para revisar',
  failed: 'Falhou',
  approved: 'Aprovada',
  rejected: 'Recusada',
};

const STATUS_VARIANTS: Record<
  SuggestionStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  processing: 'secondary',
  ready: 'default',
  failed: 'destructive',
  approved: 'outline',
  rejected: 'outline',
};

const REJECTABLE: readonly SuggestionStatus[] = ['pending', 'ready', 'failed'];

function canRetry(suggestion: Suggestion, loadedAt: number): boolean {
  return (
    suggestion.status === 'failed' || isStaleProcessing(suggestion, loadedAt)
  );
}

// Name, type and neighborhood the AI found, as far as it found them.
function draftSummary(draft: RestaurantDraft): string {
  return [draft.name, draft.type && TYPE_LABELS[draft.type], draft.neighborhood]
    .filter(Boolean)
    .join(' · ');
}

interface SuggestionListProps {
  state: AdminSuggestionsState;
  // The suggestion being put back in the queue, while the API answers.
  retryingId: string | null;
  onReject: (suggestion: Suggestion) => void;
  onRetry: (suggestion: Suggestion) => void;
}

export function SuggestionList(props: SuggestionListProps) {
  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="suggestions-title"
    >
      <h2
        id="suggestions-title"
        className="text-xl font-bold text-secondary-foreground"
      >
        Sugestões
      </h2>
      <SuggestionTable {...props} />
    </section>
  );
}

function SuggestionTable({
  state,
  retryingId,
  onReject,
  onRetry,
}: SuggestionListProps) {
  if (state.status === 'loading') {
    return <p role="status">Carregando sugestões…</p>;
  }

  if (state.status === 'error') {
    return (
      <p role="alert" className="font-semibold text-destructive">
        Não foi possível carregar as sugestões. Tente novamente mais tarde.
      </p>
    );
  }

  if (state.suggestions.length === 0) {
    return <p role="status">Nenhuma sugestão recebida.</p>;
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
              Status
            </TableHead>
            <TableHead
              scope="col"
              className="px-4 text-sm text-muted-foreground"
            >
              Sugestão
            </TableHead>
            <TableHead
              scope="col"
              className="px-4 text-sm text-muted-foreground"
            >
              Rascunho
            </TableHead>
            <TableHead scope="col" className="w-0 px-2">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.suggestions.map((suggestion) => (
            <TableRow key={suggestion.id}>
              <TableCell className="px-4 py-3">
                <Badge variant={STATUS_VARIANTS[suggestion.status]}>
                  {STATUS_LABELS[suggestion.status]}
                </Badge>
              </TableCell>
              {/* The visitor's text may be a long link. */}
              <TableCell className="max-w-80 px-4 py-3 whitespace-normal wrap-anywhere">
                {suggestion.text}
                {suggestion.status === 'failed' && suggestion.error && (
                  <p className="text-sm text-destructive">{suggestion.error}</p>
                )}
              </TableCell>
              <TableCell className="px-4 py-3 whitespace-normal">
                {suggestion.draft ? draftSummary(suggestion.draft) : '—'}
              </TableCell>
              <TableCell className="px-2 py-1 text-right whitespace-nowrap">
                {suggestion.status === 'ready' && (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-lg"
                    className="text-muted-foreground"
                  >
                    <Link
                      to={`/admin/suggestions/${suggestion.id}/review`}
                      aria-label={`Revisar ${suggestion.text}`}
                      title="Revisar"
                    >
                      <SquarePen className="size-5" />
                    </Link>
                  </Button>
                )}
                {canRetry(suggestion, state.loadedAt) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="text-muted-foreground"
                    aria-label={`Processar de novo ${suggestion.text}`}
                    title="Processar de novo"
                    disabled={retryingId === suggestion.id}
                    onClick={() => onRetry(suggestion)}
                  >
                    <RotateCw className="size-5" />
                  </Button>
                )}
                {REJECTABLE.includes(suggestion.status) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Recusar ${suggestion.text}`}
                    title="Recusar"
                    onClick={() => onReject(suggestion)}
                  >
                    <X className="size-5" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
