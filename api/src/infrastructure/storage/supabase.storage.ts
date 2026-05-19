import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { type IStorageService, type UploadResult } from '../../core/services/storage.svc.js'
import { ServiceError } from '../services/errors.js'

const MAX_ATTEMPTS = 3
const BACKOFF_MS = [100, 500, 2000] as const

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Retry a transient storage operation with exponential backoff. The Supabase
 * client is idempotent for our uses (upload uses upsert, delete is no-op for
 * missing keys), so retrying is safe.
 */
async function withRetry<T>(label: string, op: () => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await op()
    } catch (err) {
      lastErr = err
      if (attempt < MAX_ATTEMPTS - 1) await wait(BACKOFF_MS[attempt]!)
    }
  }
  const message = lastErr instanceof Error ? lastErr.message : String(lastErr)
  throw new ServiceError(`${label} failed after ${MAX_ATTEMPTS} attempts: ${message}`, 502)
}

export class SupabaseStorage implements IStorageService {
  private readonly client: SupabaseClient
  private readonly bucket: string

  constructor(url: string, serviceRoleKey: string, bucket: string) {
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false } })
    this.bucket = bucket
  }

  async upload(path: string, data: Buffer, mimeType: string): Promise<UploadResult> {
    await withRetry(`Storage upload (${path})`, async () => {
      const { error } = await this.client.storage
        .from(this.bucket)
        .upload(path, data, { contentType: mimeType, upsert: true })
      if (error) throw new Error(error.message)
    })
    return {
      url: this.getPublicUrl(path),
      path,
      size: data.length,
      mimeType,
    }
  }

  async delete(paths: string[]): Promise<void> {
    if (paths.length === 0) return
    await withRetry(`Storage delete (${paths.length} paths)`, async () => {
      const { error } = await this.client.storage.from(this.bucket).remove(paths)
      if (error) throw new Error(error.message)
    })
  }

  getPublicUrl(path: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path)
    return data.publicUrl
  }
}
