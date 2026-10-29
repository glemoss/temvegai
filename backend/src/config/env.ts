import { z } from 'zod';

// What the commands that only touch the database (migrate, create-admin)
// need.
export const databaseEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

const nodeEnv = z.enum(['development', 'production']).default('development');

// The seed also reads NODE_ENV, to refuse to run in production.
export const seedEnvSchema = databaseEnvSchema.extend({ NODE_ENV: nodeEnv });

export const serverEnvSchema = databaseEnvSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: nodeEnv,
  // Origin of the frontend allowed by CORS. Reduced to scheme, host and port,
  // which is what the browser sends in the Origin header.
  CORS_ORIGIN: z
    .url({ protocol: /^https?$/ })
    .transform((value) => new URL(value).origin),
  // How many proxies in front of the API add to X-Forwarded-For. Only those
  // entries are trusted, so the client IP cannot be forged; 0 ignores the
  // header and uses the address of the connection.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

export class InvalidEnvError extends Error {
  constructor(problems: string[]) {
    super(`Invalid environment variables:\n${problems.join('\n')}`);
    this.name = 'InvalidEnvError';
  }
}

export function loadEnv<Schema extends z.ZodType>(
  schema: Schema,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<Schema> {
  const result = schema.safeParse(source);

  if (!result.success) {
    throw new InvalidEnvError(
      result.error.issues.map(
        (issue) => `- ${issue.path.join('.')}: ${issue.message}`,
      ),
    );
  }

  return result.data;
}

export function loadEnvOrExit<Schema extends z.ZodType>(
  schema: Schema,
): z.infer<Schema> {
  try {
    return loadEnv(schema);
  } catch (error) {
    if (error instanceof InvalidEnvError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}
