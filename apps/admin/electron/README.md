# Admin Electron 打包说明

## 架构方案

采用 **Next.js Standalone Server + Electron 主进程启动** 的方案：

```
Electron 主进程 (main.ts)
  └─ 生产环境: 用 child_process.spawn 启动 .next/standalone/server.js
  └─ 开发环境: 等待已运行的 next dev 服务 (port 3001)
  └─ BrowserWindow 加载 http://127.0.0.1:3001
  └─ IPC: 接收渲染进程的通知请求 → 调用 Electron Notification API
```

## 目录结构

```
electron/
├── src/
│   ├── main.ts          # 主进程：启动 Next.js 服务、创建窗口、IPC 处理
│   └── preload.ts       # 预加载脚本：向渲染进程暴露安全的 API
├── assets/
│   ├── icon.icns        # macOS 图标 (需要提供)
│   ├── icon.ico         # Windows 图标 (需要提供)
│   └── icon.png         # Linux 图标 512x512 (需要提供)
├── entitlements.mac.plist  # macOS 沙盒权限声明
└── dist/                # TypeScript 编译输出 (gitignored)
```

## 开发流程

```bash
# 同时启动 Next.js dev 服务和 Electron 窗口
pnpm electron:dev
```

## 生产构建

```bash
# 构建当前平台
pnpm electron:build

# 指定平台构建（需在对应系统上运行，或配置 CI 跨平台构建）
pnpm electron:build:mac    # → dist-electron/*.dmg / *.zip
pnpm electron:build:win    # → dist-electron/*.exe / *.msi
pnpm electron:build:linux  # → dist-electron/*.AppImage / *.deb
```

## 系统通知

在 Next.js 页面/组件中使用：

```typescript
import { useNotification } from '@/hooks/use-notification'

function MyComponent() {
  const notify = useNotification()

  const handleAction = async () => {
    await notify({
      title: '操作成功',
      body: '品牌信息已更新。',
    })
  }
}
```

Hook 会自动检测运行环境：
- **Electron 内**: 调用原生 OS 通知（macOS / Windows 各自的系统通知中心）
- **浏览器内**: 回退到 Web Notifications API

## 平台支持

| 平台 | 架构 | 产物 |
|------|------|------|
| macOS | x64 (Intel) + arm64 (Apple Silicon) | `.dmg` + `.zip` |
| Windows | x64 + ia32 | `.exe` (NSIS) + `.msi` |
| Linux | x64 | `.AppImage` + `.deb` |

## macOS 公证（Notarize）

生产发布前需配置 Apple Developer 凭据：
1. 在 `electron-builder.config.js` 中将 `notarize: false` 改为 `notarize: true`
2. 设置环境变量：`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`

## 图标资源

打包前需提供图标文件（放在 `electron/assets/`）：
- `icon.icns` — macOS，使用 `iconutil` 从 1024x1024 PNG 生成
- `icon.ico` — Windows，包含多种尺寸（16/32/48/256px）
- `icon.png` — Linux，512x512 PNG

## 已知注意事项

1. **API 代理**：Next.js 的 `rewrites` 配置将 `/api/v1/admin/*` 代理到后端，在 Electron 中同样生效，无需额外配置。
2. **端口冲突**：Electron 生产包固定使用 `127.0.0.1:3001`，确保该端口未被占用。
3. **CSP**：开发模式下 `webSecurity` 关闭以便 HMR 正常工作；生产模式开启。
