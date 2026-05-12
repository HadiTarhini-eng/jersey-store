export class ServiceError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class NotFoundError extends ServiceError {
  constructor(entityName: string) {
    super(`${entityName} not found`, 404)
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string) {
    super(message, 409)
  }
}
