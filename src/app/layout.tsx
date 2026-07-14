import type { Metadata } from "next";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://depot.vitaliipopov.dev";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('depot-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
