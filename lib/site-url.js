// SITE_URL, checked: the site's public address without a trailing slash, or '' when it's unset or isn't a plain
// http(s) address. A value with anything extra pasted in (such as "https://undauntedlab.com (Production only)")
// is ignored rather than used to build broken links; Settings → Connections flags it.
export function siteUrl() {
  const raw = String(process.env.SITE_URL || '').trim();
  if (!raw || /\s/.test(raw)) return '';
  try {
    const u = new URL(raw);
    return /^https?:$/.test(u.protocol) ? u.origin : '';
  } catch { return ''; }
}

export const PUBLIC_URL = 'https://undauntedlab.com';
