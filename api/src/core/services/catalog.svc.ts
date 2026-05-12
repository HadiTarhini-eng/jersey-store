import { type Guid } from '../entities/base.js'
import { type Category, type CategoryType } from '../entities/catalog.js'

export interface ICategoryTypeService {
  createCategoryType: (categoryType: CategoryType) => Promise<CategoryType>
  updateCategoryType: (id: Guid, data: Partial<CategoryType>) => Promise<CategoryType>
  getCategoryTypeById: (id: Guid) => Promise<CategoryType | null>
  getCategoryTypeBySlug: (slug: string) => Promise<CategoryType | null>
  listCategoryTypes: () => Promise<CategoryType[]>
  deactivateCategoryType: (id: Guid) => Promise<CategoryType>
}

export interface ICategoryService {
  createCategory: (category: Category) => Promise<Category>
  updateCategory: (id: Guid, data: Partial<Category>) => Promise<Category>
  getCategoryById: (id: Guid) => Promise<Category | null>
  getCategoryBySlug: (slug: string) => Promise<Category | null>
  listCategories: (filters?: { categoryTypeId?: Guid; parentId?: Guid | null; isActive?: boolean }) => Promise<Category[]>
  listCategoryChildren: (parentId: Guid) => Promise<Category[]>
  moveCategory: (id: Guid, parentId?: Guid | null) => Promise<Category>
  setCategoryImage: (id: Guid, imageId?: Guid | null) => Promise<Category>
  activateCategory: (id: Guid) => Promise<Category>
  deactivateCategory: (id: Guid) => Promise<Category>
}
