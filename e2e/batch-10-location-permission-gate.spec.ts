/**
 * Batch 10 回归 — /locations 只读权限门（真实栈）
 *
 * 运行前置：后端 :8081 + brand 前端 :3002 在跑；只读账号见 READONLY。
 * 运行：cd web && pnpm exec playwright test e2e/batch-10-location-permission-gate.spec.ts
 *
 * 断言：仅持 location.view 的账号能看见「门店管理」入口与列表，但所有写操作
 * （新建 / 编辑 / 删除）按钮都 disabled（permission gate 生效）。
 *
 * 账号说明：READONLY = 13900139777（brand 21，custom「前台兼职」= staff.view +
 * location.view，无 location.create/edit/delete）。注意：location_manager
 * 13900139001 有 location.edit，「编辑」会是 enabled —— 只读账号才是干净的全写禁用断言。
 */
import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'
const READONLY = { phone: '13900139777', password: 'admin123' }

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('#phone', READONLY.phone)
  await page.fill('#password', READONLY.password)
  await page.click('button:has-text("登录")')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })
}

test.describe('Batch 10 — /locations 只读权限门', () => {
  test('只读账号：可见列表，但新建/编辑/删除按钮全 disabled', async ({ page }) => {
    await login(page)

    // 有 location.view → 导航入口可见
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.locator('a[href="/locations"]')).toBeVisible({ timeout: 15000 })

    await page.goto(`${BASE_URL}/locations`)
    await expect(page.getByTestId('locations-table')).toBeVisible({ timeout: 15000 })

    // 核心断言（不依赖数据）：新建门店按钮 disabled
    await expect(page.getByTestId('location-create-button')).toBeDisabled()

    // 行级断言（仅当该账号 data_scope 下有可见门店时）：编辑/删除 disabled
    const rows = page.locator('[data-testid="location-row"]')
    if ((await rows.count()) > 0) {
      const first = rows.first()
      await expect(first.locator('[data-testid^="location-edit-"]')).toBeDisabled()
      await expect(first.locator('[data-testid^="location-delete-"]')).toBeDisabled()
    }
  })
})
