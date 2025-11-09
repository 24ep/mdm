/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // output: 'standalone', // Commented out for development
  webpack: (config, { isServer, webpack }) => {
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
    // Ignore @openai/chatkit-react only on server-side to prevent SSR issues
    // Allow client-side dynamic imports to work properly
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@openai\/chatkit-react$/,
        })
      )
    }
    // Make @tanstack/react-query-devtools optional - use stub if package not found
    try {
      require.resolve('@tanstack/react-query-devtools')
      // Package exists, don't replace it
    } catch (e) {
      // Package doesn't exist, use stub
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^@tanstack\/react-query-devtools$/,
          require.resolve('./src/lib/providers/react-query-devtools-stub.ts')
        )
      )
    }
    return config
  },
}

module.exports = nextConfig
