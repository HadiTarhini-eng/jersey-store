import { and, eq } from 'drizzle-orm'
import { type BusinessEntity, type Guid } from '../../core/entities/base.js'
import { NotFoundError } from '../services/errors.js'

export interface EntityRepository<T extends BusinessEntity> {
  create: (entity: T) => Promise<T>
  get: (id: Guid) => Promise<T | null>
  require: (id: Guid, entityName?: string) => Promise<T>
  list: () => Promise<T[]>
  update: (id: Guid, patch: Partial<T>) => Promise<T>
  delete: (id: Guid) => Promise<void>
  findBy: (fieldName: string, value: unknown) => Promise<T | null>
  listBy: (fieldName: string, value: unknown) => Promise<T[]>
}

type Mapper<T> = {
  toDomain: (row: any) => T
  toRow: (entity: Partial<T>) => Record<string, unknown>
}

export class DrizzleEntityRepository<T extends BusinessEntity> implements EntityRepository<T> {
  constructor(
    private readonly table: any,
    private readonly entityName: string,
    private readonly mapper: Mapper<T>,
  ) {}

  async create(entity: T): Promise<T> {
    const db = await this.getDb()
    await db.insert(this.table).values(this.mapper.toRow(entity))
    return entity
  }

  async get(id: Guid): Promise<T | null> {
    const db = await this.getDb()
    const rows = await db.select().from(this.table).where(eq(this.table.id, id)).limit(1)
    return rows.length > 0 ? this.mapper.toDomain(rows[0]) : null
  }

  async require(id: Guid, entityName = this.entityName): Promise<T> {
    const entity = await this.get(id)
    if (!entity) throw new NotFoundError(entityName)
    return entity
  }

  async list(): Promise<T[]> {
    const db = await this.getDb()
    const rows = await db.select().from(this.table)
    return rows.map((row: unknown) => this.mapper.toDomain(row))
  }

  async update(id: Guid, patch: Partial<T>): Promise<T> {
    const db = await this.getDb()
    await db.update(this.table).set(this.mapper.toRow({ ...patch, updatedAt: new Date() } as Partial<T>)).where(eq(this.table.id, id))
    return this.require(id)
  }

  async delete(id: Guid): Promise<void> {
    const db = await this.getDb()
    await db.delete(this.table).where(eq(this.table.id, id))
  }

  async findBy(fieldName: string, value: unknown): Promise<T | null> {
    const rows = await this.listBy(fieldName, value)
    return rows[0] ?? null
  }

  async listBy(fieldName: string, value: unknown): Promise<T[]> {
    const db = await this.getDb()
    const column = this.table[fieldName]
    const rows = await db.select().from(this.table).where(eq(column, value))
    return rows.map((row: unknown) => this.mapper.toDomain(row))
  }

  private async getDb(): Promise<any> {
    const { db } = await import('../database/db.js')
    return db
  }
}

export interface OfferProductRepository {
  create: (offerId: Guid, productId: Guid) => Promise<void>
  delete: (offerId: Guid, productId: Guid) => Promise<void>
  listProductIdsByOffer: (offerId: Guid) => Promise<Guid[]>
  listOfferIdsByProduct: (productId: Guid) => Promise<Guid[]>
  exists: (offerId: Guid, productId: Guid) => Promise<boolean>
}

export class DrizzleOfferProductRepository implements OfferProductRepository {
  constructor(private readonly table: any) {}

  async create(offerId: Guid, productId: Guid): Promise<void> {
    const db = await this.getDb()
    await db.insert(this.table).values({ offerId, productId })
  }

  async delete(offerId: Guid, productId: Guid): Promise<void> {
    const db = await this.getDb()
    await db.delete(this.table).where(and(eq(this.table.offerId, offerId), eq(this.table.productId, productId)))
  }

  async listProductIdsByOffer(offerId: Guid): Promise<Guid[]> {
    const db = await this.getDb()
    const rows = await db.select().from(this.table).where(eq(this.table.offerId, offerId))
    return rows.map((row: any) => row.productId)
  }

  async listOfferIdsByProduct(productId: Guid): Promise<Guid[]> {
    const db = await this.getDb()
    const rows = await db.select().from(this.table).where(eq(this.table.productId, productId))
    return rows.map((row: any) => row.offerId)
  }

  async exists(offerId: Guid, productId: Guid): Promise<boolean> {
    const db = await this.getDb()
    const rows = await db.select().from(this.table).where(and(eq(this.table.offerId, offerId), eq(this.table.productId, productId))).limit(1)
    return rows.length > 0
  }

  private async getDb(): Promise<any> {
    const { db } = await import('../database/db.js')
    return db
  }
}
