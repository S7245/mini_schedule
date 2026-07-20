import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Input, Button, Text } from '@tarojs/components'
import { wechatLogin } from '@mini-schedule/core/app'
import { isCoreApiError } from '@mini-schedule/core/errors'
import { api, authStore, storage, REFRESH_TOKEN_KEY, DEFAULT_BRAND_ID } from '../../lib/api'
import { taroNotifier } from '../../adapters/notifier'
import './index.css'

export default function LoginPage() {
  const [brandId, setBrandId] = useState(String(DEFAULT_BRAND_ID))
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function fetchWeappCode() {
    try {
      const res = await Taro.login()
      if (res.code) setCode(res.code)
      else taroNotifier.showToast('未取到 code，可手动输入', 'error')
    } catch {
      taroNotifier.showToast('获取微信 code 失败，可手动输入', 'error')
    }
  }

  async function submit() {
    const bid = Number(brandId)
    if (!bid || !code.trim()) {
      taroNotifier.showToast('请填写品牌 ID 和登录码', 'error')
      return
    }
    setSubmitting(true)
    try {
      const result = await wechatLogin(api, { brandId: bid, code: code.trim() })
      await authStore.setAccessToken(result.access_token)
      await storage.set(REFRESH_TOKEN_KEY, result.refresh_token)
      Taro.redirectTo({ url: '/pages/home/index' })
    } catch (e) {
      taroNotifier.showToast(isCoreApiError(e) ? e.message : '登录失败', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="page">
      <Text className="title">学员登录</Text>
      <Input
        className="input"
        type="number"
        value={brandId}
        placeholder="品牌 ID"
        onInput={(e) => setBrandId(e.detail.value)}
      />
      <Input
        className="input"
        value={code}
        placeholder="登录码（开发期任意字符串）"
        onInput={(e) => setCode(e.detail.value)}
      />
      {process.env.TARO_ENV === 'weapp' && (
        <Button className="btn" onClick={fetchWeappCode}>
          微信获取 code
        </Button>
      )}
      <Button className="btn btn-primary" loading={submitting} onClick={submit}>
        登录
      </Button>
    </View>
  )
}
