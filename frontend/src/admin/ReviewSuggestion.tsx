import { useNavigate, useParams } from 'react-router';
import { cn } from '@/lib/utils';
import { UnauthenticatedError, type RestaurantInput } from '../api/restaurants';
import {
  approveSuggestion,
  SuggestionNotFoundError,
  SuggestionStatusError,
} from '../api/suggestions';
import { RestaurantDialog } from './RestaurantDialog';
import { RestaurantForm } from './RestaurantForm';
import { useSuggestionsPage } from './SuggestionsPage';
import { draftToRestaurantFormValues } from './restaurantFormSchema';

const MESSAGE = 'p-6 max-sm:p-4';

const ERROR = cn(MESSAGE, 'font-semibold text-destructive');

// The creation form filled with the AI draft. The suggestion comes from the
// list of the module, which has every suggestion. Saving creates the
// restaurant and approves the suggestion; Esc, the close button and Cancel
// go back to the list.
export function ReviewSuggestion() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { suggestions, onApproved, onSuggestionOutdated } =
    useSuggestionsPage();

  function close() {
    navigate('/admin/suggestions', { replace: true });
  }

  async function approve(input: RestaurantInput) {
    try {
      const { restaurant } = await approveSuggestion(id, input);
      onApproved(restaurant);
      close();
    } catch (reason) {
      if (reason instanceof UnauthenticatedError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      // Removed or decided while the form was open; the list is reloaded.
      if (
        reason instanceof SuggestionNotFoundError ||
        reason instanceof SuggestionStatusError
      ) {
        onSuggestionOutdated();
        close();
        return;
      }
      throw reason;
    }
  }

  const suggestion =
    suggestions.status === 'success'
      ? suggestions.suggestions.find((stored) => stored.id === id)
      : undefined;

  return (
    <RestaurantDialog title="Revisar sugestão" onClose={close}>
      {suggestions.status === 'loading' && (
        <p role="status" className={MESSAGE}>
          Carregando sugestão…
        </p>
      )}
      {suggestions.status === 'error' && (
        <p role="alert" className={ERROR}>
          Não foi possível carregar a sugestão. Tente novamente mais tarde.
        </p>
      )}
      {suggestions.status === 'success' &&
        (suggestion?.status === 'ready' && suggestion.draft ? (
          <>
            <p
              className={cn(
                MESSAGE,
                'pb-0 wrap-anywhere text-muted-foreground',
              )}
            >
              Sugestão do visitante: “{suggestion.text}”
            </p>
            <RestaurantForm
              initialValues={draftToRestaurantFormValues(suggestion.draft)}
              submitLabel="Aprovar"
              submittingLabel="Aprovando…"
              onSubmit={approve}
              onCancel={close}
            />
          </>
        ) : (
          <p role="alert" className={ERROR}>
            Sugestão não encontrada ou sem rascunho para revisar.
          </p>
        ))}
    </RestaurantDialog>
  );
}
