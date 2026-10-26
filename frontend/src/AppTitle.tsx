import { LeafIcon } from './leaf';

// The accent on "Aí" is drawn as the leaf, so screen readers get the real
// spelling from the hidden text instead.
export function AppTitle() {
  return (
    // The top padding leaves room for the leaf drawn as the accent, so it
    // stays inside the box.
    <h1 className="mb-2 flex items-center justify-center gap-1.5 pt-[0.15em] font-display text-4xl leading-none font-normal tracking-[0.02em] text-secondary-foreground max-sm:text-[1.75rem]">
      <span className="sr-only">Tem Veg Aí?</span>
      <span aria-hidden="true">
        Tem Veg A
        <span className="relative">
          I
          {/* Just above the top of the capital I, which sits a little below
              the top of the line box in Bebas Neue. */}
          <LeafIcon
            type="fully_vegan"
            className="absolute -top-[0.26em] left-1/2 size-[0.42em] -translate-x-[30%] -rotate-10"
          />
        </span>
        ?
      </span>
    </h1>
  );
}
