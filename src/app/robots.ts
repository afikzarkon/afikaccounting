import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

/**
 * Closed to search engines until launch: a preview or staging deployment must not
 * be indexed. Set SITE_INDEXING=1 on the production site when it goes public.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_INDEXING !== "1") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/dashboard", "/profile", "/checkout", "/billing", "/auth/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
