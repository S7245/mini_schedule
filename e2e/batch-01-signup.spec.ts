import { test, expect, Page } from '@playwright/test'

const SMS_CODE = '123456'
const BASE_URL = 'http://localhost:3002'

// RUN_ID: 7位时间戳后缀，suffix 只用 0-9（单字符），保证 phone 始终 11 位
// phone = '138' + 7位 + 1位 = 11位，满足 ^1[3-9]\d{9}$
const RUN_ID = String(Date.now()).slice(-7)
const phone = (n: 0|1|2|3|4|5|6|7|8|9) => `138${RUN_ID}${n}`

// 在每个测试前 mock SMS 发送接口，避免 IP 限流影响结果
async function mockSMS(page: Page) {
  await page.route('**/api/v1/public/signup/sms-code', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ code: 'OK', message: 'success', data: null }) })
  )
}

async function clearSession(page: Page) {
  await page.goto(`${BASE_URL}/signup`)
  await page.evaluate(() => sessionStorage.clear())
}

async function fillSignupForm(page: Page, opts: {
  phone: string
  password?: string
  brandName?: string
  contactName?: string
}) {
  await page.fill('input[id="phone"]', opts.phone)
  await page.click('button:has-text("发送验证码")')
  await page.fill('input[id="smsCode"]', SMS_CODE)
  if (opts.password !== undefined) await page.fill('input[id="password"]', opts.password)
  if (opts.brandName !== undefined) await page.fill('input[id="brandName"]', opts.brandName)
  if (opts.contactName !== undefined) await page.fill('input[id="contactName"]', opts.contactName)
}

// ────────────────────────────────────────────────────────────
// Happy Path
// ────────────────────────────────────────────────────────────

test.describe('Happy Path — 完整注册流程', () => {
  test('H1 访问 /signup 显示注册表单和步骤条', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`)
    await expect(page.locator('text=Mini Schedule')).toBeVisible()
    await expect(page.locator('text=注册信息').first()).toBeVisible()
    await expect(page.locator('span').filter({ hasText: /^选择套餐$/ })).toBeVisible()
    await expect(page.locator('text=扫码支付').first()).toBeVisible()
    await expect(page.locator('text=创建品牌账号')).toBeVisible()
  })

  test('H2 点击发送验证码进入倒计时', async ({ page }) => {
    await mockSMS(page)
    await page.goto(`${BASE_URL}/signup`)
    await page.fill('input[id="phone"]', phone(2))
    await page.click('button:has-text("发送验证码")')
    // mock 返回成功，按钮应进入倒计时
    await expect(page.locator('button:has-text("s 后重发")')).toBeVisible({ timeout: 3000 })
  })

  test('H3-H4 填写合法信息，点"下一步"跳转套餐页', async ({ page }) => {
    await mockSMS(page)
    await clearSession(page)
    await fillSignupForm(page, { phone: phone(3), password: 'test1234', brandName: '测试品牌', contactName: '张三' })
    await page.click('button:has-text("下一步")')
    await expect(page).toHaveURL(/\/signup\/plan/, { timeout: 8000 })
    await expect(page.locator('h2, div').filter({ hasText: /^选择套餐$/ }).first()).toBeVisible()
  })

  test('H5 套餐页加载出套餐列表', async ({ page }) => {
    await mockSMS(page)
    await clearSession(page)
    await fillSignupForm(page, { phone: phone(4), password: 'test1234', brandName: '测试品牌', contactName: '张三' })
    await page.click('button:has-text("下一步")')
    await page.waitForURL(/\/signup\/plan/, { timeout: 8000 })
    await expect(page.locator('[class*="cursor-pointer"]').first()).toBeVisible({ timeout: 6000 })
  })

  test('H6 选择套餐后显示已选摘要', async ({ page }) => {
    await mockSMS(page)
    await clearSession(page)
    await fillSignupForm(page, { phone: phone(5), password: 'test1234', brandName: '测试品牌', contactName: '张三' })
    await page.click('button:has-text("下一步")')
    await page.waitForURL(/\/signup\/plan/, { timeout: 8000 })
    await page.locator('[class*="cursor-pointer"]').first().click()
    await expect(page.locator('text=已选：')).toBeVisible()
  })

  test('H7-H8 点"立即支付"跳转支付页并显示扫码支付', async ({ page }) => {
    await mockSMS(page)
    await clearSession(page)
    await fillSignupForm(page, { phone: phone(6), password: 'test1234', brandName: '测试品牌', contactName: '张三' })
    await page.click('button:has-text("下一步")')
    await page.waitForURL(/\/signup\/plan/, { timeout: 8000 })
    await page.locator('[class*="cursor-pointer"]').first().click()
    await page.click('button:has-text("立即支付")')
    await expect(page).toHaveURL(/\/signup\/payment\/\d+/, { timeout: 10000 })
    await expect(page.locator('text=扫码支付').first()).toBeVisible()
  })
})

// ────────────────────────────────────────────────────────────
// Edge Cases — 注册信息页
// ────────────────────────────────────────────────────────────

test.describe('Edge Cases — 注册信息页表单校验', () => {
  test('E1 密码少于 8 位显示错误', async ({ page }) => {
    await mockSMS(page)
    await page.goto(`${BASE_URL}/signup`)
    await fillSignupForm(page, { phone: phone(1), password: 'abc123', brandName: '测试品牌', contactName: '张三' })
    await page.click('button:has-text("下一步")')
    await expect(page.locator('text=密码至少 8 位')).toBeVisible()
  })

  test('E2 密码无数字显示错误', async ({ page }) => {
    await mockSMS(page)
    await page.goto(`${BASE_URL}/signup`)
    await fillSignupForm(page, { phone: phone(1), password: 'abcdefgh', brandName: '测试品牌', contactName: '张三' })
    await page.click('button:has-text("下一步")')
    await expect(page.locator('text=密码必须包含数字')).toBeVisible()
  })

  test('E3 密码无字母显示错误', async ({ page }) => {
    await mockSMS(page)
    await page.goto(`${BASE_URL}/signup`)
    await fillSignupForm(page, { phone: phone(1), password: '12345678', brandName: '测试品牌', contactName: '张三' })
    await page.click('button:has-text("下一步")')
    await expect(page.locator('text=密码必须包含字母')).toBeVisible()
  })

  test('E4 手机号格式错误显示错误', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`)
    await page.fill('input[id="phone"]', '12345')
    await page.fill('input[id="smsCode"]', SMS_CODE)
    await page.fill('input[id="password"]', 'test1234')
    await page.fill('input[id="brandName"]', '测试品牌')
    await page.fill('input[id="contactName"]', '张三')
    await page.click('button:has-text("下一步")')
    await expect(page.locator('text=请输入正确的手机号格式')).toBeVisible()
  })

  test('E6 验证码错误时 pre-validate 返回内联错误', async ({ page }) => {
    await mockSMS(page)
    await page.goto(`${BASE_URL}/signup`)
    await page.fill('input[id="phone"]', phone(7))
    await page.click('button:has-text("发送验证码")')
    await page.fill('input[id="smsCode"]', '000000') // 错误验证码
    await page.fill('input[id="password"]', 'test1234')
    await page.fill('input[id="brandName"]', '测试品牌')
    await page.fill('input[id="contactName"]', '张三')
    await page.click('button:has-text("下一步")')
    // 内联错误（data-testid="api-error"）或 toast 中显示"短信验证码错误"
    await expect(page.locator('[data-testid="api-error"]')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('[data-testid="api-error"]')).toContainText('短信验证码错误')
  })

  test('E7 品牌名称为空显示错误', async ({ page }) => {
    await mockSMS(page)
    await page.goto(`${BASE_URL}/signup`)
    await page.fill('input[id="phone"]', phone(1))
    await page.fill('input[id="smsCode"]', SMS_CODE)
    await page.fill('input[id="password"]', 'test1234')
    await page.fill('input[id="contactName"]', '张三')
    await page.click('button:has-text("下一步")')
    await expect(page.locator('text=品牌名称不能为空')).toBeVisible()
  })

  test('E8 联系人为空显示错误', async ({ page }) => {
    await mockSMS(page)
    await page.goto(`${BASE_URL}/signup`)
    await page.fill('input[id="phone"]', phone(1))
    await page.fill('input[id="smsCode"]', SMS_CODE)
    await page.fill('input[id="password"]', 'test1234')
    await page.fill('input[id="brandName"]', '测试品牌')
    await page.click('button:has-text("下一步")')
    await expect(page.locator('text=联系人姓名不能为空')).toBeVisible()
  })
})

