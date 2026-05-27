/**
 * electron-builder configuration
 * Docs: https://www.electron.build/configuration/configuration
 *
 * Build flow:
 *   1. next build          → .next/standalone/ + .next/static/
 *   2. tsc -p tsconfig.electron.json  → electron/dist/
 *   3. electron-builder    → dist-electron/
 */

/** @type {import('electron-builder').Configuration} */
const config = {
  appId: 'com.minischedule.admin',
  productName: 'Mini Schedule Admin',

  directories: {
    output: 'dist-electron',
    buildResources: 'electron/assets',
  },

  // Files included inside the Electron asar bundle
  files: [
    'electron/dist/**/*',
    'package.json',
  ],

  // Files copied outside the asar (large Node.js server files don't compress well)
  extraResources: [
    {
      // Next.js standalone server (node server.js)
      from: '.next/standalone',
      to: 'server',
      filter: ['**/*'],
    },
    {
      // Static assets served by the standalone server
      from: '.next/static',
      to: 'server/.next/static',
      filter: ['**/*'],
    },
    {
      // Public directory assets (images, fonts, etc.)
      from: 'public',
      to: 'server/public',
      filter: ['**/*'],
    },
  ],

  // ── macOS ──────────────────────────────────────────────────────────────────
  mac: {
    category: 'public.app-category.business',
    icon: 'electron/assets/icon.icns',
    // Build universal binary (Intel + Apple Silicon)
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] },
      { target: 'zip', arch: ['x64', 'arm64'] },
    ],
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'electron/entitlements.mac.plist',
    entitlementsInherit: 'electron/entitlements.mac.plist',
    // Set to true and configure APPLE_ID env vars to notarize
    notarize: false,
  },

  dmg: {
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: 'link', path: '/Applications' },
    ],
    window: { width: 540, height: 380 },
  },

  // ── Windows ────────────────────────────────────────────────────────────────
  win: {
    icon: 'electron/assets/icon.ico',
    target: [
      { target: 'nsis', arch: ['x64', 'ia32'] },
      { target: 'msi', arch: ['x64'] },
    ],
    // requestedExecutionLevel: 'asInvoker' for standard user install
    requestedExecutionLevel: 'asInvoker',
  },

  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Mini Schedule Admin',
  },

  // ── Linux (optional) ───────────────────────────────────────────────────────
  linux: {
    icon: 'electron/assets/icon.png',
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb', arch: ['x64'] },
    ],
    category: 'Office',
  },

  // Publish configuration (GitHub Releases) — configure when ready to ship
  // publish: {
  //   provider: 'github',
  //   owner: 's7245',
  //   repo: 'mini_schedule',
  // },
}

module.exports = config
