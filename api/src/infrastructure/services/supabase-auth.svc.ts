import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ServiceError } from './errors.js'

/**
 * Verifies Supabase Auth access tokens and resolves the authoritative
 * verification state for the token's subject.
 *
 * Verification uses the project's JWKS endpoint (asymmetric signing keys) so
 * the API never holds a JWT signing secret. Symmetric (HS*) tokens are rejected
 * outright — jose only accepts algorithms that match the published public keys.
 */

export interface SupabaseIdentity {
  /** Supabase Auth user id — the token `sub` claim. */
  supabaseUserId: string
  email: string
  emailConfirmed: boolean
}

/** Asymmetric algorithms Supabase can sign access tokens with. */
const ACCEPTED_ALGORITHMS = ['ES256', 'RS256']

/** Cached Admin-API lookups keyed by supabase user id. */
const CACHE_TTL_MS = 60_000
const CACHE_MAX_ENTRIES = 5_000
interface CacheEntry { identity: SupabaseIdentity; expiresAt: number }

export class SupabaseAuthService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>
  private readonly issuer: string
  private readonly admin: SupabaseClient
  private readonly cache = new Map<string, CacheEntry>()

  constructor(url: string, serviceRoleKey: string) {
    const base = url.replace(/\/+$/, '')
    this.issuer = `${base}/auth/v1`
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`))
    this.admin = createClient(base, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  }

  /**
   * Verifies signature, expiry, issuer and audience, and returns the token
   * subject. Throws 401 for anything that doesn't verify.
   */
  async verifyToken(token: string): Promise<{ supabaseUserId: string }> {
    let claims: JWTPayload
    try {
      ({ payload: claims } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: 'authenticated',
        algorithms: ACCEPTED_ALGORITHMS,
        requiredClaims: ['sub', 'exp'],
      }))
    } catch {
      throw new ServiceError('Invalid or expired access token', 401)
    }
    if (!claims.sub) throw new ServiceError('Invalid or expired access token', 401)
    return { supabaseUserId: claims.sub }
  }

  /**
   * Authoritative identity for a verified token subject, read from the Supabase
   * Admin API (never from client-supplied claims) and cached briefly so a burst
   * of API calls doesn't fan out to Supabase on every request.
   */
  async getIdentity(supabaseUserId: string): Promise<SupabaseIdentity> {
    const cached = this.cache.get(supabaseUserId)
    if (cached && cached.expiresAt > Date.now()) return cached.identity

    const { data, error } = await this.admin.auth.admin.getUserById(supabaseUserId)
    if (error || !data?.user) throw new ServiceError('Authenticated user no longer exists', 401)

    const bannedUntil = data.user.banned_until ? Date.parse(data.user.banned_until) : NaN
    if (bannedUntil > Date.now()) throw new ServiceError('Account is suspended', 403)

    const identity: SupabaseIdentity = {
      supabaseUserId,
      email: (data.user.email ?? '').toLowerCase(),
      emailConfirmed: Boolean(data.user.email_confirmed_at),
    }
    this.remember(supabaseUserId, identity)
    return identity
  }

  /** Drops a cached identity — call after anything that changes verification state. */
  invalidate(supabaseUserId: string): void {
    this.cache.delete(supabaseUserId)
  }

  private remember(supabaseUserId: string, identity: SupabaseIdentity): void {
    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      const now = Date.now()
      for (const [key, entry] of this.cache) if (entry.expiresAt <= now) this.cache.delete(key)
      if (this.cache.size >= CACHE_MAX_ENTRIES) this.cache.clear()
    }
    this.cache.set(supabaseUserId, { identity, expiresAt: Date.now() + CACHE_TTL_MS })
  }
}

export const createSupabaseAuthService = (): SupabaseAuthService => {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('SUPABASE_URL env var is required for authentication')
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY env var is required for authentication')
  return new SupabaseAuthService(url, serviceRoleKey)
}
