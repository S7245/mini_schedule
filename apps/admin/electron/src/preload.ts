import { contextBridge, ipcRenderer } from 'electron'

/**
 * Secure bridge between renderer (Next.js page) and main process.
 * Only explicitly listed methods are exposed — renderer cannot access Node APIs directly.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /** Show a native OS notification */
  showNotification: (opts: {
    title: string
    body: string
    silent?: boolean
    urgency?: 'normal' | 'critical' | 'low'
  }) => ipcRenderer.invoke('notification:show', opts),

  /** Current OS platform: 'darwin' | 'win32' | 'linux' */
  getPlatform: () => ipcRenderer.invoke('app:platform'),

  /** App version from package.json */
  getVersion: () => ipcRenderer.invoke('app:version'),
})
