import fp from "fastify-plugin"
import { eq } from "drizzle-orm"
import {
    FastifyReply,
    FastifyRequest,
    type FastifyPluginAsync
} from "fastify"
import { db } from "../../database/db.js"
import { users } from "../../database/schema.js"
import { ServiceError } from "../../services/errors.js"
import {
    createSupabaseAuthService,
    type SupabaseAuthService,
    type SupabaseIdentity,
} from "../../services/supabase-auth.svc.js"

export type ApiRole = 'Admin' | 'User'

/** The application identity attached to every authenticated request. */
export interface RequestUser {
    /** Application `users.id` — NOT the Supabase auth id. */
    id: string
    email: string
    role: ApiRole
    supabaseUserId: string
}

declare module "fastify" {
    interface FastifyInstance {
        supabaseAuth: SupabaseAuthService
        /** Verifies the bearer token only — use for routes that run before an app user row exists. */
        authenticateToken: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => Promise<void>
        /** Verifies the bearer token AND resolves the application user row. */
        authenticate: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => Promise<void>
        authorize: (
            roles: ApiRole[]
        ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
        /**
         * Best-effort authentication for public routes (guest checkout, coupon
         * validation). Resolves whether or not a valid token was supplied.
         */
        tryAuthenticate: (request: FastifyRequest) => Promise<void>
    }

    interface FastifyRequest {
        serverInstance: FastifyInstance
        /** Resolved application identity — set by `authenticate`. */
        user: RequestUser
        /** Set by `authenticateToken` — the verified Supabase identity. */
        supabaseIdentity?: SupabaseIdentity
    }

    interface RouteOptions {
        protected?: boolean
        roles?: ApiRole[]
        /** Verify the Supabase access token only — skip application-profile resolution. */
        tokenOnly?: boolean
    }
}

const bearerToken = (request: FastifyRequest): string => {
    const header = request.headers.authorization
    if (!header?.startsWith('Bearer ')) throw new ServiceError('Missing bearer token', 401)
    const token = header.slice('Bearer '.length).trim()
    if (!token) throw new ServiceError('Missing bearer token', 401)
    return token
}

/**
 * Supabase Auth is the single source of truth for authentication. Access tokens
 * are verified against the project's JWKS; the application `users` row is then
 * resolved from the verified `sub`. Nothing about the caller's identity, role or
 * verification state is read from the request body or from unverified claims.
 */
const authPlugin: FastifyPluginAsync = async (server) => {
    const supabaseAuth = createSupabaseAuthService()
    server.decorate("supabaseAuth", supabaseAuth)

    server.decorate(
        "authenticateToken",
        async (request: FastifyRequest, _reply: FastifyReply) => {
            const { supabaseUserId } = await supabaseAuth.verifyToken(bearerToken(request))
            // Authoritative state comes from the Supabase Admin API, not the token body.
            const identity = await supabaseAuth.getIdentity(supabaseUserId)
            if (!identity.emailConfirmed) {
                throw new ServiceError('Email address is not verified', 403)
            }
            request.supabaseIdentity = identity
        }
    )

    server.decorate(
        "authenticate",
        async (request: FastifyRequest, reply: FastifyReply) => {
            await server.authenticateToken(request, reply)
            const identity = request.supabaseIdentity!

            const [row] = await db
                .select({
                    id: users.id,
                    email: users.email,
                    role: users.role,
                    isActive: users.isActive,
                })
                .from(users)
                .where(eq(users.supabaseUserId, identity.supabaseUserId))
                .limit(1)

            if (!row) {
                // The Supabase account exists but has no application profile yet.
                // The client resolves this by calling POST /auth/sync.
                throw new ServiceError('No application profile for this account', 409)
            }
            if (!row.isActive) throw new ServiceError('Account is deactivated', 403)

            const user: RequestUser = {
                id: row.id,
                email: row.email,
                role: row.role as ApiRole,
                supabaseUserId: identity.supabaseUserId,
            }
            request.user = user
        }
    )

    server.decorate(
        "tryAuthenticate",
        async (request: FastifyRequest) => {
            try {
                await server.authenticate(request, undefined as unknown as FastifyReply)
            } catch {
                // Anonymous caller — the route stays public.
            }
        }
    )

    server.decorate("authorize", (roles: ApiRole[]) => {
        return async (request: FastifyRequest) => {
            const role = (request.user as { role?: string } | undefined)?.role
            if (!role || !roles.includes(role as ApiRole)) {
                throw new ServiceError('Forbidden', 403)
            }
        }
    })
}

export default fp(authPlugin)
