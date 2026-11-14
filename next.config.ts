import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const origin = (url: string | undefined) => {
  try {
    return url ? new URL(url).origin : "";
  } catch {
    return "";
  }
};
// Supabase serves the API, auth, and Storage (media, signed exam files); the demo video may live elsewhere.
const supabase = origin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const demoVideo = origin(process.env.NEXT_PUBLIC_DEMO_VIDEO_URL);
const embeds = "https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://iframe.mediadelivery.net https://player.mediadelivery.net";

// Without nonces: they need every page rendered per request, which Partial Prerendering rules out.
// Inline scripts stay allowed (Next.js bootstrap, the theme script); everything else is pinned to known origins.
const csp = [
  "default-src 'self'",
  // Vercel Analytics loads from /_vercel/insights in production, and its debug script from va.vercel-scripts.com in dev.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://i.ytimg.com ${supabase}`,
  "font-src 'self' data:",
  `media-src 'self' blob: ${supabase} ${demoVideo}`,
  `connect-src 'self' ${supabase}${isDev ? " ws:" : ""}`,
  `frame-src 'self' ${embeds} ${supabase}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
]
  .map((d) => d.replace(/\s+/g, " ").trim())
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
      // Lesson 3 (credit, advances, loans) became the second half of lesson 2.
      { source: "/study/basics-journal", destination: "/study/basics-double-entry", permanent: true },
      // The credit-losses page became lesson 5 of the course.
      { source: "/basics/credit-losses", destination: "/study/basics-credit", permanent: true },
      // The six-lesson inventory course became twelve lessons: each former lesson lands on the one that now teaches what it began with.
      { source: "/study/inventory-intro", destination: "/study/inventory-what", permanent: true },
      { source: "/study/inventory-formulas", destination: "/study/inventory-fifo", permanent: true },
      { source: "/study/inventory-exam", destination: "/study/inventory-worksheet", permanent: true },
      // The fixed-assets course grew from five lessons to twelve: its depreciation lesson split into straight-line and the other methods.
      { source: "/study/ias16-depreciation", destination: "/study/ias16-straight", permanent: true },
      // The employee-benefits course went from twelve lessons to eight: each folded lesson lands on the one it now lives in.
      { source: "/study/ias19-toolkit", destination: "/study/ias19-map", permanent: true },
      { source: "/study/ias19-attribute", destination: "/study/ias19-measure", permanent: true },
      { source: "/study/ias19-amend", destination: "/study/ias19-rollforward", permanent: true },
      { source: "/study/ias19-present", destination: "/study/ias19-assets", permanent: true },
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
