import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";

// Self-hosted by next/font at build time: no layout shift, no runtime request to Google.
const sans = Fira_Sans({ subsets: ["latin"], weight: ["300", "500", "800"], variable: "--font-fira-sans", display: "swap" });
const code = Fira_Code({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-fira-code", display: "swap" });

// A blank or scheme-less env value must not crash every page through new URL().
function siteUrl(raw = process.env.NEXT_PUBLIC_SITE_URL): string {
  try {
    const u = new URL((raw ?? "").trim());
    if (u.protocol === "https:" || u.protocol === "http:") return u.origin;
  } catch {
    /* fall through */
  }
  return "https://depot.vitaliipopov.dev";
}
const SITE = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Depot — headless content API",
  description:
    "The backend half of a CMS: auth, Postgres, a typed content model and a token-secured delivery API. Built with Next.js route handlers, Drizzle and Neon.",
  openGraph: {
    title: "Depot — headless content API",
    description:
      "A headless content API: auth (sessions + API tokens), Postgres, a typed content model and a token-secured delivery API.",
    url: SITE,
    siteName: "Vitalii Popov — Portfolio",
    type: "website",
  },
  twitter: { card: "summary", title: "Depot — headless content API" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${code.variable}`} suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('depot-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
