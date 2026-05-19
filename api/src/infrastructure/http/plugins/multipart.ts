import "dotenv/config"
import fp from "fastify-plugin"
import multipart from "@fastify/multipart"
import { type FastifyPluginAsync } from "fastify"

const multipartPlugin: FastifyPluginAsync = async (server) => {
    const limits = {
        fieldNameSize: 100,
        fieldSize: 1000,
        fields: 25,
        fileSize: 5 * 1024 * 1024, // 5 MB per file — product photography needs more than 2 MB
        files: 11,
        headerPairs: 2000,
        parts: 1000,
    }

    server.register(multipart, { limits })
}

export default fp(multipartPlugin)
