import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // IAS 16 is one page in the foundations, like inventory: its former addresses land on their place in it.
  async redirects() {
    return [
      { source: "/ias16-guide", destination: "/basics/ias16", permanent: true },
      { source: "/ias16-lab", destination: "/basics/ias16", permanent: true },
      { source: "/ias16-lab/exchange", destination: "/basics/ias16#exchange", permanent: true },
      { source: "/ias16-lab/renovation", destination: "/basics/ias16#renovation", permanent: true },
      { source: "/ias16-lab/revaluation", destination: "/basics/ias16#revaluation", permanent: true },
      // The pilot lesson grew into the six-lesson basics course.
      { source: "/study/basics", destination: "/basics", permanent: false },
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
