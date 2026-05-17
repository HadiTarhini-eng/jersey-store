import "dotenv/config"
import fp from "fastify-plugin"
import multipart from "@fastify/multipart"
import { type FastifyPluginAsync } from "fastify"

const multipartPlugin: FastifyPluginAsync = async (server) => {
    const limits = {
        fieldNameSize: 100,
        fieldSize: 100,
        fields: 10,
        fileSize: 2 * 1024 * 1024,
        files: 1,
        headerPairs: 2000,
        parts: 1000,
    }

    server.register(multipart, { limits })
}

export default fp(multipartPlugin)
