import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Outputs a self-contained Node.js server at .next/standalone/ for Electron packaging
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/v1/admin/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8083'}/api/v1/admin/:path*`,
      },
    ]
  },
}

export default nextConfig
