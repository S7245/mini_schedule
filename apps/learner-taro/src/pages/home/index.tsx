import Taro from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { useQuery } from '@tanstack/react-query'
import { getMyProfile } from '@mini-schedule/core/app'
import { api, authStore } from '../../lib/api'
import './index.css'

export default function HomePage() {
  const profileQuery = useQuery({
    queryKey: ['app-profile'],
    queryFn: () => getMyProfile(api),
    retry: false,
  })

  async function logout() {
    await authStore.setAccessToken(null)
    Taro.redirectTo({ url: '/pages/login/index' })
  }

  if (profileQuery.isLoading) {
    return (
      <View className="page">
        <Text>加载中…</Text>
      </View>
    )
  }
  if (profileQuery.isError) {
    return (
      <View className="page">
        <Text>未登录或会话已过期</Text>
        <Button className="btn" onClick={() => Taro.redirectTo({ url: '/pages/login/index' })}>
          去登录
        </Button>
      </View>
    )
  }
  const p = profileQuery.data
  return (
    <View className="page">
      <Text className="title">你好，{p?.nickname || '学员'}</Text>
      <Text>VIP 等级：{p?.vip_level ?? '-'}</Text>
      <Button className="btn" onClick={logout}>
        退出登录
      </Button>
    </View>
  )
}
