import jwt from "@fastify/jwt"
import fp from "fastify-plugin"
import {
    FastifyReply,
    FastifyRequest,
    type FastifyPluginAsync
} from "fastify"
import { ServiceError } from "../../services/errors.js"

export type ApiRole = 'Admin' | 'User'

declare module "fastify" {
    interface FastifyInstance {
        authenticate: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => Promise<void>
        authorize: (
            roles: ApiRole[]
        ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    }

    interface FastifyRequest {
        serverInstance: FastifyInstance
    }

    interface RouteOptions {
        protected?: boolean
        roles?: ApiRole[]
    }
}

const jwtPlugin: FastifyPluginAsync = async (server) => {
    const config = {
        secret: "m8dk2ocmso1lcuwl15fysi39q0nwk12h8dq920wda0",
    }
    
    server.register(jwt, config)
    server.decorate(
        "authenticate",
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                await request.jwtVerify()
            } catch (e) {
                return reply.send(e)
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

export default fp(jwtPlugin)
