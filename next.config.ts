import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.myportfolio.com',
      },
      {
        protocol: 'https',
        hostname: 'fcovciswghasp9jj.public.blob.vercel-storage.com',
      },
    ],
  },
}

export default nextConfig
