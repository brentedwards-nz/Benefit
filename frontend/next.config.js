/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;