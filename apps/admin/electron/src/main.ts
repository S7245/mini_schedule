import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import http from 'http'

const isDev = !app.isPackaged
const PORT = 3001
const SERVER_URL = `http://127.0.0.1:${PORT}`

let mainWindow: BrowserWindow | null = null
let serverProcess: ChildProcess | null = null

// Poll until the Next.js server responds (or timeout)
function waitForServer(timeout = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout
    const attempt = () => {
      const req = http.get(SERVER_URL, (res) => {
        // Any HTTP response means the server is up
        res.destroy()
        resolve()
      })
      req.on('error', () => {
        if (Date.now() >= deadline) {
          reject(new Error(`Next.js server did not start within ${timeout}ms`))
        } else {
          setTimeout(attempt, 500)
        }
      })
      req.setTimeout(1000, () => req.destroy())
    }
    attempt()
  })
}

function startProductionServer(): Promise<void> {
  // next build --standalone outputs server.js here
  const serverScript = path.join(process.resourcesPath, 'server', 'server.js')

  serverProcess = spawn(process.execPath, [serverScript], {
    env: {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    },
    stdio: 'pipe',
  })

  serverProcess.stdout?.on('data', (d) => process.stdout.write(`[next] ${d}`))
  serverProcess.stderr?.on('data', (d) => process.stderr.write(`[next] ${d}`))
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[next] server exited with code ${code}`)
    }
  })

  return waitForServer()
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    // macOS traffic lights inset
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 16 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Allow Next.js inline scripts (CSP relaxation only in Electron context)
      webSecurity: !isDev,
    },
  })

  mainWindow.loadURL(SERVER_URL)

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  // Only show window once page has loaded (avoids white flash)
  mainWindow.once('ready-to-show', () => mainWindow?.show())

  // Open external links in the default browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── IPC: System notifications ────────────────────────────────────────────────

interface NotificationOptions {
  title: string
  body: string
  silent?: boolean
  urgency?: 'normal' | 'critical' | 'low'
}

ipcMain.handle('notification:show', (_event, opts: NotificationOptions) => {
  if (!Notification.isSupported()) return false

  const n = new Notification({
    title: opts.title,
    body: opts.body,
    silent: opts.silent ?? false,
    // urgency is a Linux-only option; ignored on macOS/Windows
    urgency: opts.urgency ?? 'normal',
  })

  // Clicking the notification focuses the app window
  n.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  n.show()
  return true
})

// ── IPC: Platform info ───────────────────────────────────────────────────────

ipcMain.handle('app:platform', () => process.platform)
ipcMain.handle('app:version', () => app.getVersion())

// ── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  try {
    if (isDev) {
      // Dev: assume `pnpm dev` already started the Next.js server
      await waitForServer()
    } else {
      await startProductionServer()
    }
    createWindow()
  } catch (err) {
    console.error('[electron] Failed to start:', err)
    app.quit()
  }

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // On macOS apps conventionally stay active until Cmd+Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  serverProcess?.kill()
  serverProcess = null
})
