import type { NextConfig } from "next";

// Artwork, banner and avatar images live in Supabase Storage's public buckets.
const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : '*.supabase.co';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }],
    formats: ['image/avif', 'image/webp'],
    // stored images don't change (new uploads get new names)
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // sharp's native binary and libvips are loaded at run time, and the build's
  // file tracing misses them, so Vercel's functions came without them and the
  // artwork pages failed with a 500. Ship them with the routes that upload.
  outputFileTracingIncludes: {
    '/dashboard/seller/**': [
      './node_modules/sharp/**/*',
      './node_modules/@img/sharp-linux-x64/**/*',
      './node_modules/@img/sharp-libvips-linux-x64/**/*',
    ],
  },
  experimental: {
    // A page visited in the last 30 s opens at once from the browser's memory
    // instead of asking the server again (server actions that change data
    // revalidate, which clears this memory).
    staleTimes: { dynamic: 30, static: 180 },
    serverActions: {
      // Artwork photos are posted through server actions. The form shrinks them
      // in the browser first; this leaves room for a large one without JS while
      // staying under Vercel's 4.5 MB request limit.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
