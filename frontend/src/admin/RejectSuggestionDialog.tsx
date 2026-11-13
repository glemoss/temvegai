import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { UnauthenticatedError } from '../api/restaurants';
import {
  rejectSuggestion,
  SuggestionNotFoundError,
  SuggestionStatusError,
  type Suggestion,
} from '../api/suggestions';

interface RejectSuggestionDialogProps {
  suggestion: Suggestion;
  onClose: () => void;
  onRejected: (suggestion: Suggestion) => void;
  // Removed or changed status before the confirmation.
  onOutdated: () => void;
}

// Asks before rejecting. While the rejection is on its way the dialog
// cannot be closed, so the admin sees how it ended.
export function RejectSuggestionDialog({
  suggestion,
  onClose,
  onRejected,
  onOutdated,
}: RejectSuggestionDialogProps) {
  const navigate = useNavigate();
  const [rejecting, setRejecting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function confirm() {
    setRejecting(true);
    setFailed(false);
    try {
      onRejected(await rejectSuggestion(suggestion.id));
    } catch (reason) {
      if (reason instanceof UnauthenticatedError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      if (
        reason instanceof SuggestionNotFoundError ||
        reason instanceof SuggestionStatusError
      ) {
        onOutdated();
        return;
      }
      setRejecting(false);
      setFailed(true);
    }
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !rejecting) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-secondary-foreground">
            Recusar sugestão?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base wrap-anywhere">
            “{suggestion.text}” será recusada e não poderá mais ser aprovada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p role="alert" className="font-semibold text-destructive empty:hidden">
          {failed &&
            'Não foi possível recusar a sugestão. Tente novamente mais tarde.'}
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={rejecting}>
            Cancelar
          </AlertDialogCancel>
          {/* A plain button rather than AlertDialogAction, which would
            close the dialog before the API answers. */}
          <Button
            type="button"
            variant="destructive"
            size="lg"
            disabled={rejecting}
            onClick={confirm}
          >
            {rejecting ? 'Recusando…' : 'Recusar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
