import localFont from 'next/font/local';
import './globals.css';

// Self-hosted variable fonts (SIL Open Font License), so builds never depend on Google Fonts being reachable.
const display = localFont({ src: './fonts/bricolage-grotesque-latin.woff2', weight: '200 800', variable: '--font-display', display: 'swap' });
const body = localFont({ src: './fonts/dm-sans-latin.woff2', weight: '100 1000', variable: '--font-body', display: 'swap' });

export const metadata = {
  title: 'Undaunted Lab',
  description: 'Undaunted Lab builds AI-native safety and access tools for everyday people in the UK, Nigeria and Canada.',
  metadataBase: new URL('https://undauntedlab.com'),
  icons: { icon: '/logo.png' },
  openGraph: {
    title: 'Undaunted Lab',
    description: 'AI-native safety and access tools: Scamfendr, Ganusii, NotisCare, Nestlo and Vervet.',
    url: 'https://undauntedlab.com',
    siteName: 'Undaunted Lab',
    type: 'website',
    // A snapshot of the map; regenerate with scripts/og-image.cjs after the map or tagline changes.
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'An illustrated map of London, Lagos and Calgary as islands, with a paper plane flying between Undaunted Lab’s products' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Undaunted Lab',
    description: 'AI-native safety and access tools: Scamfendr, Ganusii, NotisCare, Nestlo and Vervet.',
    images: ['/og.png']
  }
};

export const viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#BFE3F3' }, { media: '(prefers-color-scheme: dark)', color: '#1C2E55' }]
};

// Applies a saved day/night choice before first paint, so a returning visitor never sees the other theme flash.
// The admin has no night theme, so it's left out.
const THEME_SCRIPT = "try{var t=localStorage.getItem('ul-theme');if((t==='dark'||t==='light')&&location.pathname.indexOf('/admin')!==0)document.documentElement.dataset.theme=t}catch(e){}";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`fonts ${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body>{children}</body>
    </html>
  );
}
