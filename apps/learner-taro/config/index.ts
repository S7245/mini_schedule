import path from 'node:path'
import { defineConfig } from '@tarojs/cli'

export default defineConfig({
  projectName: 'learner-taro',
  date: '2026-7-13',
  designWidth: 750,
  deviceRatio: { 640: 2.34 / 2, 750: 1, 828: 1.81 / 2, 375: 2 },
  sourceRoot: 'src',
  outputRoot: process.env.TARO_ENV === 'h5' ? 'dist/h5' : 'dist/weapp',
  framework: 'react',
  compiler: 'webpack5',
  plugins: [],
  mini: {
    compile: {
      include: [path.resolve(__dirname, '../../../packages/core')],
    },
    postcss: {
      autoprefixer: { enable: true },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    router: { mode: 'hash' },
    compile: {
      include: [path.resolve(__dirname, '../../../packages/core')],
    },
    devServer: {
      proxy: {
        '/api': { target: 'http://localhost:8082', changeOrigin: true },
      },
    },
  },
})
