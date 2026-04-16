/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    // Restore viewport scroll offset when the user hits the browser's
    // Back button (or the in-app Breadcrumb link). Without this the
    // category → product → back dance resets the grid to the top every
    // time, so users lose their spot after browsing a single product.
    scrollRestoration: true,
  },
  images: {
    // Skip Vercel Image Optimization entirely — avoids per-image billing.
    // All product/brand images are already optimized via our /api/proxy-image
    // or served as small PNGs/SVGs from Google Favicons and shop CDNs.
    unoptimized: true,
    // Cache images for 1 year via CDN (Vercel + Cloudflare edge)
    minimumCacheTTL: 31536000,
    // Whitelist remote hosts. Primary consumers are our `<img>` tags
    // which don't enforce this list, but next/image (e.g. future
    // refactors, /_next/image proxy) will — keep the list exhaustive:
    //   · Google Favicons API — shop & brand logos
    //   · t[0-3].gstatic.com — the CDN Google redirects to
    //   · clearbit.com      — legacy fallback for brands we haven't
    //     mapped yet
    //   · images.unsplash.com — editorial images in seed / blog
    remotePatterns: [
      { protocol: "https", hostname: "www.google.com", pathname: "/s2/favicons" },
      { protocol: "https", hostname: "t0.gstatic.com" },
      { protocol: "https", hostname: "t1.gstatic.com" },
      { protocol: "https", hostname: "t2.gstatic.com" },
      { protocol: "https", hostname: "t3.gstatic.com" },
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
