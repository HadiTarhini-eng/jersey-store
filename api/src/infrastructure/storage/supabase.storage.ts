import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { type IStorageService, type UploadResult } from '../../core/services/storage.svc.js'
import { ServiceError } from '../services/errors.js'

export class SupabaseStorage implements IStorageService {
  private readonly client: SupabaseClient
  private readonly bucket: string

  constructor(url: string, serviceRoleKey: string, bucket: string) {
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false } })
    this.bucket = bucket
  }

  async upload(path: string, data: Buffer, mimeType: string): Promise<UploadResult> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, data, { contentType: mimeType, upsert: true })
    if (error) throw new ServiceError(`Storage upload failed: ${error.message}`, 500)
    return {
      url: this.getPublicUrl(path),
      path,
      size: data.length,
      mimeType,
    }
  }

  async delete(paths: string[]): Promise<void> {
    if (paths.length === 0) return
    const { error } = await this.client.storage.from(this.bucket).remove(paths)
    if (error) throw new ServiceError(`Storage delete failed: ${error.message}`, 500)
  }

  getPublicUrl(path: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path)
    return data.publicUrl
  }
}
