import { describe, it, expect } from 'vitest';
import { validators, validate } from './validators';

describe('validators.required', () => {
  it('returns undefined for a non-empty string', () => {
    expect(validators.required('hello')).toBeUndefined();
  });

  it('returns an error for an empty string', () => {
    expect(validators.required('')).toBe('This field is required.');
  });

  it('returns an error for a whitespace-only string', () => {
    expect(validators.required('   ')).toBe('This field is required.');
  });
});

describe('validators.email', () => {
  it('returns undefined for a valid email address', () => {
    expect(validators.email('user@example.com')).toBeUndefined();
  });

  it('returns an error for a missing @ symbol', () => {
    expect(validators.email('notanemail')).toBe('Enter a valid email address.');
  });

  it('returns an error for a missing domain', () => {
    expect(validators.email('user@')).toBe('Enter a valid email address.');
  });

  it('returns an error for an empty string', () => {
    expect(validators.email('')).toBe('Enter a valid email address.');
  });
});

describe('validators.minLength', () => {
  it('returns undefined when the value meets the minimum length', () => {
    expect(validators.minLength(3)('abc')).toBeUndefined();
  });

  it('returns undefined when the value exceeds the minimum length', () => {
    expect(validators.minLength(3)('abcde')).toBeUndefined();
  });

  it('returns an error when the value is too short', () => {
    expect(validators.minLength(5)('ab')).toBe('Must be at least 5 characters.');
  });
});

describe('validators.maxLength', () => {
  it('returns undefined when the value is within the maximum length', () => {
    expect(validators.maxLength(10)('hello')).toBeUndefined();
  });

  it('returns an error when the value exceeds the maximum length', () => {
    expect(validators.maxLength(5)('toolongstring')).toBe('Must be at most 5 characters.');
  });
});

describe('validators.password', () => {
  it('returns undefined for a password with at least 8 characters', () => {
    expect(validators.password('securepass')).toBeUndefined();
  });

  it('returns undefined for exactly 8 characters', () => {
    expect(validators.password('12345678')).toBeUndefined();
  });

  it('returns an error for a password shorter than 8 characters', () => {
    expect(validators.password('short')).toBe('Password must be at least 8 characters.');
  });
});

describe('validators.matchPassword', () => {
  it('returns undefined when both values match', () => {
    expect(validators.matchPassword('mypassword')('mypassword')).toBeUndefined();
  });

  it('returns an error when the values differ', () => {
    expect(validators.matchPassword('mypassword')('different')).toBe('Passwords do not match.');
  });
});

describe('validators.phone', () => {
  it('returns undefined for a valid US phone number', () => {
    expect(validators.phone('+1 555-123-4567')).toBeUndefined();
  });

  it('returns undefined for a plain digit string', () => {
    expect(validators.phone('0501234567')).toBeUndefined();
  });

  it('returns an error for a string that is too short', () => {
    expect(validators.phone('123')).toBe('Enter a valid phone number.');
  });

  it('returns an error for a string with letters', () => {
    expect(validators.phone('abcdefg')).toBe('Enter a valid phone number.');
  });
});

describe('validators.postalCode', () => {
  it('returns undefined for a valid postal code', () => {
    expect(validators.postalCode('10001')).toBeUndefined();
  });

  it('returns undefined for a UK-style postal code', () => {
    expect(validators.postalCode('SW1A 1AA')).toBeUndefined();
  });

  it('returns an error for a string that is too short', () => {
    expect(validators.postalCode('AB')).toBe('Enter a valid postal code.');
  });
});

describe('validate', () => {
  it('returns undefined when all rules pass', () => {
    const result = validate('hello@example.com', [validators.required, validators.email]);
    expect(result).toBeUndefined();
  });

  it('returns the first error when the first rule fails', () => {
    const result = validate('', [validators.required, validators.email]);
    expect(result).toBe('This field is required.');
  });

  it('returns the first failing rule error even if later rules would also fail', () => {
    const result = validate('ab', [validators.required, validators.minLength(5)]);
    expect(result).toBe('Must be at least 5 characters.');
  });

  it('returns undefined for an empty rules array', () => {
    expect(validate('anything', [])).toBeUndefined();
  });
});
