import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export class InvalidEnvError extends Error {
  constructor(problems: string[]) {
    super(`Invalid environment variables:\n${problems.join('\n')}`);
    this.name = 'InvalidEnvError';
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new InvalidEnvError(
      result.error.issues.map(
        (issue) => `- ${issue.path.join('.')}: ${issue.message}`,
      ),
    );
  }

  return result.data;
}

export function loadEnvOrExit(): Env {
  try {
    return loadEnv();
  } catch (error) {
    if (error instanceof InvalidEnvError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}
