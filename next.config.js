/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co'],
  },
  output: 'standalone',
}

module.exports = nextConfig
