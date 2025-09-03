import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config) => {
    // Provide a lightweight shim for optional peer '@emotion/is-prop-valid'
    // Some deps (e.g., framer-motion via narraleaf-react) may require it dynamically.
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@emotion/is-prop-valid': path.resolve(process.cwd(), 'lib/shims/emotion-is-prop-valid.js'),
    }
    return config
  },
};

export default nextConfig;
