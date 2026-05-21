import { Type } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const IdParams = Type.Object({ id: Type.String() })

export const listAdminCustomersSchema: FastifySchema = { tags: ['Admin'] }
export const listAdminOrdersSchema:    FastifySchema = { tags: ['Admin'] }
export const getAdminOrderSchema:      FastifySchema = { tags: ['Admin'], params: IdParams }
