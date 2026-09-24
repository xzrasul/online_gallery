import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Artwork photos are posted through server actions. The form shrinks them
      // in the browser first; this leaves room for a large one without JS while
      // staying under Vercel's 4.5 MB request limit.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
