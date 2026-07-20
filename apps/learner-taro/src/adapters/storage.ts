import Taro from '@tarojs/taro'
import type { KeyValueStorage } from '@mini-schedule/core/ports'

export class TaroStorage implements KeyValueStorage {
  async get(key: string): Promise<string | null> {
    try {
      const res = await Taro.getStorage<string>({ key })
      return typeof res.data === 'string' ? res.data : null
    } catch {
      return null // key 不存在时 Taro reject
    }
  }
  async set(key: string, value: string): Promise<void> {
    await Taro.setStorage({ key, data: value })
  }
  async remove(key: string): Promise<void> {
    try {
      await Taro.removeStorage({ key })
    } catch {
      /* key 不存在视为已删除 */
    }
  }
}
