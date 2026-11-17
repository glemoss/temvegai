import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { createSuggestion, TooManySuggestionsError } from './api/suggestions';

// The most the API accepts.
const MAX_LENGTH = 300;

// Lucide's lightbulb, a little smaller and lower, with rays around it, as
// Lucide has no lit one. Same stroke as the other icons.
function LitLightbulbIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g transform="translate(2.4 4.2) scale(0.8)">
        <path
          vectorEffect="non-scaling-stroke"
          d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
        />
        <path vectorEffect="non-scaling-stroke" d="M9 18h6" />
        <path vectorEffect="non-scaling-stroke" d="M10 22h4" />
      </g>
      <path d="M12 1.5v1.5" />
      <path d="m5.6 4.2 1.1 1.1" />
      <path d="m18.4 4.2-1.1 1.1" />
      <path d="M2.5 10.6h1.5" />
      <path d="M20 10.6h1.5" />
    </svg>
  );
}

// The "Sugerir" button next to the filters, and the dialog where the
// visitor writes the name or a link of a restaurant. While the suggestion
// is on its way the dialog cannot be closed, so the visitor sees how it
// ended.
export function SuggestRestaurant() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const fieldId = useId();
  const counterId = useId();

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      await createSuggestion(text.trim());
      toast.success('Obrigado! Sua sugestão foi enviada e será revisada.');
      setText('');
      setOpen(false);
    } catch (reason) {
      toast.error(
        reason instanceof TooManySuggestionsError
          ? 'Você já enviou muitas sugestões. Tente novamente mais tarde.'
          : 'Não foi possível enviar a sugestão. Tente novamente.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!sending) setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon-lg"
          className="hover:bg-secondary-foreground [&_svg:not([class*='size-'])]:size-5"
          aria-label="Sugerir restaurante"
          title="Sugerir restaurante"
        >
          <LitLightbulbIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="grid gap-4" onSubmit={send}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-secondary-foreground">
              Sugerir restaurante
            </DialogTitle>
            <DialogDescription className="text-base">
              Conhece um lugar vegano ou com opções veganas em Florianópolis que
              não está no mapa? Conte o nome ou cole um link.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <label htmlFor={fieldId} className="font-semibold">
              Nome ou link
            </label>
            <Textarea
              id={fieldId}
              className="min-h-24 text-base md:text-base"
              value={text}
              maxLength={MAX_LENGTH}
              disabled={sending}
              aria-describedby={counterId}
              onChange={(event) => setText(event.target.value)}
            />
            <p
              id={counterId}
              className="m-0 text-right text-sm text-muted-foreground"
            >
              {text.length}/{MAX_LENGTH}
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={sending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" size="lg" disabled={sending || !text.trim()}>
              {sending ? 'Enviando…' : 'Enviar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
