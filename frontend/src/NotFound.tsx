import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { AppTitle } from './AppTitle';

// Page for any path without one, on the site and inside the panel, in the
// same card as the login page.
export function NotFound() {
  return (
    <main className="flex min-h-full items-center justify-center bg-secondary px-4 py-6">
      <section
        className="flex w-full max-w-100 flex-col gap-3 rounded-lg bg-card p-6 text-center shadow-(--shadow)"
        aria-labelledby="not-found-title"
      >
        <AppTitle />
        <h2
          id="not-found-title"
          className="text-xl font-bold text-secondary-foreground"
        >
          Página não encontrada
        </h2>
        <p>O endereço que você abriu não existe.</p>
        <Button asChild size="lg">
          <Link to="/">Voltar ao mapa</Link>
        </Button>
      </section>
    </main>
  );
}
