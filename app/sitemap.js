// Served at /sitemap.xml. The site is one page; the panels (#story, #notes, …) are parts of it, not pages.
import { siteUrl, PUBLIC_URL } from '@/lib/site-url';

const SITE = siteUrl() || PUBLIC_URL;

export default function sitemap() {
  return [{ url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 }];
}
