/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    // Skip Vercel Image Optimization entirely — avoids per-image billing.
    // All product/brand images are already optimized via our /api/proxy-image
    // or served as small PNGs/SVGs from Clearbit and shop CDNs.
    unoptimized: true,
    // Cache images for 1 year via CDN (Vercel + Cloudflare edge)
    minimumCacheTTL: 31536000,
  },
};

module.exports = nextConfig;
