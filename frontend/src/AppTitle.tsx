import logo from './assets/logo.svg';

export function AppTitle() {
  return (
    <h1 className="mb-2 flex justify-center">
      <img src={logo} alt="Tem Veg Aí?" className="h-10 w-auto max-sm:h-8" />
    </h1>
  );
}
