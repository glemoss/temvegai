import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface NewNeighborhoodDialogProps {
  name: string;
  // Registered neighborhoods the admin may have meant instead.
  similar: string[];
  onCancel: () => void;
  onConfirm: () => void;
}

// Asks before saving a restaurant in a neighborhood not registered yet, so
// a new spelling of an old one is not created by mistake.
export function NewNeighborhoodDialog({
  name,
  similar,
  onCancel,
  onConfirm,
}: NewNeighborhoodDialogProps) {
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-secondary-foreground">
            Bairro novo
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Nenhum restaurante está em “{name}”.
            {similar.length > 0 &&
              ` Bairros parecidos: ${similar.join(', ')}.`}{' '}
            Salvar mesmo assim?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg">Cancelar</AlertDialogCancel>
          <AlertDialogAction size="lg" onClick={onConfirm}>
            Salvar mesmo assim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
