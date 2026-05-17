import fp from "fastify-plugin"
import { type FastifyPluginAsync } from "fastify"
import fastifySwagger, {
    type FastifyDynamicSwaggerOptions,
} from "@fastify/swagger"
import fastifySwaggerUi, {
    type FastifySwaggerUiOptions,
} from "@fastify/swagger-ui"

const docsPlugin: FastifyPluginAsync = async (server) => {
    const openApiOptions: FastifyDynamicSwaggerOptions = {
        openapi: {
            info: {
                title: "price-checker-api",
                description: "REST API built using clean architecture.",
                version: "0.1.0",
            },
            components: {
                securitySchemes: {
                    Bearer: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                        description: 'Enter your bearer token in the format **Bearer <token>**'
                    },
                },
            },
            security: [{ Bearer: [""] }],
        },
        hideUntagged: true,
    }

    await server.register(fastifySwagger, openApiOptions)

    const openApiUiOptions: FastifySwaggerUiOptions = {
        routePrefix: "/docs",
        initOAuth: {},
        uiConfig: {
            docExpansion: "none",
            deepLinking: false,
        },
        uiHooks: {
            onRequest: function (request, reply, next) {
                next()
            },
            preHandler: function (request, reply, next) {
                next()
            },
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
    }

    await server.register(fastifySwaggerUi, openApiUiOptions)
}

export default fp(docsPlugin)
