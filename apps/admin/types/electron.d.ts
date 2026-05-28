/* eslint-disable no-unused-vars */
/**
 * Type declarations for the Electron context bridge API.
 * Present only when the app runs inside Electron; undefined in the browser.
 */
export {}

declare global {
  interface Window {
    electronAPI?: {
      showNotification(opts: {
        title: string
        body: string
        silent?: boolean
        urgency?: 'normal' | 'critical' | 'low'
      }): Promise<boolean>
      getPlatform(): Promise<'darwin' | 'win32' | 'linux'>
      getVersion(): Promise<string>
    }
  }
}
