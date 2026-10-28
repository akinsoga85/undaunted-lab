// Served at /sitemap.xml. The site is one page; the panels (#story, #notes, …) are parts of it, not pages.
const SITE = (process.env.SITE_URL || 'https://undauntedlab.com').replace(/\/$/, '');

export default function sitemap() {
  return [{ url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 }];
}
