import { useState } from 'react';
import { Outlet, useNavigate, useOutletContext } from 'react-router';
import { toast } from 'sonner';
import { UnauthenticatedError, type Restaurant } from '../api/restaurants';
import {
  retrySuggestion,
  SuggestionNotFoundError,
  SuggestionStatusError,
  type Suggestion,
} from '../api/suggestions';
import { useAdminLayout } from './AdminLayout';
import { RejectSuggestionDialog } from './RejectSuggestionDialog';
import { SuggestionList } from './SuggestionList';
import type { AdminSuggestionsState } from './useAdminSuggestions';

interface SuggestionsPageContext {
  suggestions: AdminSuggestionsState;
  // The restaurant created from a reviewed suggestion.
  onApproved: (restaurant: Restaurant) => void;
  // The suggestion was removed or changed status in the meantime.
  onSuggestionOutdated: () => void;
}

// The list of suggestions, loaded by the layout, with the review opening
// over it as a modal in a child route. The rejection confirmation has no
// route of its own.
export function SuggestionsPage() {
  const navigate = useNavigate();
  const { suggestions, reloadSuggestions } = useAdminLayout();
  const [rejecting, setRejecting] = useState<Suggestion | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  function outdated() {
    toast.error(
      'Oops, essa sugestão mudou enquanto isso. A lista foi atualizada.',
    );
    reloadSuggestions();
  }

  async function retry(suggestion: Suggestion) {
    setRetryingId(suggestion.id);
    try {
      await retrySuggestion(suggestion.id);
      toast.success('Sugestão de volta na fila para processar.');
      reloadSuggestions();
    } catch (reason) {
      if (reason instanceof UnauthenticatedError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      if (
        reason instanceof SuggestionNotFoundError ||
        reason instanceof SuggestionStatusError
      ) {
        outdated();
        return;
      }
      toast.error(
        'Não foi possível processar a sugestão de novo. Tente novamente mais tarde.',
      );
    } finally {
      setRetryingId(null);
    }
  }

  const context: SuggestionsPageContext = {
    suggestions,
    onApproved: (restaurant) => {
      toast.success(`Sugestão aprovada. “${restaurant.name}” está no mapa.`);
      reloadSuggestions();
    },
    onSuggestionOutdated: outdated,
  };

  return (
    <>
      <SuggestionList
        state={suggestions}
        retryingId={retryingId}
        onReject={setRejecting}
        onRetry={retry}
      />
      <Outlet context={context} />
      {rejecting && (
        <RejectSuggestionDialog
          suggestion={rejecting}
          onClose={() => setRejecting(null)}
          onRejected={() => {
            setRejecting(null);
            toast.success('Sugestão recusada.');
            reloadSuggestions();
          }}
          onOutdated={() => {
            setRejecting(null);
            outdated();
          }}
        />
      )}
    </>
  );
}

// For the review opened over the list.
export function useSuggestionsPage(): SuggestionsPageContext {
  return useOutletContext<SuggestionsPageContext>();
}
