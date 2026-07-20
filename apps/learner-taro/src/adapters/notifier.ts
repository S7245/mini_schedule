import Taro from '@tarojs/taro'
import type { Notifier } from '@mini-schedule/core/ports'

export const taroNotifier: Notifier = {
  showToast(message, kind = 'info') {
    Taro.showToast({ title: message, icon: kind === 'success' ? 'success' : 'none', duration: 2000 })
  },
}
