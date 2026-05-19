import { type Guid } from '../entities/base.js'
import { type UiContent, type UiContentSlot } from '../entities/ui-content.js'
import { type ImageFile } from './storage.svc.js'

export interface CreateUiContentInput {
  slot: UiContentSlot
  payload: Record<string, unknown>
  sortOrder?: number
  uploadedBy: Guid
  image?: ImageFile
}

export interface UpdateUiContentInput {
  payload?: Record<string, unknown>
  sortOrder?: number
  isActive?: boolean
}

export interface IUiContentService {
  create: (input: CreateUiContentInput) => Promise<UiContent>
  listBySlot: (slot: UiContentSlot, filters?: { isActive?: boolean }) => Promise<UiContent[]>
  getById: (id: Guid) => Promise<UiContent | null>
  update: (id: Guid, data: UpdateUiContentInput) => Promise<UiContent>
  setImage: (id: Guid, file: ImageFile, uploadedBy: Guid) => Promise<UiContent>
  removeImage: (id: Guid) => Promise<UiContent>
  reorder: (id: Guid, sortOrder: number) => Promise<UiContent>
  activate: (id: Guid) => Promise<UiContent>
  deactivate: (id: Guid) => Promise<UiContent>
  delete: (id: Guid) => Promise<void>
}
