import type { CreateUserPayload, UpdateUserPayload } from '../types/user.ts'
import type { ServerRequestHandler } from '../types/http.ts'
import {
  createUser,
  getUserDetail,
  listUsers,
  removeUser,
  updateUser,
} from '../services/user.service.ts'
import { createSuccessResponse } from '../utils/apiResponse.ts'

export const getUsers: ServerRequestHandler = async (req, res) => {
  const data = await listUsers(req.query)
  res.json(createSuccessResponse(data, '已返回用户列表'))
}

export const getUserById: ServerRequestHandler = async (req, res) => {
  const data = await getUserDetail(req.params.id)
  res.json(createSuccessResponse(data, '已返回用户详情'))
}

export const postUser: ServerRequestHandler = async (req, res) => {
  const data = await createUser(req.validatedBody as CreateUserPayload)
  res.status(201).json(createSuccessResponse(data, '用户创建成功', 201))
}

export const putUser: ServerRequestHandler = async (req, res) => {
  const data = await updateUser(req.params.id, req.validatedBody as UpdateUserPayload)
  res.json(createSuccessResponse(data, '用户更新成功'))
}

export const deleteUser: ServerRequestHandler = async (req, res) => {
  const data = await removeUser(req.params.id)
  res.json(createSuccessResponse(data, '用户删除成功'))
}
