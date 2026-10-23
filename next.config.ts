import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // The general IAS 16 guide was removed; its old links land on the IAS 16 page.
  async redirects() {
    return [{ source: "/ias16-guide", destination: "/ias16-lab", permanent: true }];
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
