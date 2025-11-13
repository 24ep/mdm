/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
  // typescript: {
  //   // Allow build to continue even with TypeScript errors (useful for Docker builds)
  //   ignoreBuildErrors: true,
  // },
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Ignore client-only packages on server
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@openai\/chatkit-react$/,
        })
      )
      // Exclude native modules from server bundle
      config.externals = config.externals || []
      config.externals.push('ssh2-sftp-client', 'ftp', 'ssh2')
    }
    return config
  },
}

module.exports = nextConfig
