/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  output: 'standalone',
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
}
module.exports = nextConfig
