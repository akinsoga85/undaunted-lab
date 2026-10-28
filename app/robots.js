// Served at /robots.txt. Search engines may index the map; the admin and the API stay out.
const SITE = (process.env.SITE_URL || 'https://undauntedlab.com').replace(/\/$/, '');

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${SITE}/sitemap.xml`
  };
}
