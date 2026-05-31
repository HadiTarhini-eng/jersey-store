import "dotenv/config"
import fp from "fastify-plugin"
import multipart from "@fastify/multipart"
import { type FastifyPluginAsync } from "fastify"

const multipartPlugin: FastifyPluginAsync = async (server) => {
    const limits = {
        fieldNameSize: 100,
        // Multipart create endpoints (products, offers, ui-content) pass their
        // whole payload as a JSON string in the `data` field. @fastify/multipart
        // silently TRUNCATES any field exceeding this limit, which produces
        // invalid JSON downstream ("data field is not valid JSON"). 1 KB is far
        // too small for a product (title + slug + two descriptions + tags), so
        // allow up to 1 MB of text per field.
        fieldSize: 1024 * 1024, // 1 MB
        fields: 25,
        fileSize: 5 * 1024 * 1024, // 5 MB per file — product photography needs more than 2 MB
        files: 11,
        headerPairs: 2000,
        parts: 1000,
    }

    server.register(multipart, { limits })
}

export default fp(multipartPlugin)
