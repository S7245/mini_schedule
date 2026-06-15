import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/public/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/v1/public/:path*`,
      },
      {
        source: '/api/v1/brand/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/v1/brand/:path*`,
      },
    ]
  },
}

export default nextConfig
