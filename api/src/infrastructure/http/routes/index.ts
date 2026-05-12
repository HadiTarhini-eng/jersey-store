import { type RouteOptions } from 'fastify'
import { type IUserService } from '../../../core/services/user.svc.js'
import { userRoutes } from './user.routes.js'
import { storeRoutes, type StoreRouteServices } from './store.routes.js'

export default (
  userService: IUserService,
  storeServices: StoreRouteServices
): RouteOptions[] => ([
  ...userRoutes(userService),
  ...storeRoutes(storeServices)
])
