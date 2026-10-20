import { LeafIcon } from './leaf';

// The accent on "Aí" is drawn as the leaf, so screen readers get the real
// spelling from the hidden text instead.
export function AppTitle() {
  return (
    <h1 className="app-title">
      <span className="visually-hidden">Tem Veg Aí?</span>
      <span aria-hidden="true">
        Tem Veg A
        <span className="app-title-i">
          I<LeafIcon type="fully_vegan" className="app-title-accent" />
        </span>
        ?
      </span>
    </h1>
  );
}
