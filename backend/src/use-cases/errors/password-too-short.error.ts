export class PasswordTooShortError extends Error {
  constructor(readonly minLength: number) {
    super(`Password must have at least ${minLength} characters`);
    this.name = 'PasswordTooShortError';
  }
}
