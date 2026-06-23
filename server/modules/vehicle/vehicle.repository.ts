import { getPostgresPool } from '../../pg/database/postgres.ts'
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  VehicleEntity,
  VehicleFilters,
  VehicleListQuery,
  VehicleRow,
} from '../../types/vehicle.ts'

interface CountRow {
  count?: string
}

interface IdRow {
  id?: number | string
}

const sortColumnMap: Record<NonNullable<VehicleFilters['sortField']>, string> = {
  id: 'id',
  plateNumber: 'plate_number',
  vehicleType: 'vehicle_type',
  driveType: 'drive_type',
  energyType: 'energy_type',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

// 把数据库行统一转换成前后端共享的车辆实体结构。
function mapVehicleRow(row?: VehicleRow | null): VehicleEntity | null {
  if (!row) {
    return null
  }

  return {
    id: Number(row.id),
    plateNumber: row.plateNumber,
    vehicleType: row.vehicleType,
    driveType: row.driveType,
    energyType: row.energyType,
    brandModel: row.brandModel,
    vin: row.vin,
    axleCount: row.axleCount == null ? null : Number(row.axleCount),
    loadCapacity: row.loadCapacity == null ? null : Number(row.loadCapacity),
    status: row.status,
    remark: row.remark,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  }
}

// 根据筛选条件拼接分页查询 SQL。
function buildVehicleListQuery(filters: VehicleFilters): VehicleListQuery {
  const conditions: string[] = []
  const values: unknown[] = []

  if (filters.plateNumber) {
    values.push(`%${filters.plateNumber}%`)
    conditions.push(`plate_number ILIKE $${values.length}`)
  }

  if (filters.vehicleType) {
    values.push(filters.vehicleType)
    conditions.push(`vehicle_type = $${values.length}`)
  }

  if (filters.driveType) {
    values.push(filters.driveType)
    conditions.push(`drive_type = $${values.length}`)
  }

  if (filters.energyType) {
    values.push(filters.energyType)
    conditions.push(`energy_type = $${values.length}`)
  }

  if (filters.status) {
    values.push(filters.status)
    conditions.push(`status = $${values.length}`)
  }

  if (filters.createdFrom) {
    values.push(filters.createdFrom)
    conditions.push(`created_at >= $${values.length}`)
  }

  if (filters.createdTo) {
    values.push(filters.createdTo)
    conditions.push(`created_at <= $${values.length}`)
  }

  if (filters.updatedFrom) {
    values.push(filters.updatedFrom)
    conditions.push(`updated_at >= $${values.length}`)
  }

  if (filters.updatedTo) {
    values.push(filters.updatedTo)
    conditions.push(`updated_at <= $${values.length}`)
  }

  const sortColumn = filters.sortField ? sortColumnMap[filters.sortField] : 'updated_at'
  const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC'

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    orderByClause: `ORDER BY ${sortColumn} ${sortDirection}, id DESC`,
    values,
  }
}

// 通过 id 查询车辆详情。
export async function findVehicleById(id: number) {
  const pool = await getPostgresPool()
  const result = await pool.query<VehicleRow>(
    `
      SELECT
        id,
        plate_number AS "plateNumber",
        vehicle_type AS "vehicleType",
        drive_type AS "driveType",
        energy_type AS "energyType",
        brand_model AS "brandModel",
        vin,
        axle_count AS "axleCount",
        load_capacity AS "loadCapacity",
        status,
        remark,
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        created_by_name AS "createdBy",
        updated_by_name AS "updatedBy"
      FROM fleet_vehicles
      WHERE id = $1
      LIMIT 1;
    `,
    [id],
  )

  return mapVehicleRow(result.rows[0] ?? null)
}

// 通过车牌号查询车辆，用于唯一性校验。
export async function findVehicleByPlateNumber(plateNumber: string) {
  const pool = await getPostgresPool()
  const result = await pool.query<VehicleRow>(
    `
      SELECT
        id,
        plate_number AS "plateNumber",
        vehicle_type AS "vehicleType",
        drive_type AS "driveType",
        energy_type AS "energyType",
        brand_model AS "brandModel",
        vin,
        axle_count AS "axleCount",
        load_capacity AS "loadCapacity",
        status,
        remark,
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        created_by_name AS "createdBy",
        updated_by_name AS "updatedBy"
      FROM fleet_vehicles
      WHERE plate_number = $1
      LIMIT 1;
    `,
    [plateNumber],
  )

  return mapVehicleRow(result.rows[0] ?? null)
}

