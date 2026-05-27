/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/pantrychef',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'source.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
    dangerouslyAllowSVG: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

module.exports = nextConfig
