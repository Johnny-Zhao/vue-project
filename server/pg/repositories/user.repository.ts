import { getPostgresPool } from '../database/postgres.ts'
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserEntity,
  UserFilters,
  UserListQuery,
  UserQueryRow,
  UserRow,
} from '../../types/user.ts'

interface CountRow {
  count?: string
}

interface IdRow {
  id?: number | string
}

const sortColumnMap: Record<NonNullable<UserFilters['sortField']>, string> = {
  id: 'id',
  username: 'username',
  name: 'name',
  role: 'role',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

function mapUserRow(row?: UserRow | null): UserEntity | null {
  if (!row) {
    return null
  }

  return {
    id: Number(row.id),
    username: row.username,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function buildUserListQuery(filters: UserFilters): UserListQuery {
  const conditions: string[] = []
  const values: unknown[] = []

  if (filters.status) {
    values.push(filters.status)
    conditions.push(`status = $${values.length}`)
  }

  if (filters.role) {
    values.push(filters.role)
    conditions.push(`role = $${values.length}`)
  }

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`
    values.push(keyword, keyword)
    const startIndex = values.length - 1
    conditions.push(`(username ILIKE $${startIndex} OR name ILIKE $${startIndex + 1})`)
  }

  const sortColumn = filters.sortField ? sortColumnMap[filters.sortField] : 'updated_at'
  const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC'

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    orderByClause: `ORDER BY ${sortColumn} ${sortDirection}, id DESC`,
    values,
  }
}

export async function findUserByUsername(username: string) {
  const pool = await getPostgresPool()
  const result = await pool.query<UserQueryRow>(
    `
      SELECT
        id,
        username,
        password,
        name,
        role,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM app_users
      WHERE username = $1
      LIMIT 1;
    `,
    [username],
  )

  return result.rows[0] ?? null
}

export async function findUserById(id: number) {
  const pool = await getPostgresPool()
  const result = await pool.query<UserRow>(
    `
      SELECT
        id,
        username,
        name,
        role,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM app_users
      WHERE id = $1
      LIMIT 1;
    `,
    [id],
  )

  return mapUserRow(result.rows[0] ?? null)
}

export async function listUsers(filters: UserFilters) {
  const pool = await getPostgresPool()
  const { whereClause, orderByClause, values } = buildUserListQuery(filters)
  const offset = (filters.page - 1) * filters.pageSize
  const pagingValues = [...values, filters.pageSize, offset]
  const limitIndex = pagingValues.length - 1
  const offsetIndex = pagingValues.length

  const rowsResult = await pool.query<UserRow>(
    `
      SELECT
        id,
        username,
        name,
        role,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM app_users
      ${whereClause}
      ${orderByClause}
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex};
    `,
    pagingValues,
  )

  const countResult = await pool.query<CountRow>(
    `
      SELECT COUNT(*)::text AS count
      FROM app_users
      ${whereClause};
    `,
    values,
  )

  return {
    list: rowsResult.rows
      .map((row) => mapUserRow(row))
      .filter((item): item is UserEntity => item !== null),
    total: Number(countResult.rows[0]?.count || 0),
  }
}

export async function createUser(payload: CreateUserPayload) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()
  const result = await pool.query<IdRow>(
    `
      INSERT INTO app_users (username, password, name, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `,
    [payload.username, payload.password, payload.name, payload.role, payload.status, now, now],
  )

  return findUserById(Number(result.rows[0]?.id))
}

export async function updateUserPassword(id: number, password: string) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()

  await pool.query(
    `
      UPDATE app_users
      SET password = $1, updated_at = $2
      WHERE id = $3;
    `,
    [password, now, id],
  )
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()
  const values: unknown[] = []
  const updates: string[] = []

  if (payload.name !== undefined) {
    values.push(payload.name)
    updates.push(`name = $${values.length}`)
  }

  if (payload.role !== undefined) {
    values.push(payload.role)
    updates.push(`role = $${values.length}`)
  }

  if (payload.status !== undefined) {
    values.push(payload.status)
    updates.push(`status = $${values.length}`)
  }

  if (payload.password !== undefined) {
    values.push(payload.password)
    updates.push(`password = $${values.length}`)
  }

  values.push(now)
  updates.push(`updated_at = $${values.length}`)
  values.push(id)

  await pool.query(
    `
      UPDATE app_users
      SET ${updates.join(', ')}
      WHERE id = $${values.length};
    `,
    values,
  )

  return findUserById(id)
}

export async function deleteUser(id: number) {
  const existingUser = await findUserById(id)

  if (!existingUser) {
    return null
  }

  const pool = await getPostgresPool()
  await pool.query('DELETE FROM app_users WHERE id = $1', [id])
  return existingUser.id
}
