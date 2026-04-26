import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Keep Node.js-only packages out of the webpack bundle
  serverExternalPackages: ['@prisma/client', 'prisma', 'bullmq', 'ioredis', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'sharp'],
}

export default nextConfig
