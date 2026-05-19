import type { MultipartFile } from '@fastify/multipart'
import { ValidationError } from '../../services/errors.js'
import type { ImageFile } from '../../../core/services/storage.svc.js'

/**
 * Read a multipart file part into an ImageFile. Detects truncation caused by
 * exceeding the multipart `fileSize` limit and turns it into a clean 400.
 *
 * @fastify/multipart sets `file.truncated = true` on the readable stream when
 * the file exceeds the limit; the buffer returned by `toBuffer()` is still
 * present but partial. Without this check we'd silently store corrupt bytes.
 */
export const readFilePart = async (part: MultipartFile): Promise<ImageFile> => {
  const data = await part.toBuffer()
  if (part.file.truncated) {
    throw new ValidationError(`File "${part.filename}" exceeds the upload size limit`)
  }
  return { data, fileName: part.filename, mimeType: part.mimetype }
}
