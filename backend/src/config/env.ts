import { z } from 'zod';

// What the commands that only touch the database (migrate, seed,
// create-admin) need.
export const databaseEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

export const serverEnvSchema = databaseEnvSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  // Origin of the frontend allowed by CORS. Reduced to scheme, host and port,
  // which is what the browser sends in the Origin header.
  CORS_ORIGIN: z
    .url({ protocol: /^https?$/ })
    .transform((value) => new URL(value).origin),
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
