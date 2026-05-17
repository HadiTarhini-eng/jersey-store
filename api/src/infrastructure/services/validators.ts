import { type Guid } from '../../core/entities/base.js'
import { ValidationError } from './errors.js'

const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function assertGuid(value: Guid, fieldName = 'id'): void {
  if (!guidRegex.test(value)) throw new ValidationError(`${fieldName} must be a valid GUID`)
}

export function assertRequiredString(value: string | null | undefined, fieldName: string, maxLength = 255): void {
  if (!value || value.trim().length === 0) throw new ValidationError(`${fieldName} is required`)
  if (value.length > maxLength) throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`)
}

export function assertSlug(value: string): void {
  assertRequiredString(value, 'slug', 160)
  if (!slugRegex.test(value)) throw new ValidationError('slug must be lowercase words separated by hyphens')
}

export function assertEmail(value: string): void {
  assertRequiredString(value, 'email', 320)
  if (!emailRegex.test(value)) throw new ValidationError('email must be valid')
}

export function assertPositiveNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new ValidationError(`${fieldName} must be greater than 0`)
}

export function assertNonNegativeNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0) throw new ValidationError(`${fieldName} cannot be negative`)
}

export function assertInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value)) throw new ValidationError(`${fieldName} must be an integer`)
}

export function assertDateRange(startDate: Date, endDate: Date): void {
  if (Number.isNaN(startDate.getTime())) throw new ValidationError('startDate must be valid')
  if (Number.isNaN(endDate.getTime())) throw new ValidationError('endDate must be valid')
  if (startDate >= endDate) throw new ValidationError('startDate must be before endDate')
}

export function assertAllowed<T extends string>(value: string, allowed: readonly T[], fieldName: string): asserts value is T {
  if (!allowed.includes(value as T)) throw new ValidationError(`${fieldName} is invalid`)
}
