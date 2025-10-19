/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co'],
  },
  // output: 'standalone', // Commented out for development
}

module.exports = nextConfig
