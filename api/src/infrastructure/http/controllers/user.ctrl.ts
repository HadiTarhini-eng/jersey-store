import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IUserService } from '../../../core/services/user.svc.js'
import type { ImageFile } from '../../../core/services/storage.svc.js'
import { ValidationError } from '../../services/errors.js'
import { assertOwner, sendOk } from '../routes/route-utils.js'
import { readFilePart } from '../utils/readFilePart.js'
import type { ChangeRoleBodyType, UpdateUserBodyType } from '../schemas/user.schemas.js'

const readSingleImageUpload = async (request: FastifyRequest): Promise<ImageFile> => {
  const part = await request.file()
  if (!part) throw new ValidationError('No file uploaded (expected multipart field "file")')
  return readFilePart(part)
}

type IdParams = { id: string }

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
