/**
 * Unified notification hook.
 *
 * - Inside Electron: delegates to the native OS notification via IPC.
 * - In the browser: uses the Web Notifications API (requires user permission).
 *
 * Usage:
 *   const notify = useNotification()
 *   notify({ title: 'Done', body: 'Operation completed.' })
 */
export interface NotifyOptions {
  title: string
  body: string
  silent?: boolean
}

export function useNotification() {
  const notify = async (opts: NotifyOptions): Promise<void> => {
    // Electron context
    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.showNotification(opts)
      return
    }

    // Browser context: request permission if not yet granted
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
    }

    if (Notification.permission === 'granted') {
      new Notification(opts.title, { body: opts.body, silent: opts.silent })
    }
  }

  return notify
}
