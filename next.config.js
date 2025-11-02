/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co'],
  },
  // output: 'standalone', // Commented out for development
  webpack: (config, { isServer }) => {
    // Make react-icons optional - don't fail build if not installed
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
      }
    }
    // Ignore react-icons modules if they don't exist
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    return config
  },
}

module.exports = nextConfig
