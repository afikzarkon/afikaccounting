import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // IAS 16 is one page now: the removed guide and the former topic pages land on their place in it.
  async redirects() {
    return [
      { source: "/ias16-guide", destination: "/ias16-lab", permanent: true },
      { source: "/ias16-lab/exchange", destination: "/ias16-lab#exchange", permanent: true },
      { source: "/ias16-lab/renovation", destination: "/ias16-lab#renovation", permanent: true },
      { source: "/ias16-lab/revaluation", destination: "/ias16-lab#revaluation", permanent: true },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
