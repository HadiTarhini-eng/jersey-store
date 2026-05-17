import sharp from 'sharp'

const TARGET_BYTES = 100 * 1024
const COMPRESSED_MIME = 'image/webp'
const COMPRESSED_EXT = 'webp'

export interface CompressedImage {
  data: Buffer
  mimeType: typeof COMPRESSED_MIME
  extension: typeof COMPRESSED_EXT
  size: number
}

export async function compressImage(input: Buffer): Promise<CompressedImage> {
  const attempts: Array<{ width: number; quality: number }> = [
    { width: 1200, quality: 80 },
    { width: 1200, quality: 65 },
    { width: 900, quality: 60 },
    { width: 700, quality: 55 },
    { width: 500, quality: 50 },
    { width: 400, quality: 40 },
  ]

  let output: Buffer | null = null
  for (const { width, quality } of attempts) {
    output = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer()
    if (output.length <= TARGET_BYTES) break
  }

  if (!output) throw new Error('Image compression failed to produce output')

  return {
    data: output,
    mimeType: COMPRESSED_MIME,
    extension: COMPRESSED_EXT,
    size: output.length,
  }
}
