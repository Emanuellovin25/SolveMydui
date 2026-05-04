/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  env: {
    SITE_STATE: process.env.SITE_STATE || 'TX',
    SITE_NAME: process.env.SITE_NAME || 'Drunk Driver Settlement Calculator',
    SITE_URL: process.env.SITE_URL || 'https://drunkdriversettlement.com',
    AUTHOR_NAME: process.env.AUTHOR_NAME || 'Settlement Research Team',
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
      ],
    }]
  },
}
module.exports = nextConfig
