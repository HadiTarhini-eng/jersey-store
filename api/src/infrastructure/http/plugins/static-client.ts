import fp from "fastify-plugin"
import { type FastifyPluginAsync } from "fastify"
import fastifyStatic from "@fastify/static"
import path from "node:path"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const resolveClientDist = (): string | null => {
    const envPath = process.env.CLIENT_DIST_PATH
    if (envPath && existsSync(envPath)) return path.resolve(envPath)

    // dist/infrastructure/http/plugins -> repo root /client/dist
    const fromBuild = path.resolve(__dirname, "../../../../../client/dist")
    if (existsSync(fromBuild)) return fromBuild

    // src/infrastructure/http/plugins (when running via bun)
    const fromSrc = path.resolve(__dirname, "../../../../../client/dist")
    if (existsSync(fromSrc)) return fromSrc

    return null
}

const staticClientPlugin: FastifyPluginAsync = async (server) => {
    const clientDist = resolveClientDist()
    if (!clientDist) {
        server.log.warn("client dist not found — skipping static SPA serving")
        return
    }

    server.log.info({ clientDist }, "serving client SPA")

    await server.register(fastifyStatic, {
        root: clientDist,
        prefix: "/",
        wildcard: false,
        index: ["index.html"],
    })

    server.setNotFoundHandler((request, reply) => {
        if (
            request.method !== "GET" ||
            request.url.startsWith("/api") ||
            request.url.startsWith("/docs")
        ) {
            return reply.status(404).send({
                error: "NotFound",
                message: `Route ${request.method} ${request.url} not found`,
                statusCode: 404,
            })
        }
        return reply.sendFile("index.html")
    })
}

export default fp(staticClientPlugin)
