import { expect, test } from '@playwright/test'

const uniquePlateNumber = `TEST-${Date.now()}`
const updatedPlateNumber = `${uniquePlateNumber}-U`
const createdBrandModel = '面试演示车辆'
const updatedBrandModel = '面试演示车辆-已编辑'

// 登录管理员账号并进入首页。
async function loginAsAdmin(page: Parameters<typeof test>[0]['page']) {
  await page.goto('/login')
  await page.getByLabel('用户名').fill('admin')
  await page.getByLabel('密码').fill('123456')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByRole('heading', { name: '管理端练习项目' })).toBeVisible()
}

// 打开车辆管理页面。
async function openVehicleManagement(page: Parameters<typeof test>[0]['page']) {
  await page.goto('/vehicle-management')
  await expect(page.getByRole('heading', { name: '车辆管理' })).toBeVisible()
}

// 新增一条车辆记录。
async function createVehicle(page: Parameters<typeof test>[0]['page']) {
  await page.getByRole('button', { name: '新增车辆' }).click()
  const dialog = page.getByRole('dialog', { name: '新增车辆' })
  await expect(dialog).toBeVisible()

  await dialog.getByLabel('车牌号').fill(uniquePlateNumber)
  await dialog.getByLabel('品牌型号').fill(createdBrandModel)
  await dialog.getByLabel('备注').fill('用于 E2E 演示的车辆档案')

  await dialog.getByRole('button', { name: '新增车辆', exact: true }).click()
  await expect(page.getByText('车辆新增成功')).toBeVisible()
  await expect(page.getByRole('cell', { name: uniquePlateNumber })).toBeVisible()
}

// 编辑刚新增的车辆记录。
async function updateVehicle(page: Parameters<typeof test>[0]['page']) {
  const row = page
    .locator('tr', { has: page.getByRole('cell', { name: uniquePlateNumber }) })
    .first()
  await row.getByRole('button', { name: '编辑' }).click()
  const dialog = page.getByRole('dialog', { name: '编辑车辆' })
  await expect(dialog).toBeVisible()

  await dialog.getByLabel('车牌号').fill(updatedPlateNumber)
  await dialog.getByLabel('品牌型号').fill(updatedBrandModel)
  await dialog.getByLabel('备注').fill('用于 E2E 演示的车辆档案-已编辑')
  await dialog.getByRole('button', { name: '保存修改' }).click()

  await expect(page.getByText('车辆更新成功')).toBeVisible()
  await expect(page.getByRole('cell', { name: updatedPlateNumber })).toBeVisible()
}

// 删除编辑后的车辆记录。
async function deleteVehicle(page: Parameters<typeof test>[0]['page']) {
  const row = page
    .locator('tr', { has: page.getByRole('cell', { name: updatedPlateNumber }) })
    .first()
  await row.getByRole('button', { name: '删除' }).click()
  await expect(page.getByRole('dialog', { name: '删除车辆' })).toBeVisible()
  await page.getByRole('button', { name: '确认删除' }).click()

  await expect(page.getByText('车辆删除成功')).toBeVisible()
  await expect(page.getByRole('cell', { name: updatedPlateNumber })).toHaveCount(0)
}

// 校验操作日志页存在新增、编辑、删除三条留痕。
async function verifyAuditLogs(page: Parameters<typeof test>[0]['page']) {
  await page.goto('/audit-log-management')
  await expect(page.getByRole('heading', { name: '操作日志' }).nth(1)).toBeVisible()

  await page.getByLabel('业务对象').fill(uniquePlateNumber)
  await page.getByRole('button', { name: '查询' }).click()

  await expect(page.getByRole('cell', { name: '新增' }).first()).toBeVisible()
  await expect(page.getByRole('cell', { name: '编辑' }).first()).toBeVisible()
  await expect(page.getByRole('cell', { name: '删除' }).first()).toBeVisible()

  const detailRow = page.locator('tr', { has: page.getByRole('cell', { name: '删除' }) }).first()
  await detailRow.getByRole('button', { name: '查看详情' }).click()
  const detailDialog = page.getByRole('dialog', { name: '日志详情' })
  await expect(detailDialog).toBeVisible()
  await expect(detailDialog.getByText('请求追踪号')).toBeVisible()
  await expect(detailDialog.getByText(updatedPlateNumber, { exact: true })).toBeVisible()
}

test.describe('车辆管理审计日志回归', () => {
  test('管理员可以完成车辆 CRUD，并在操作日志页看到完整留痕', async ({ page }) => {
    // 登录管理员账号，进入受保护页面。
    await loginAsAdmin(page)

    // 完成车辆新增、编辑、删除操作。
    await openVehicleManagement(page)
    await createVehicle(page)
    await updateVehicle(page)
    await deleteVehicle(page)

    // 进入操作日志页校验三类行为都被记录。
    await verifyAuditLogs(page)
    await expect(page.getByRole('heading', { name: '操作日志' }).nth(1)).toBeVisible()
  })
})
