import crypto from 'crypto'

export type Guid = string
export type EntityDate = Date

export interface Identifiable {
  id: Guid
}

export interface Activatable {
  isActive: boolean
}

export interface Timestamped {
  createdAt: EntityDate
  updatedAt: EntityDate
}

export type BusinessEntity = Identifiable & Activatable & Timestamped

export interface BusinessEntityPayload {
  id?: Guid
  isActive?: boolean
  createdAt?: EntityDate
  updatedAt?: EntityDate
}

export abstract class BaseEntity implements BusinessEntity {
  id: Guid
  isActive: boolean
  createdAt: EntityDate
  updatedAt: EntityDate

  protected constructor(payload: BusinessEntityPayload = {}) {
    const now = new Date()

    this.id = payload.id ?? crypto.randomUUID()
    this.isActive = payload.isActive ?? true
    this.createdAt = payload.createdAt ?? now
    this.updatedAt = payload.updatedAt ?? now
  }

  activate(): void {
    this.isActive = true
    this.touch()
  }

  deactivate(): void {
    this.isActive = false
    this.touch()
  }

  touch(date = new Date()): void {
    this.updatedAt = date
  }
}
