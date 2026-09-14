import "dotenv/config"
import fp from "fastify-plugin"
import { type FastifyPluginAsync } from "fastify"
import { type Static, Type } from "@sinclair/typebox"
import Ajv from "ajv"

export enum NodeEnv {
    development = "development",
    test = "test",
    production = "production",
}

const ConfigSchema = Type.Object({
    NODE_ENV: Type.Enum(NodeEnv),
    LOG_LEVEL: Type.String(),
    API_HOST: Type.String(),
    API_PORT: Type.Number(),
})

const ajv = new Ajv.default({
    allErrors: true,
    removeAdditional: true,
    useDefaults: true,
    coerceTypes: true,
    allowUnionTypes: true,
})

export type Config = Static<typeof ConfigSchema>

const configPlugin: FastifyPluginAsync = async (server) => {
    // Hosts such as Render inject PORT; API_PORT still wins when set explicitly.
    const env = { ...process.env, API_PORT: process.env.API_PORT ?? process.env.PORT }
    const validate = ajv.compile(ConfigSchema)
    const valid = validate(env)
    if (!valid) {
        throw new Error(
            ".env file validation failed - " +
                JSON.stringify(validate.errors, null, 2)
        )
    }

    const config: Config = {
        NODE_ENV: env.NODE_ENV as NodeEnv,
        LOG_LEVEL: env.LOG_LEVEL as string,
        API_HOST: env.API_HOST as string,
        API_PORT: Number.parseInt(String(env.API_PORT)),
    }

    server.decorate("config", config)
}

declare module "fastify" {
    interface FastifyInstance {
        config: Config
    }
}

export default fp(configPlugin)
