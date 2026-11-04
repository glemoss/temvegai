export interface Config {
  apiUrl: string;
  cartoKey: string;
}

// A path such as /api points to the API on the site's own domain, as the
// Vercel rewrite does in production; a full URL points to another address.
function isApiAddress(value: string): boolean {
  return /^\/[^/]/.test(value) || URL.canParse(value);
}

export function loadConfig(
  env: Pick<ImportMetaEnv, 'VITE_API_URL' | 'VITE_CARTO_KEY'>,
): Config {
  const apiUrl = env.VITE_API_URL?.trim();

  if (!apiUrl || !isApiAddress(apiUrl)) {
    throw new Error(
      'VITE_API_URL ausente ou inválida. Copie o .env.example para .env.',
    );
  }

  // Without the key, CARTO still serves the tiles, but with a watermark on
  // each one, so a missing key would only show up by looking at the map.
  const cartoKey = env.VITE_CARTO_KEY?.trim();

  if (!cartoKey) {
    throw new Error(
      'VITE_CARTO_KEY ausente. Peça uma chave em carto.com/basemaps/apikey e coloque no .env.',
    );
  }

  return { apiUrl: apiUrl.replace(/\/+$/, ''), cartoKey };
}

export const config = loadConfig(import.meta.env);
