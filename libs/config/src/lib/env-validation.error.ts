import type { ZodError } from 'zod';

export class EnvValidationError extends Error {
  readonly fieldErrors: Record<string, string[]>;

  constructor(error: ZodError) {
    const fieldErrors = error.flatten().fieldErrors as Record<string, string[]>;
    const details = Object.entries(fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(', ') ?? 'invalid'}`)
      .join('; ');

    super(`Invalid environment configuration: ${details}`);
    this.name = 'EnvValidationError';
    this.fieldErrors = fieldErrors;
  }
}
