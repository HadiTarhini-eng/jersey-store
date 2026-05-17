import fastify, {
    type FastifyInstance,
    type FastifyServerOptions,
} from "fastify"
import { type TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import multipart from "../plugins/multipart.js"
import storage from "../plugins/storage.js"
import { registerAttachmentResolution } from "../hooks/resolveAttachments.js"
import routes from "../routes/index.js"
import { UserService } from "../../services/user.svc.js"
import { AttachmentService } from "../../services/attachment.svc.js"
import { CategoryService, CategoryTypeService } from "../../services/catalog.svc.js"
import { CartService, OrderService, ReviewService } from "../../services/commerce.svc.js"
import { ServiceError } from "../../services/errors.js"
import { SpecialOfferService } from "../../services/offer.svc.js"
import { ProductAttributeService, ProductService, ProductVariantService } from "../../services/product.svc.js"
import {
    attachments,
    cartItems,
    carts,
    categories,
    categoryTypes,
    orderItems,
    orders,
    offerProducts,
    productAssignedAttributes,
    productAttributeOptions,
    productAttributes,
    productImages,
    productSpecifications,
    products,
    productVariants,
    reviews,
    specialOffers,
    users,
    variantAttributeValues,
} from "../../database/schema.js"
import { DrizzleEntityRepository, DrizzleOfferProductRepository } from "../../repositories/entity.repository.js"
import { mappers } from "../../repositories/mappers.js"
import config from "../plugins/config.js"
import jwt from "../plugins/jwt.js"
import docs from "../plugins/docs.js"
import "dotenv/config"

export const createServer = async (): Promise<FastifyInstance> => {
    const envToLogger: any = {
        development: {
            transport: {
                target: "pino-pretty",
                options: {
                    translateTime: "HH:MM:ss Z",
                    ignore: "pid,hostname",
                },
            },
        },
        production: true,
        test: false,
    }

    const environment = process.env.NODE_ENV ?? "production"

    const serverOptions: FastifyServerOptions = {
        ajv: {
            customOptions: {
                removeAdditional: "all",
                coerceTypes: true,
                useDefaults: true,
                keywords: ["kind", "modifier"],
            },
        },
        logger: envToLogger[environment] ?? true,
    }
    const server =
        fastify(serverOptions).withTypeProvider<TypeBoxTypeProvider>()

    await server.register(multipart)
    await server.register(config)
    await server.register(jwt)
    await server.register(docs)
    await server.register(storage)

    server.decorateRequest('serverInstance');
    server.addHook("preHandler", async (request, reply) => {
        request.serverInstance = server
    })

    server.setErrorHandler((error, _request, reply) => {
        if (error instanceof ServiceError) {
            return reply.status(error.statusCode).send({
                error: error.name,
                message: error.message,
                statusCode: error.statusCode,
            })
        }

        const appError = error as Error & { statusCode?: number }
        const statusCode = appError.statusCode && appError.statusCode >= 400 ? appError.statusCode : 500
        return reply.status(statusCode).send({
            error: statusCode === 500 ? 'InternalServerError' : appError.name,
            message: statusCode === 500 ? 'Internal server error' : appError.message,
            statusCode,
        })
    })

    const userRepository = new DrizzleEntityRepository(users, 'User', mappers.user)
    const attachmentRepository = new DrizzleEntityRepository(attachments, 'Attachment', mappers.attachment)
    const categoryTypeRepository = new DrizzleEntityRepository(categoryTypes, 'Category type', mappers.categoryType)
    const categoryRepository = new DrizzleEntityRepository(categories, 'Category', mappers.category)
    const productRepository = new DrizzleEntityRepository(products, 'Product', mappers.product)
    const productAttributeRepository = new DrizzleEntityRepository(productAttributes, 'Product attribute', mappers.productAttribute)
    const productAssignedAttributeRepository = new DrizzleEntityRepository(productAssignedAttributes, 'Product assigned attribute', mappers.productAssignedAttribute)
    const productAttributeOptionRepository = new DrizzleEntityRepository(productAttributeOptions, 'Product attribute option', mappers.productAttributeOption)
    const productSpecificationRepository = new DrizzleEntityRepository(productSpecifications, 'Product specification', mappers.productSpecification)
    const productVariantRepository = new DrizzleEntityRepository(productVariants, 'Product variant', mappers.productVariant)
    const productImageRepository = new DrizzleEntityRepository(productImages, 'Product image', mappers.productImage)
    const variantAttributeValueRepository = new DrizzleEntityRepository(variantAttributeValues, 'Variant attribute value', mappers.variantAttributeValue)
    const cartRepository = new DrizzleEntityRepository(carts, 'Cart', mappers.cart)
    const cartItemRepository = new DrizzleEntityRepository(cartItems, 'Cart item', mappers.cartItem)
    const orderRepository = new DrizzleEntityRepository(orders, 'Order', mappers.order)
    const orderItemRepository = new DrizzleEntityRepository(orderItems, 'Order item', mappers.orderItem)
    const reviewRepository = new DrizzleEntityRepository(reviews, 'Review', mappers.review)
    const specialOfferRepository = new DrizzleEntityRepository(specialOffers, 'Special offer', mappers.specialOffer)
    const offerProductRepository = new DrizzleOfferProductRepository(offerProducts)

    const attachmentService = new AttachmentService(attachmentRepository, server.storage)
    registerAttachmentResolution(server, attachmentService)
    const userService = new UserService(userRepository, attachmentService)
    const storeServices = {
        attachmentService,
        categoryTypeService: new CategoryTypeService(categoryTypeRepository),
        categoryService: new CategoryService(categoryRepository, attachmentService),
        productService: new ProductService(productRepository, productImageRepository, attachmentService),
        productAttributeService: new ProductAttributeService(
            productAttributeRepository,
            productAssignedAttributeRepository,
            productAttributeOptionRepository,
            productSpecificationRepository,
        ),
        productVariantService: new ProductVariantService(productVariantRepository, variantAttributeValueRepository, attachmentService),
        cartService: new CartService(cartRepository, cartItemRepository),
        orderService: new OrderService(orderRepository, orderItemRepository),
        reviewService: new ReviewService(reviewRepository),
        specialOfferService: new SpecialOfferService(specialOfferRepository, offerProductRepository, attachmentService),
    }

    const applicationRoutes = routes(userService, storeServices)
    applicationRoutes.forEach((route) => {
        if (route.protected != false) {
            route.preValidation = route.roles
                ? [server.authenticate, server.authorize(route.roles)]
                : [server.authenticate]
        }

        server.route(route)
    })

    await server.ready()
    return server
}
