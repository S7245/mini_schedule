/**
 * Batch 11 回归 — 课程模板 + 单场次排课（真实栈端到端）
 *
 * 运行前置：
 *   1. 后端 :8081 在跑（已 migrate 到 000007；务必用重建后的二进制——旧二进制掩盖改动）
 *   2. brand 前端 :3002 在跑
 *   3. owner 测试账号见 OWNER（brand 21）；只读账号见 READONLY（13900139777）
 *   4. brand 21 需有 1 个 active 门店 + 1 个 active 可排课教练（张三）——验收环境已具备
 *
 * 运行：cd web && pnpm exec playwright test e2e/batch-11-course-session.spec.ts
 *
 * 覆盖：H1 建分类 / H3 建课程 / H4 发布 / H5 排课 / E7 教练时段冲突 /
 *      onboarding 第 4·5·7 步 completed / E11 只读权限门。
 * 名称带 RUN 时间戳避免重复；afterAll 用 API 取消场次 + 删课程 + 停用分类清理。
 */
import { test, expect, Page, APIRequestContext } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'
const OWNER = { phone: '18816820405', password: 'admin123' }
const READONLY = { phone: '13900139777', password: 'admin123' }

const RUN = String(Date.now()).slice(-7)
const CAT_NAME = `e2e-cat-${RUN}`
const COURSE_NAME = `e2e-course-${RUN}`

// 唯一时段：把开始小时按 RUN 打散，降低与历史遗留场次的 EXCLUDE 冲突概率。
const HOUR = 6 + (Number(RUN) % 12)
function tomorrowDate(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const DATE = tomorrowDate()
const TIME = `${String(HOUR).padStart(2, '0')}:00`

let token = ''

async function login(page: Page, acct: { phone: string; password: string }) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('#phone', acct.phone)
  await page.fill('#password', acct.password)
  await page.click('button:has-text("登录")')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })
}

