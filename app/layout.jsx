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
    images: ['/logo.png']
  }
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#BFE3F3' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`fonts ${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
