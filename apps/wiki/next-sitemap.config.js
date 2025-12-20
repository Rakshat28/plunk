/** @type {import('next-sitemap').IConfig} */

module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_WIKI_URI || 'https://docs.useplunk.com',
  generateRobotsTxt: true,
};
