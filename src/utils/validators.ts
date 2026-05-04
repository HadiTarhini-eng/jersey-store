/** Form validation helpers — return an error string or undefined. */

export const validators = {
  required: (value: string): string | undefined =>
    value.trim() ? undefined : 'This field is required.',

  email: (value: string): string | undefined =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Enter a valid email address.',

  minLength: (min: number) => (value: string): string | undefined =>
    value.length >= min ? undefined : `Must be at least ${min} characters.`,

  maxLength: (max: number) => (value: string): string | undefined =>
    value.length <= max ? undefined : `Must be at most ${max} characters.`,

  password: (value: string): string | undefined =>
    value.length >= 8 ? undefined : 'Password must be at least 8 characters.',

  matchPassword: (other: string) => (value: string): string | undefined =>
    value === other ? undefined : 'Passwords do not match.',

  phone: (value: string): string | undefined =>
    /^\+?[\d\s\-().]{7,20}$/.test(value) ? undefined : 'Enter a valid phone number.',

  postalCode: (value: string): string | undefined =>
    /^[\w\s-]{3,10}$/.test(value) ? undefined : 'Enter a valid postal code.',
};

/** Run a chain of validators and return the first error. */
export function validate(
  value: string,
  rules: Array<(v: string) => string | undefined>,
): string | undefined {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return undefined;
}
