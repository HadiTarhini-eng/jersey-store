import { type Guid } from '../entities/base.js'
import { type Category, type CategoryPayload, type CategoryType } from '../entities/catalog.js'
import { type ImageFile } from './storage.svc.js'

export interface ICategoryTypeService {
  createCategoryType: (categoryType: CategoryType) => Promise<CategoryType>
  updateCategoryType: (id: Guid, data: Partial<CategoryType>) => Promise<CategoryType>
  getCategoryTypeById: (id: Guid) => Promise<CategoryType | null>
  getCategoryTypeBySlug: (slug: string) => Promise<CategoryType | null>
  listCategoryTypes: () => Promise<CategoryType[]>
  deactivateCategoryType: (id: Guid) => Promise<CategoryType>
}

export interface CreateCategoryInput {
  data: Omit<CategoryPayload, 'imageId'>
  uploadedBy: Guid
  image?: ImageFile
}

export interface ICategoryService {
  createCategory: (input: CreateCategoryInput) => Promise<Category>
  updateCategory: (id: Guid, data: Partial<Category>) => Promise<Category>
  getCategoryById: (id: Guid) => Promise<Category | null>
  getCategoryBySlug: (slug: string) => Promise<Category | null>
  listCategories: (filters?: { categoryTypeId?: Guid; parentId?: Guid | null; isActive?: boolean }) => Promise<Category[]>
  listCategoryChildren: (parentId: Guid) => Promise<Category[]>
  moveCategory: (id: Guid, parentId?: Guid | null) => Promise<Category>
  setCategoryImage: (id: Guid, file: ImageFile, uploadedBy: Guid) => Promise<Category>
  removeCategoryImage: (id: Guid) => Promise<Category>
  activateCategory: (id: Guid) => Promise<Category>
  deactivateCategory: (id: Guid) => Promise<Category>
}
