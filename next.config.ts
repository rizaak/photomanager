import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma', 'bullmq', 'ioredis', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'sharp'],

  async redirects() {
    return [
      // Legacy public gallery URL → /g/:token
      { source: '/gallery/:token',          destination: '/g/:token',                         permanent: true },
      // Legacy dashboard gallery URLs → /dashboard/galleries/:id
      { source: '/dashboard/gallery/:id',   destination: '/dashboard/galleries/:id',          permanent: true },
      { source: '/dashboard/gallery/:id/:path*', destination: '/dashboard/galleries/:id/:path*', permanent: true },
    ]
  },
}

export default nextConfig
