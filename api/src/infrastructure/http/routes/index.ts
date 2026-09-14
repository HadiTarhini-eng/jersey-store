import { type RouteOptions } from 'fastify'
import { type IUserService } from '../../../core/services/user.svc.js'
import { authRoutes } from './auth.routes.js'
import { userRoutes } from './user.routes.js'
import { storeRoutes, type StoreRouteServices } from './store.routes.js'

export default (
  userService: IUserService,
  storeServices: StoreRouteServices
): RouteOptions[] => ([
  ...authRoutes(userService),
  ...userRoutes(userService),
  ...storeRoutes(storeServices)
])
