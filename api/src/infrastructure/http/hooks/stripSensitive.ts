import type { FastifyInstance } from 'fastify'

/**
 * Fields that must never leave the API. Any object in any response payload
 * — top level, nested, or inside arrays — gets these keys stripped before
 * serialization.
 */
const SENSITIVE_KEYS = new Set(['passwordHash'])

const strip = (value: unknown): unknown => {
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map(strip)
  if (typeof value !== 'object') return value
  if (value instanceof Date || Buffer.isBuffer(value)) return value

  const obj = value as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k)) continue
    out[k] = strip(v)
  }
  return out
}

/**
 * Runs as a preSerialization hook so it sees the fully resolved domain
 * payload (including the attachment views injected by resolveAttachments)
 * and strips sensitive fields before Fastify serializes the response.
 */
export const registerSensitiveFieldStripping = (server: FastifyInstance): void => {
  server.addHook('preSerialization', async (_request, _reply, payload) => strip(payload))
}
