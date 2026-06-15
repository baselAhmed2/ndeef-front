import type { NextConfig } from 'next'

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_NDEEF_BACKEND_URL ??
  process.env.NDEEF_BACKEND_URL ??
  'https://basel-ahmed-nazeef.hf.space'
).replace(/\/+$/, '')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
