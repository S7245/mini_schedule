/**
 * Batch 9 回归 — 门店删除引用保护 LOCATION_IN_USE（真实栈端到端）
 *
 * 运行前置：
 *   1. 后端 :8081 在跑（已 migrate）
 *   2. brand 前端 :3002 在跑
 *   3. owner 测试账号见 OWNER（brand 21）
 *
 * 运行：cd web && pnpm exec playwright test e2e/batch-09-location-delete-guard.spec.ts
 *
 * 思路：UI 登录拿 token → 用 page.request 直接调后端建「门店 + 派该门店的员工」做 setup
 * （比纯 UI 多步派员工快且稳）→ UI 上删门店断言被 LOCATION_IN_USE 拦 → 移除任职后再删成功。
 * afterAll 清理员工 + 门店。
 */
import { test, expect, Page, APIRequestContext } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'
const OWNER = { phone: '18816820405', password: 'admin123' }

const RUN = String(Date.now()).slice(-7)
const LOC_NAME = `e2e-locguard-${RUN}`
const STAFF_NAME = `e2e-staff-${RUN}`
const STAFF_PHONE = `139${RUN}0` // 11 位：139 + 7位 + 1位

let token = ''
let locationId = 0
let staffId = 0

async function loginAndGetToken(page: Page): Promise<string> {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('#phone', OWNER.phone)
  await page.fill('#password', OWNER.password)
  await page.click('button:has-text("登录")')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })
  const t = await page.evaluate(() => {
    const raw = localStorage.getItem('auth-storage')
    return raw ? (JSON.parse(raw).state?.accessToken ?? null) : null
  })
  if (!t) throw new Error('登录后未拿到 accessToken')
  return t
}

function authHeaders() {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function apiData<T = unknown>(req: APIRequestContext, method: 'post' | 'put' | 'delete', path: string, data?: unknown): Promise<T> {
  const res = await req[method](`${BASE_URL}${path}`, { headers: authHeaders(), data })
  if (!res.ok() && res.status() !== 204) {
    throw new Error(`${method.toUpperCase()} ${path} → ${res.status()} ${await res.text()}`)
  }
  if (res.status() === 204) return undefined as T
  const body = await res.json()
  return (body.data ?? body) as T
}

function rowByName(page: Page, name: string) {
  return page.locator(`[data-testid="location-row"][data-name="${name}"]`)
}

async function gotoLocations(page: Page) {
  await page.goto(`${BASE_URL}/locations`)
  await expect(page.getByTestId('locations-table')).toBeVisible({ timeout: 15000 })
}

test.describe.serial('Batch 9 — 门店删除引用保护', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    token = await loginAndGetToken(page)

    // setup：建门店
    const loc = await apiData<{ id: number }>(page.request, 'post', '/api/v1/brand/locations', {
      name: LOC_NAME,
      address: '引用保护测试地址',
    })
    locationId = loc.id

    // setup：建一个直接任职该门店的员工
    const staff = await apiData<{ id: number }>(page.request, 'post', '/api/v1/brand/staff', {
      phone: STAFF_PHONE,
      name: STAFF_NAME,
      initial_password: 'test1234',
      location_assignments: [
        { location_id: locationId, assignment_type: 'member', is_primary: true },
      ],
    })
    staffId = staff.id
  })

  test.afterAll(async () => {
    // 清理：先删员工（解除任职），再删门店
    try {
      if (staffId) await apiData(page.request, 'delete', `/api/v1/brand/staff/${staffId}`)
    } catch { /* 尽力清理 */ }
    try {
      if (locationId) await apiData(page.request, 'delete', `/api/v1/brand/locations/${locationId}`)
    } catch { /* 可能已在 G2 删除 */ }
    await page.context().close()
  })

  test('G1 删有员工任职的门店 → 被 LOCATION_IN_USE 拦，弹窗保持打开、门店仍在', async () => {
    await gotoLocations(page)
    const row = rowByName(page, LOC_NAME)
    await expect(row).toBeVisible({ timeout: 15000 })

    await row.locator('[data-testid^="location-delete-"]').click()
    // 删除确认弹窗的确认按钮文案是「删除」，scope 到 dialog 避免与行内按钮歧义
    await page.getByRole('dialog').getByRole('button', { name: '删除', exact: true }).click()

    // 断言 LOCATION_IN_USE toast
    await expect(
      page.getByText('该门店仍有员工任职或角色绑定，请先移除后再删除'),
    ).toBeVisible({ timeout: 10000 })
    // 弹窗保持打开（标题仍在）+ 门店行仍在
    await expect(page.getByText('删除该门店？')).toBeVisible()
    await expect(rowByName(page, LOC_NAME)).toHaveCount(1)
  })

  test('G2 移除员工门店任职后 → 再删门店成功', async () => {
    // 通过 API 清空该员工的门店任职
    await apiData(page.request, 'put', `/api/v1/brand/staff/${staffId}/location-assignments`, {
      assignments: [],
    })

    await gotoLocations(page)
    const row = rowByName(page, LOC_NAME)
    await expect(row).toBeVisible({ timeout: 15000 })
    await row.locator('[data-testid^="location-delete-"]').click()
    await page.getByRole('dialog').getByRole('button', { name: '删除', exact: true }).click()

    await expect(rowByName(page, LOC_NAME)).toHaveCount(0, { timeout: 15000 })
    locationId = 0 // 已删，afterAll 不必再删
  })
})