// ────────────────────────────────────────────────────────────
// Edge Cases — 套餐页
// ────────────────────────────────────────────────────────────

test.describe('Edge Cases — 套餐页', () => {
  test('E9 未选套餐时"立即支付"按钮 disabled', async ({ page }) => {
    await mockSMS(page)
    await clearSession(page)
    await fillSignupForm(page, { phone: phone(8), password: 'test1234', brandName: '测试品牌', contactName: '张三' })
    await page.click('button:has-text("下一步")')
    await page.waitForURL(/\/signup\/plan/, { timeout: 8000 })
    await expect(page.locator('button:has-text("立即支付")')).toBeDisabled()
  })

  test('E10 无 sessionStorage 直接访问套餐页自动跳回注册页', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`)
    await page.evaluate(() => sessionStorage.clear())
    await page.goto(`${BASE_URL}/signup/plan`)
    await expect(page).toHaveURL(/\/signup$/, { timeout: 5000 })
  })
})

// ────────────────────────────────────────────────────────────
// Edge Cases — 支付页
// ────────────────────────────────────────────────────────────

test.describe('Edge Cases — 支付页', () => {
  test('E11 无效 order_id 返回 not found，显示获取二维码失败', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup/payment/999999`)
    await expect(page.locator('text=获取二维码失败')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("重新获取二维码")')).toBeVisible()
  })

  test('E12 点"重新获取二维码"重新调用 payment API', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup/payment/999999`)
    await page.waitForSelector('text=获取二维码失败', { timeout: 10000 })
    let apiCalled = false
    page.on('request', req => {
      if (req.url().includes('/payment/native')) apiCalled = true
    })
    await page.click('button:has-text("重新获取二维码")')
    await page.waitForTimeout(1500)
    expect(apiCalled).toBe(true)
  })
})
