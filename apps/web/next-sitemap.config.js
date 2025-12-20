/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_DASHBOARD_URI || 'https://app.useplunk.com',
  generateRobotsTxt: true,
};
