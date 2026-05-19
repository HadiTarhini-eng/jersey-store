import crypto from 'crypto'
import sharp from 'sharp'
import { type ImageFile, type IStorageService } from '../../core/services/storage.svc.js'
import { compressImage } from '../../utils/image-compress.js'
import { ValidationError } from './errors.js'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 5 * 1024 * 1024

const extFromMime = (mimeType: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[mimeType] ?? 'bin'
}

export interface UploadedImage {
  /** Compressed/served URL — what the storefront should display. */
  fileUrl: string
  /** Original URL when retained, else null (compression-failed fallback). */
  originalUrl: string | null
  mimeType: string
  fileSize: number
  paths: string[] // for cleanup on failure
}

/**
 * Validate image bytes against the claimed MIME type, reject empty/oversized
 * uploads, and reject truncated uploads. Throws ValidationError on failure.
 */
export async function validateImage(file: ImageFile, opts: { truncated?: boolean } = {}): Promise<void> {
  if (opts.truncated) throw new ValidationError(`File "${file.fileName}" exceeds the upload size limit`)
  if (!file.data || file.data.length === 0) throw new ValidationError('Uploaded file is empty')
  if (file.data.length > MAX_BYTES) {
    throw new ValidationError(`File "${file.fileName}" is ${file.data.length} bytes; max ${MAX_BYTES} (5 MB)`)
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
    throw new ValidationError(`Unsupported file type: ${file.mimeType}. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`)
  }

  // Verify bytes actually match the claimed MIME — defense against header spoofing.
  try {
    const meta = await sharp(file.data).metadata()
    if (!meta.format) throw new Error('unrecognized image format')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new ValidationError(`File "${file.fileName}" is not a valid image: ${message}`)
  }
}

/**
 * Upload a single image to storage following the "original + compressed"
 * pattern used for the product gallery. Compression is best-effort — if sharp
 * fails for a corrupt or unusual file we still keep the original.
 *
 * Caller is responsible for tracking `paths` and calling `storage.delete`
 * on partial-failure rollbacks.
 */
export async function uploadProductImage(
  storage: IStorageService,
  file: ImageFile,
): Promise<UploadedImage> {
  await validateImage(file)

  const id = crypto.randomUUID()
  const originalPath = `originals/${id}.${extFromMime(file.mimeType)}`
  const original = await storage.upload(originalPath, file.data, file.mimeType)

  // Best-effort compression — never fatal.
  let fileUrl = original.url
  const paths = [originalPath]
  try {
    const compressed = await compressImage(file.data)
    const compressedPath = `compressed/${id}.webp`
    const compressedUpload = await storage.upload(compressedPath, compressed.data, compressed.mimeType)
    fileUrl = compressedUpload.url
    paths.push(compressedPath)
  } catch {
    // Keep original as the served URL; no compressed sibling.
  }

  return {
    fileUrl,
    originalUrl: original.url,
    mimeType: file.mimeType,
    fileSize: file.data.length,
    paths,
  }
}

/**
 * Upload a single image meant to be stored inline on an entity (user avatar,
 * category image, offer banner, variant image, site logo, ui content image).
 * Returns just the served URL — compressed if compression succeeded, else
 * the original.
 */
export async function uploadInlineImage(
  storage: IStorageService,
  file: ImageFile,
): Promise<{ url: string; path: string }> {
  await validateImage(file)
  const id = crypto.randomUUID()

  try {
    const compressed = await compressImage(file.data)
    const path = `inline/${id}.webp`
    const result = await storage.upload(path, compressed.data, compressed.mimeType)
    return { url: result.url, path }
  } catch {
    // Compression failed — store the original bytes instead.
    const path = `inline/${id}.${extFromMime(file.mimeType)}`
    const result = await storage.upload(path, file.data, file.mimeType)
    return { url: result.url, path }
  }
}

/**
 * Best-effort delete of an inline-uploaded image by its public URL. Used when
 * replacing an entity's image to avoid orphaning the previous file.
 */
export async function deleteInlineImage(storage: IStorageService, url: string | null | undefined): Promise<void> {
  if (!url) return
  // Public URL shape: `${supabase}/storage/v1/object/public/${bucket}/${path}`.
  // We only need the path after `/public/<bucket>/`.
  const match = url.match(/\/public\/[^/]+\/(.+)$/)
  if (!match) return
  await storage.delete([decodeURIComponent(match[1]!)]).catch(() => undefined)
}
