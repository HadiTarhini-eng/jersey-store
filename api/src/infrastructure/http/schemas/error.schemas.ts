import { Type } from '@sinclair/typebox'

export const notFoundSchema = Type.Object({
  statusCode: Type.Number({ default: 404 }),
  error: Type.String({ default: 'Not found' }),
  message: Type.String({ default: 'Not found' })
})

export const badRequestSchema = Type.Object({
  statusCode: Type.Number({ default: 400 }),
  error: Type.String({ default: 'Bad Request' }),
  message: Type.String({ default: 'body/status must be equal to one of the allowed values' })
})

export const unauthorizedSchema = Type.Object({
  statusCode: Type.Number({ default: 401 }),
  error: Type.String({ default: 'Unauthorized' }),
  message: Type.String({ default: 'Unauthorized' })
})

export const forbiddenSchema = Type.Object({
  statusCode: Type.Number({ default: 403 }),
  error: Type.String({ default: 'Forbidden' }),
  message: Type.String({ default: 'Forbidden' })
})

export const preconditionFailed = Type.Object({
  statusCode: Type.Number({ default: 412 }),
  error: Type.String({ default: 'Precondition Failed' }),
  message: Type.String({ default: 'Precondition Failed' })
})

export const internatServerError = Type.Object({
  statusCode: Type.Number({ default: 500 }),
  error: Type.String({ default: 'Internal Server Error' }),
  message: Type.String({ default: 'An unexpected error occurred' })
})
