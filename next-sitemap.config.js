/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://drunkdriversettlement.com',
  generateRobotsTxt: true,
  changefreq: 'monthly',
  priority: 0.7,
  exclude: ['/thank-you', '/api/*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/thank-you'] },
    ],
  },
}
