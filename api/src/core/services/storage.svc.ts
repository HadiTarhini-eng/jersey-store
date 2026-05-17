export interface UploadResult {
  url: string
  path: string
  size: number
  mimeType: string
}

export interface ImageFile {
  data: Buffer
  fileName: string
  mimeType: string
}

export interface IStorageService {
  upload: (path: string, data: Buffer, mimeType: string) => Promise<UploadResult>
  delete: (paths: string[]) => Promise<void>
  getPublicUrl: (path: string) => string
}
