// Sent with every response. frame-ancestors and X-Frame-Options stop other sites showing the site or the admin
// inside a frame (clickjacking); the rest are standard hardening that doesn't change how anything looks or works.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverComponentsExternalPackages: ['@electric-sql/pglite'] },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  }
};
export default nextConfig;
