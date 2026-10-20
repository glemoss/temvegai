export interface Config {
  apiUrl: string;
}

export function loadConfig(env: Pick<ImportMetaEnv, 'VITE_API_URL'>): Config {
  const apiUrl = env.VITE_API_URL?.trim();

  if (!apiUrl || !URL.canParse(apiUrl)) {
    throw new Error(
      'VITE_API_URL ausente ou inválida. Copie o .env.example para .env.',
    );
  }

  return { apiUrl: apiUrl.replace(/\/+$/, '') };
}

export const config = loadConfig(import.meta.env);
