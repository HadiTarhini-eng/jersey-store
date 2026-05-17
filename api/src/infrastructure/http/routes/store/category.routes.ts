import type { RouteOptions } from 'fastify'
import type { ICategoryService, ICategoryTypeService } from '../../../../core/services/catalog.svc.js'
import * as ctrl from '../../controllers/category.ctrl.js'
import * as s from '../../schemas/category.schemas.js'

export const categoryRoutes = (
  categoryTypeService: ICategoryTypeService,
  categoryService: ICategoryService,
): RouteOptions[] => [
  // Category Types
  { method: 'POST',   url: '/category-types',           roles: ['Admin'],         schema: s.createCategoryTypeSchema,  handler: ctrl.createCategoryType(categoryTypeService) },
  { method: 'GET',    url: '/category-types',           protected: false,         schema: s.listCategoryTypesSchema,   handler: ctrl.listCategoryTypes(categoryTypeService) },
  { method: 'GET',    url: '/category-types/:id',       protected: false,         schema: s.getCategoryTypeSchema,     handler: ctrl.getCategoryTypeById(categoryTypeService) },
  { method: 'PATCH',  url: '/category-types/:id',       roles: ['Admin'],         schema: s.updateCategoryTypeSchema,  handler: ctrl.updateCategoryType(categoryTypeService) },
  { method: 'DELETE', url: '/category-types/:id',       roles: ['Admin'],         schema: s.deleteCategoryTypeSchema,  handler: ctrl.deactivateCategoryType(categoryTypeService) },

  // Categories
  { method: 'POST',   url: '/categories',               roles: ['Admin'],         schema: s.createCategorySchema,      handler: ctrl.createCategory(categoryService) },
  { method: 'GET',    url: '/categories',               protected: false,         schema: s.listCategoriesSchema,      handler: ctrl.listCategories(categoryService) },
  { method: 'GET',    url: '/categories/:id',           protected: false,         schema: s.getCategorySchema,         handler: ctrl.getCategoryById(categoryService) },
  { method: 'GET',    url: '/categories/:id/children',  protected: false,         schema: s.getCategoryChildrenSchema, handler: ctrl.listCategoryChildren(categoryService) },
  { method: 'PATCH',  url: '/categories/:id',           roles: ['Admin'],         schema: s.updateCategorySchema,      handler: ctrl.updateCategory(categoryService) },
  { method: 'PATCH',  url: '/categories/:id/move',      roles: ['Admin'],         schema: s.moveCategorySchema,        handler: ctrl.moveCategory(categoryService) },
  { method: 'PATCH',  url: '/categories/:id/image',     roles: ['Admin'],         schema: s.setCategoryImageSchema,    handler: ctrl.setCategoryImage(categoryService) },
  { method: 'POST',   url: '/categories/:id/activate',  roles: ['Admin'],         schema: s.activateCategorySchema,    handler: ctrl.activateCategory(categoryService) },
  { method: 'DELETE', url: '/categories/:id',           roles: ['Admin'],         schema: s.deleteCategorySchema,      handler: ctrl.deactivateCategory(categoryService) },
]
