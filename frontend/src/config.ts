export interface Config {
  apiUrl: string;
}

// A path such as /api points to the API on the site's own domain, as the
// Vercel rewrite does in production; a full URL points to another address.
function isApiAddress(value: string): boolean {
  return /^\/[^/]/.test(value) || URL.canParse(value);
}

export function loadConfig(env: Pick<ImportMetaEnv, 'VITE_API_URL'>): Config {
  const apiUrl = env.VITE_API_URL?.trim();

  if (!apiUrl || !isApiAddress(apiUrl)) {
    throw new Error(
      'VITE_API_URL ausente ou inválida. Copie o .env.example para .env.',
    );
  }

  return { apiUrl: apiUrl.replace(/\/+$/, '') };
}

export const config = loadConfig(import.meta.env);
