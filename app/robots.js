// Served at /robots.txt. Search engines may index the map; the admin and the API stay out.
import { siteUrl, PUBLIC_URL } from '@/lib/site-url';

const SITE = siteUrl() || PUBLIC_URL;

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${SITE}/sitemap.xml`
  };
}
