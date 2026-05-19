import { type Guid } from '../../core/entities/base.js'
import { Category, type CategoryType } from '../../core/entities/catalog.js'
import { type CreateCategoryInput, type ICategoryService, type ICategoryTypeService } from '../../core/services/catalog.svc.js'
import { type ImageFile, type IStorageService } from '../../core/services/storage.svc.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { ConflictError, ValidationError } from './errors.js'
import { deleteInlineImage, uploadInlineImage } from './image.svc.js'
import { assertGuid, assertRequiredString, assertSlug } from './validators.js'

export class CategoryTypeService implements ICategoryTypeService {
  constructor(
    private readonly categoryTypeRepository: EntityRepository<CategoryType>,
  ) {}

  async createCategoryType(categoryType: CategoryType): Promise<CategoryType> {
    this.validateCategoryType(categoryType)
    await this.assertUniqueSlug(categoryType.slug)
    return this.categoryTypeRepository.create(categoryType)
  }

  async updateCategoryType(id: Guid, data: Partial<CategoryType>): Promise<CategoryType> {
    assertGuid(id)
    if (data.slug) {
      assertSlug(data.slug)
      await this.assertUniqueSlug(data.slug, id)
    }
    if (data.name !== undefined) assertRequiredString(data.name, 'name')
    return this.categoryTypeRepository.update(id, data)
  }

  async getCategoryTypeById(id: Guid): Promise<CategoryType | null> {
    assertGuid(id)
    return this.categoryTypeRepository.get(id)
  }

  async getCategoryTypeBySlug(slug: string): Promise<CategoryType | null> {
    assertSlug(slug)
    return this.categoryTypeRepository.findBy('slug', slug)
  }

  async listCategoryTypes(): Promise<CategoryType[]> {
    return this.categoryTypeRepository.list()
  }

  async deactivateCategoryType(id: Guid): Promise<CategoryType> {
    assertGuid(id)
    return this.categoryTypeRepository.update(id, { isActive: false } as Partial<CategoryType>)
  }

  private validateCategoryType(categoryType: CategoryType): void {
    assertGuid(categoryType.id)
    assertRequiredString(categoryType.name, 'name')
    assertSlug(categoryType.slug)
  }

  private async assertUniqueSlug(slug: string, exceptId?: Guid): Promise<void> {
    const existing = await this.categoryTypeRepository.findBy('slug', slug)
    if (existing && existing.id !== exceptId) throw new ConflictError('Category type slug already exists')
  }
}

export class CategoryService implements ICategoryService {
  constructor(
    private readonly categoryRepository: EntityRepository<Category>,
    private readonly storage: IStorageService,
  ) {}

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    assertGuid(input.uploadedBy, 'uploadedBy')
    assertGuid(input.data.categoryTypeId, 'categoryTypeId')
    if (input.data.parentId) assertGuid(input.data.parentId, 'parentId')
    assertRequiredString(input.data.name, 'name')
    assertSlug(input.data.slug)
    await this.assertUniqueSlug(input.data.slug)

    let imageUrl: string | null = null
    if (input.image) {
      const uploaded = await uploadInlineImage(this.storage, input.image)
      imageUrl = uploaded.url
    }

    const category = new Category({ ...input.data, imageUrl })
    await this.assertValidParent(category)
    return this.categoryRepository.create(category)
  }

  async updateCategory(id: Guid, data: Partial<Category>): Promise<Category> {
    assertGuid(id)
    if (data.slug) {
      assertSlug(data.slug)
      await this.assertUniqueSlug(data.slug, id)
    }
    if (data.name !== undefined) assertRequiredString(data.name, 'name')
    if (data.categoryTypeId !== undefined) assertGuid(data.categoryTypeId, 'categoryTypeId')
    if (data.parentId !== undefined) await this.assertNoCycle(id, data.parentId)
    return this.categoryRepository.update(id, data)
  }

  async getCategoryById(id: Guid): Promise<Category | null> {
    assertGuid(id)
    return this.categoryRepository.get(id)
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    assertSlug(slug)
    return this.categoryRepository.findBy('slug', slug)
  }

  async listCategories(filters: { categoryTypeId?: Guid; parentId?: Guid | null; isActive?: boolean } = {}): Promise<Category[]> {
    if (filters.categoryTypeId) assertGuid(filters.categoryTypeId, 'categoryTypeId')
    if (filters.parentId) assertGuid(filters.parentId, 'parentId')
    const all = await this.categoryRepository.list()
    return all.filter((category) => {
      if (filters.categoryTypeId !== undefined && category.categoryTypeId !== filters.categoryTypeId) return false
      if (filters.parentId !== undefined && category.parentId !== filters.parentId) return false
      if (filters.isActive !== undefined && category.isActive !== filters.isActive) return false
      return true
    })
  }

  async listCategoryChildren(parentId: Guid): Promise<Category[]> {
    assertGuid(parentId, 'parentId')
    return this.categoryRepository.listBy('parentId', parentId)
  }

  async moveCategory(id: Guid, parentId?: Guid | null): Promise<Category> {
    assertGuid(id)
    if (parentId) assertGuid(parentId, 'parentId')
    await this.assertNoCycle(id, parentId)
    return this.categoryRepository.update(id, { parentId } as Partial<Category>)
  }

  async setCategoryImage(id: Guid, file: ImageFile, uploadedBy: Guid): Promise<Category> {
    assertGuid(id)
    assertGuid(uploadedBy, 'uploadedBy')
    const category = await this.categoryRepository.require(id, 'Category')
    await deleteInlineImage(this.storage, category.imageUrl)
    const uploaded = await uploadInlineImage(this.storage, file)
    return this.categoryRepository.update(id, { imageUrl: uploaded.url } as Partial<Category>)
  }

  async removeCategoryImage(id: Guid): Promise<Category> {
    assertGuid(id)
    const category = await this.categoryRepository.require(id, 'Category')
    await deleteInlineImage(this.storage, category.imageUrl)
    return this.categoryRepository.update(id, { imageUrl: null } as Partial<Category>)
  }

  async activateCategory(id: Guid): Promise<Category> {
    assertGuid(id)
    return this.categoryRepository.update(id, { isActive: true } as Partial<Category>)
  }

  async deactivateCategory(id: Guid): Promise<Category> {
    assertGuid(id)
    return this.categoryRepository.update(id, { isActive: false } as Partial<Category>)
  }

  private async assertUniqueSlug(slug: string, exceptId?: Guid): Promise<void> {
    const existing = await this.categoryRepository.findBy('slug', slug)
    if (existing && existing.id !== exceptId) throw new ConflictError('Category slug already exists')
  }

  private async assertValidParent(category: Category): Promise<void> {
    if (!category.parentId) return
    if (category.parentId === category.id) throw new ValidationError('Category cannot be its own parent')
    await this.categoryRepository.require(category.parentId, 'Parent category')
  }

  private async assertNoCycle(categoryId: Guid, parentId?: Guid | null): Promise<void> {
    if (!parentId) return
    if (categoryId === parentId) throw new ValidationError('Category cannot be its own parent')
    let current = await this.categoryRepository.get(parentId)
    while (current) {
      if (current.parentId === categoryId) throw new ValidationError('Category parent would create a cycle')
      current = current.parentId ? await this.categoryRepository.get(current.parentId) : null
    }
  }
}
