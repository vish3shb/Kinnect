/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/api/:path*`, // Proxy to Backend
      },
      {
        source: '/ws/:path*',
        destination: `${backendUrl}/ws/:path*`, // Proxy to WebSockets
      }
    ];
  },
}

module.exports = nextConfig;