// 查询车辆列表并返回分页结果。
export async function listVehicles(filters: VehicleFilters) {
  const pool = await getPostgresPool()
  const { whereClause, orderByClause, values } = buildVehicleListQuery(filters)
  const offset = (filters.page - 1) * filters.pageSize
  const pagingValues = [...values, filters.pageSize, offset]
  const limitIndex = pagingValues.length - 1
  const offsetIndex = pagingValues.length

  const rowsResult = await pool.query<VehicleRow>(
    `
      SELECT
        id,
        plate_number AS "plateNumber",
        vehicle_type AS "vehicleType",
        drive_type AS "driveType",
        energy_type AS "energyType",
        brand_model AS "brandModel",
        vin,
        axle_count AS "axleCount",
        load_capacity AS "loadCapacity",
        status,
        remark,
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        created_by_name AS "createdBy",
        updated_by_name AS "updatedBy"
      FROM fleet_vehicles
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
      FROM fleet_vehicles
      ${whereClause};
    `,
    values,
  )

  return {
    list: rowsResult.rows
      .map((row) => mapVehicleRow(row))
      .filter((item): item is VehicleEntity => item !== null),
    total: Number(countResult.rows[0]?.count || 0),
  }
}

// 新增车辆，并返回最新落库结果。
export async function createVehicle(
  payload: CreateVehiclePayload & {
    createdById: number
    createdByName: string
  },
) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()
  const result = await pool.query<IdRow>(
    `
      INSERT INTO fleet_vehicles (
        plate_number,
        vehicle_type,
        drive_type,
        energy_type,
        brand_model,
        vin,
        axle_count,
        load_capacity,
        status,
        remark,
        created_at,
        updated_at,
        created_by,
        created_by_name,
        updated_by,
        updated_by_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id;
    `,
    [
      payload.plateNumber,
      payload.vehicleType,
      payload.driveType,
      payload.energyType,
      payload.brandModel,
      payload.vin,
      payload.axleCount ?? null,
      payload.loadCapacity ?? null,
      payload.status,
      payload.remark ?? '',
      now,
      now,
      payload.createdById,
      payload.createdByName,
      payload.createdById,
      payload.createdByName,
    ],
  )

  return findVehicleById(Number(result.rows[0]?.id))
}

// 更新车辆，并返回最新的车辆详情。
export async function updateVehicle(
  id: number,
  payload: UpdateVehiclePayload & {
    updatedById: number
    updatedByName: string
  },
) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()
  const values: unknown[] = []
  const updates: string[] = []

  if (payload.plateNumber !== undefined) {
    values.push(payload.plateNumber)
    updates.push(`plate_number = $${values.length}`)
  }

  if (payload.vehicleType !== undefined) {
    values.push(payload.vehicleType)
    updates.push(`vehicle_type = $${values.length}`)
  }

  if (payload.driveType !== undefined) {
    values.push(payload.driveType)
    updates.push(`drive_type = $${values.length}`)
  }

  if (payload.energyType !== undefined) {
    values.push(payload.energyType)
    updates.push(`energy_type = $${values.length}`)
  }

  if (payload.brandModel !== undefined) {
    values.push(payload.brandModel)
    updates.push(`brand_model = $${values.length}`)
  }

  if (payload.vin !== undefined) {
    values.push(payload.vin)
    updates.push(`vin = $${values.length}`)
  }

  if (payload.axleCount !== undefined) {
    values.push(payload.axleCount)
    updates.push(`axle_count = $${values.length}`)
  }

  if (payload.loadCapacity !== undefined) {
    values.push(payload.loadCapacity)
    updates.push(`load_capacity = $${values.length}`)
  }

  if (payload.status !== undefined) {
    values.push(payload.status)
    updates.push(`status = $${values.length}`)
  }

  if (payload.remark !== undefined) {
    values.push(payload.remark)
    updates.push(`remark = $${values.length}`)
  }

  values.push(now)
  updates.push(`updated_at = $${values.length}`)
  values.push(payload.updatedById)
  updates.push(`updated_by = $${values.length}`)
  values.push(payload.updatedByName)
  updates.push(`updated_by_name = $${values.length}`)
  values.push(id)

  await pool.query(
    `
      UPDATE fleet_vehicles
      SET ${updates.join(', ')}
      WHERE id = $${values.length};
    `,
    values,
  )

  return findVehicleById(id)
}

// 删除车辆，成功时返回被删除的数据用于审计记录。
export async function deleteVehicle(id: number) {
  const existingVehicle = await findVehicleById(id)

  if (!existingVehicle) {
    return null
  }

  const pool = await getPostgresPool()
  await pool.query('DELETE FROM fleet_vehicles WHERE id = $1', [id])
  return existingVehicle
}
