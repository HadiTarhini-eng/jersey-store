import "dotenv/config"
import fp from "fastify-plugin"
import { type FastifyPluginAsync } from "fastify"
import { SupabaseStorage } from "../../storage/supabase.storage.js"
import { type IStorageService } from "../../../core/services/storage.svc.js"

declare module "fastify" {
    interface FastifyInstance {
        storage: IStorageService
    }
}

const storagePlugin: FastifyPluginAsync = async (server) => {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    const bucket = process.env.SUPABASE_STORAGE_BUCKET

    if (!url || !key || !bucket) {
        throw new Error(
            "Supabase storage env vars missing: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET",
        )
    }

    server.decorate("storage", new SupabaseStorage(url, key, bucket))
}

export default fp(storagePlugin)