async function readToken(page: Page): Promise<string> {
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

async function apiGet<T = any>(req: APIRequestContext, path: string): Promise<T> {
  const res = await req.get(`${BASE_URL}${path}`, { headers: authHeaders() })
  const body = await res.json()
  return (body.data ?? body) as T
}

async function apiCall(req: APIRequestContext, method: 'post' | 'patch' | 'delete', path: string, data?: unknown) {
  const res = await req[method](`${BASE_URL}${path}`, { headers: authHeaders(), data })
  return res
}

test.describe.serial('Batch 11 — 课程模板 + 单场次排课', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await login(page, OWNER)
    token = await readToken(page)
  })

  test.afterAll(async () => {
    // 清理：取消该课程下场次 → 删课程 → 停用分类（分类无 DELETE 接口）。
    try {
      const courses = await apiGet<{ items: { id: number; title: string }[] }>(
        page.request,
        `/api/v1/brand/courses?q=${COURSE_NAME}&page_size=50`,
      )
      for (const c of courses.items ?? []) {
        const sessions = await apiGet<{ items: { id: number; status: string }[] }>(
          page.request,
          `/api/v1/brand/class-sessions?course_id=${c.id}&page_size=100`,
        )
        for (const s of sessions.items ?? []) {
          if (s.status === 'scheduled' || s.status === 'in_progress') {
            await apiCall(page.request, 'patch', `/api/v1/brand/class-sessions/${s.id}/cancel`, {
              cancel_reason: 'e2e teardown',
            })
          }
        }
        await apiCall(page.request, 'delete', `/api/v1/brand/courses/${c.id}`)
      }
      const cats = await apiGet<{ items: { id: number; name: string }[] }>(
        page.request,
        `/api/v1/brand/course-categories`,
      )
      for (const cat of cats.items ?? []) {
        if (cat.name === CAT_NAME) {
          await apiCall(page.request, 'patch', `/api/v1/brand/course-categories/${cat.id}`, {
            status: 'inactive',
          })
        }
      }
    } catch {
      /* 尽力清理 */
    }
    await page.context().close()
  })

  test('H1 新建课程分类', async () => {
    await page.goto(`${BASE_URL}/course-categories`)
    await expect(page.getByTestId('categories-table')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('category-create-button').click()
    await page.getByTestId('category-field-name').fill(CAT_NAME)
    await page.getByTestId('category-submit').click()
    await expect(
      page.locator(`[data-testid="category-row"][data-name="${CAT_NAME}"]`),
    ).toBeVisible({ timeout: 15000 })
  })

  test('H3+H4 新建课程模板（绑分类+默认全选门店）并发布', async () => {
    await page.goto(`${BASE_URL}/courses`)
    await expect(page.getByTestId('courses-table')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('course-create-button').click()
    await page.getByTestId('course-field-title').fill(COURSE_NAME)
    // 选中刚建的分类 chip（按文本）
    await page.getByTestId('course-field-categories').getByText(CAT_NAME).click()
    await page.getByTestId('course-submit').click()

    const row = page.locator(`[data-testid="course-row"][data-title="${COURSE_NAME}"]`)
    await expect(row).toBeVisible({ timeout: 15000 })
    await expect(row.getByTestId('course-status-badge')).toHaveText('草稿')

    // 发布
    await row.locator('[data-testid^="course-publish-"]').click()
    await expect(row.getByTestId('course-status-badge')).toHaveText('已发布', { timeout: 15000 })
  })

  test('H5 排出单场次', async () => {
    await page.goto(`${BASE_URL}/schedule`)
    await expect(page.getByTestId('sessions-table')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('session-create-button').click()

    await page.getByTestId('session-field-location').selectOption({ index: 1 })
    await page.getByTestId('session-field-course').selectOption({ label: COURSE_NAME })
    await page.getByTestId('session-field-instructor').selectOption({ index: 1 })
    await page.getByTestId('session-field-date').fill(DATE)
    await page.getByTestId('session-field-time').fill(TIME)
    await page.getByTestId('session-submit').click()

    // 弹窗关闭 + 课程表出现该课程的场次行
    await expect(page.getByTestId('session-form')).toBeHidden({ timeout: 15000 })
    await expect(
      page.locator('[data-testid="session-row"]', { hasText: COURSE_NAME }),
    ).toBeVisible({ timeout: 15000 })
  })

  test('E7 同教练同时段再排 → SESSION_INSTRUCTOR_CONFLICT', async () => {
    await page.goto(`${BASE_URL}/schedule`)
    await expect(page.getByTestId('sessions-table')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('session-create-button').click()

    await page.getByTestId('session-field-location').selectOption({ index: 1 })
    await page.getByTestId('session-field-course').selectOption({ label: COURSE_NAME })
    await page.getByTestId('session-field-instructor').selectOption({ index: 1 })
    await page.getByTestId('session-field-date').fill(DATE)
    await page.getByTestId('session-field-time').fill(TIME)
    await page.getByTestId('session-submit').click()

    // 冲突：inline error 出现，弹窗保持打开
    await expect(page.getByTestId('api-error')).toContainText('该教练在此时段已有排课', {
      timeout: 15000,
    })
    await expect(page.getByTestId('session-form')).toBeVisible()
    // 关闭弹窗收尾
    await page.getByRole('button', { name: '取消' }).click()
  })

  test('onboarding 第 4/5/7 步 completed', async () => {
    const status = await apiGet<{ steps: { step_key: string; status: string }[] }>(
      page.request,
      `/api/v1/brand/onboarding/status`,
    )
    const byKey = Object.fromEntries(status.steps.map((s) => [s.step_key, s.status]))
    expect(byKey['course_category']).toBe('completed')
    expect(byKey['course_template']).toBe('completed')
    expect(byKey['class_session']).toBe('completed')
  })
})

test.describe('Batch 11 — 只读权限门（E11）', () => {
  test('只读账号：/courses 与 /schedule 写按钮 disabled', async ({ page }) => {
    await login(page, READONLY)

    await page.goto(`${BASE_URL}/courses`)
    await expect(page.getByTestId('courses-table')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('course-create-button')).toBeDisabled()

    await page.goto(`${BASE_URL}/schedule`)
    await expect(page.getByTestId('sessions-table')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('session-create-button')).toBeDisabled()
  })
})
