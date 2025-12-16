/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow loading plugins from parent directory
  serverExternalPackages: [],
  // Enable standalone output for Docker
  output: 'standalone',
  // Allow loading plugins from filesystem
  experimental: {
    serverComponentsExternalPackages: [],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig

