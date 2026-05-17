import type { FastifyReply, FastifyRequest } from 'fastify'
import { User } from '../../../core/entities/user.js'
import type { IUserService } from '../../../core/services/user.svc.js'
import type { ImageFile } from '../../../core/services/storage.svc.js'
import { VerifyPassword } from '../../../utils/hash.js'
import { ServiceError, ValidationError } from '../../services/errors.js'
import { assertOwner, sendCreated, sendOk } from '../routes/route-utils.js'
import type {
  ChangePasswordBodyType, ChangeRoleBodyType, CreateUserBodyType,
  LoginBodyType, UpdateUserBodyType,
} from '../schemas/user.schemas.js'

const readSingleImageUpload = async (request: FastifyRequest): Promise<ImageFile> => {
  const file = await request.file()
  if (!file) throw new ValidationError('No file uploaded (expected multipart field "file")')
  return { data: await file.toBuffer(), fileName: file.filename, mimeType: file.mimetype }
}

type IdParams = { id: string }

export const createUser = (service: IUserService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendCreated(reply, await service.createUser(new User(request.body as CreateUserBodyType)))
  }

export const loginUser = (service: IUserService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { email, password } = request.body as LoginBodyType
    const user = await service.getUserByEmail(email)
    if (!user || !VerifyPassword({ password, hash: user.passwordHash })) {
      throw new ServiceError('Invalid email or password', 401)
    }
    const token = request.serverInstance.jwt.sign({ id: user.id, email: user.email, role: user.role })
    sendOk(reply, { token })
  }

export const getMe = () =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, request.user)
  }

export const listUsers = (service: IUserService) =>
  async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getAllUsers())
  }

export const getUserById = (service: IUserService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    assertOwner(request, id)
    sendOk(reply, await service.getUserById(id))
  }

export const updateUser = (service: IUserService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    assertOwner(request, id)
    sendOk(reply, await service.updateUser(id, request.body as UpdateUserBodyType))
  }

export const changePassword = (service: IUserService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    assertOwner(request, id)
    const { password } = request.body as ChangePasswordBodyType
    sendOk(reply, await service.changePassword(id, password))
  }

export const changeRole = (service: IUserService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { role } = request.body as ChangeRoleBodyType
    sendOk(reply, await service.changeRole(id, role))
  }

export const setProfileImage = (service: IUserService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    assertOwner(request, id)
    const file = await readSingleImageUpload(request)
    sendOk(reply, await service.setProfileImage(id, file))
  }

export const removeProfileImage = (service: IUserService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    assertOwner(request, id)
    sendOk(reply, await service.removeProfileImage(id))
  }

export const activateUser = (service: IUserService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.activateUser((request.params as IdParams).id))
  }

export const deactivateUser = (service: IUserService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.deactivateUser((request.params as IdParams).id))
  }
