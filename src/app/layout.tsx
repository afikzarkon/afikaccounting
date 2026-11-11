import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Frank_Ruhl_Libre, Geist_Mono, IBM_Plex_Sans_Hebrew } from "next/font/google";
import { ContentGuard } from "@/components/layout/content-guard";
import { MobileTabBar, MobileTabBarView } from "@/components/layout/continue";
import { Footer, MinimalFooter } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PageViewTracker } from "@/components/layout/page-view-tracker";
import { SearchPalette } from "@/components/layout/search";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SheetDock } from "@/components/sheet/sheet-dock";
import { FullSiteOnly } from "@/components/layout/session-store";
import { VisibilityProvider } from "@/components/layout/visibility";
import { SITE_URL } from "@/lib/env";
import { site } from "@/lib/site";
import { getVisibility } from "@/lib/visibility/server";
import "./globals.css";

// Plex Sans Hebrew for reading, Frank Ruhl Libre for headings; numbers in tables use Geist Mono.
const plex = IBM_Plex_Sans_Hebrew({ variable: "--font-plex", subsets: ["hebrew", "latin"], weight: ["400", "500", "600", "700"] });
const frank = Frank_Ruhl_Libre({ variable: "--font-frank", subsets: ["hebrew", "latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  // What WhatsApp, Telegram and the social networks show when a link is pasted: a Hebrew title and line, and the card image (app/opengraph-image.png).
  openGraph: { type: "website", locale: "he_IL", siteName: site.name, title: `${site.name} — ${site.tagline}`, description: site.description },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1713" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // What the admin hid: cached, so the pages stay prerendered; refreshed when it changes.
  const visibility = await getVisibility();
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning className={`${plex.variable} ${frank.variable} ${geistMono.variable} h-full`}>
      {/* Extensions such as Grammarly add attributes to <body> before React loads. */}
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <ThemeProvider>
          <VisibilityProvider value={visibility}>
            <a
              href="#main"
              className="sr-only z-50 rounded-lg bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:start-3"
            >
              דילוג לתוכן
            </a>
            <Navbar />
            <main id="main" className="flex-1">
              {children}
            </main>
            {/* The closed site: the site map, the tab bar and search only for an admin (lib/gate.ts). */}
            <FullSiteOnly fallback={<MinimalFooter />}>
              <Footer />
              <Suspense fallback={<MobileTabBarView />}>
                <MobileTabBar />
              </Suspense>
              <SearchPalette />
            </FullSiteOnly>
            <Suspense fallback={null}>
              <SheetDock />
            </Suspense>
            <Suspense fallback={null}>
              <PageViewTracker />
            </Suspense>
            <Suspense fallback={null}>
              <ContentGuard />
            </Suspense>
            <Analytics />
          </VisibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
