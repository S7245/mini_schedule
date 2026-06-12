/**
 * Batch 8 回归 — 品牌门店管理页 /locations（真实栈端到端）
 *
 * 运行前置（缺一不可）：
 *   1. 后端在跑：cd backend && go run ./cmd/api-brand   (默认 :8081，且已 migrate)
 *   2. brand 前端在跑：cd web && pnpm --filter @mini-schedule/brand dev   (:3002)
 *   3. DB 可用，且存在 owner 测试账号（见下 OWNER）
 *
 * 运行：
 *   cd web && pnpm exec playwright test e2e/batch-08-locations.spec.ts
 *
 * 说明：
 *   - 真登录 + 真 CRUD 调后端 + 真 DB。会创建以 RUN_PREFIX 开头的门店，afterAll 全部软删清理。
 *   - 门店软删不计入订阅额度（后端 quota guard 排除 soft-delete），清理后不占额度。
 *   - 串行共享一个 page（describe.serial）：H2 建的门店 H3/H4/H5 接着用。
 */
import { test, expect, Page, BrowserContext } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'

// 真实 owner 账号（brand 21，is_owner=true，brand_owner）。如环境不同请改这里。
const OWNER = { phone: '18816820405', password: 'admin123' }

// 本次运行的唯一门店名前缀，保证不与历史数据/并发撞名，且 afterAll 可按前缀清理。
const RUN_PREFIX = `e2e-loc-${String(Date.now()).slice(-9)}`
const LOC_A = `${RUN_PREFIX}-A`
const LOC_A_EDITED_PHONE = '13900001234'

async function loginAsOwner(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('#phone', OWNER.phone)
  await page.fill('#password', OWNER.password)
  await page.click('button:has-text("登录")')
  // 登录成功后会跳离 /login（到 /dashboard 或 onboarding）
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })
}

function rowByName(page: Page, name: string) {
  return page.locator(`[data-testid="location-row"][data-name="${name}"]`)
}

async function gotoLocations(page: Page) {
  await page.goto(`${BASE_URL}/locations`)
  await expect(page.getByTestId('locations-table')).toBeVisible({ timeout: 15000 })
}

// 软删一个门店（按名定位行 → 删除按钮 → 确认弹窗）。
// 注意：删除确认弹窗的确认按钮文案是「删除」，与行内「删除」按钮同名，
// 故确认点击必须 scope 到弹窗（getByRole('dialog')）。
async function deleteLocationByName(page: Page, name: string) {
  const row = rowByName(page, name)
  if ((await row.count()) === 0) return
  await row.locator('[data-testid^="location-delete-"]').click()
  await page.getByRole('dialog').getByRole('button', { name: '删除', exact: true }).click()
  await expect(rowByName(page, name)).toHaveCount(0, { timeout: 15000 })
}

test.describe.serial('Batch 8 — 门店管理页 /locations', () => {
  let context: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    await loginAsOwner(page)
  })

  test.afterAll(async () => {
    // 清理本次创建的所有门店（按前缀），即使某用例中途失败也尽量清干净。
    try {
      await gotoLocations(page)
      // 切到「全部」确保 inactive 的也能看到删除入口
      const rows = page.locator(`[data-testid="location-row"]`)
      const names: string[] = []
      const n = await rows.count()
      for (let i = 0; i < n; i++) {
        const nm = await rows.nth(i).getAttribute('data-name')
        if (nm && nm.startsWith(RUN_PREFIX)) names.push(nm)
      }
      for (const nm of names) await deleteLocationByName(page, nm)
    } catch {
      // 清理尽力而为，不让 teardown 失败掩盖用例结果
    }
    await context.close()
  })

  test('H1 owner 登录后工作台见「门店管理」入口并能进列表', async () => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.locator('a[href="/locations"]')).toBeVisible({ timeout: 15000 })
    await page.click('a[href="/locations"]')
    await expect(page).toHaveURL(/\/locations/)
    await expect(page.getByTestId('locations-table')).toBeVisible()
  })

  test('H2 新建门店 → 列表出现该行且状态为启用', async () => {
    await gotoLocations(page)
    await page.getByTestId('location-create-button').click()
    await expect(page.getByTestId('location-form')).toBeVisible()
    await page.fill('#name', LOC_A)
    await page.fill('#address', '测试地址 1 号')
    await page.fill('#phone', '13800001111')
    await page.click('button:has-text("创建")')
    const row = rowByName(page, LOC_A)
    await expect(row).toBeVisible({ timeout: 15000 })
    await expect(row.getByTestId('location-status-badge')).toHaveText('启用')
  })

  test('H3 编辑门店电话 → 列表反映更新', async () => {
    await gotoLocations(page)
    const row = rowByName(page, LOC_A)
    await row.locator('[data-testid^="location-edit-"]').click()
    await expect(page.getByTestId('location-form')).toBeVisible()
    await page.fill('#phone', LOC_A_EDITED_PHONE)
    await page.click('button:has-text("保存")')
    await expect(rowByName(page, LOC_A)).toContainText(LOC_A_EDITED_PHONE, { timeout: 15000 })
  })

  test('H4 停用 → 状态 badge 变为停用（经确认弹窗）', async () => {
    await gotoLocations(page)
    const row = rowByName(page, LOC_A)
    // 触发按钮文案为「停用」（actionLabel），确认弹窗的确认按钮同样是「停用」，
    // 故确认点击 scope 到弹窗，避免与触发按钮歧义。
    await row.locator('[data-testid^="location-status-toggle-"]').click()
    await page.getByRole('dialog').getByRole('button', { name: '停用', exact: true }).click()
    await expect(rowByName(page, LOC_A).getByTestId('location-status-badge')).toHaveText('停用', {
      timeout: 15000,
    })
  })

  test('H5 软删门店 → 行从列表消失', async () => {
    await gotoLocations(page)
    await deleteLocationByName(page, LOC_A)
    await expect(rowByName(page, LOC_A)).toHaveCount(0)
  })

  test('E1 重名新建 → 表单内报「门店名称已存在」', async () => {
    // 先建一个占位门店，再用同名建第二个，触发 LOCATION_NAME_DUPLICATED。
    const dupName = `${RUN_PREFIX}-DUP`
    await gotoLocations(page)
    await page.getByTestId('location-create-button').click()
    await page.fill('#name', dupName)
    await page.click('button:has-text("创建")')
    await expect(rowByName(page, dupName)).toBeVisible({ timeout: 15000 })

    // 第二次同名
    await page.getByTestId('location-create-button').click()
    await page.fill('#name', dupName)
    await page.click('button:has-text("创建")')
    const apiError = page.getByTestId('api-error')
    await expect(apiError).toBeVisible({ timeout: 15000 })
    await expect(apiError).toContainText('已存在')
    // 表单仍打开（未误关）
    await expect(page.getByTestId('location-form')).toBeVisible()
    // 关闭弹窗，留给 afterAll 清理 dupName
    await page.keyboard.press('Escape')
  })
})
