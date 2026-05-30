import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://legalsearch.pk"),
  title: {
    default: "LegalSearch Pakistan - Search Pakistani Laws, Judgments & Citations",
    template: "%s | LegalSearch Pakistan",
  },
  description:
    "Free legal search engine for Pakistan. Search Supreme Court judgments, High Court decisions, PPC, CrPC, PECA sections, and legal citations across all Pakistani courts. Fast, accurate, and free.",
  keywords: [
    "Pakistan law",
    "Supreme Court Pakistan",
    "High Court judgments",
    "legal research Pakistan",
    "citation search",
    "PPC sections",
    "CrPC sections",
    "PECA",
    "Pakistan Penal Code",
    "Criminal Procedure Code",
    "SCMR",
    "PLD",
    "YLR",
    "CLD",
    "MLD",
    "PTD",
    "PCrLJ",
    "Pakistan Constitution",
    "Article 199",
    "bail law Pakistan",
    "cybercrime law Pakistan",
    "Pakistani case law",
    "legal database Pakistan",
    "free legal search",
    "judgment search Pakistan",
    "law sections Pakistan",
    "Pakistan Code",
    "Lahore High Court",
    "Sindh High Court",
    "Islamabad High Court",
    "Peshawar High Court",
    "Balochistan High Court",
  ],
  authors: [{ name: "LegalSearch Pakistan" }],
  creator: "LegalSearch Pakistan",
  publisher: "LegalSearch Pakistan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://legalsearch.pk",
    siteName: "LegalSearch Pakistan",
    title: "LegalSearch Pakistan - Free Legal Search Engine",
    description:
      "Search Pakistani laws, judgments, and citations across Supreme Court, High Courts, and statutory sources. Free and fast legal research tool.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LegalSearch Pakistan - Pakistani Legal Search Engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LegalSearch Pakistan - Free Legal Search Engine",
    description:
      "Search Pakistani laws, judgments, and citations across all courts. Free legal research tool.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://legalsearch.pk",
  },
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console verification
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#006633" },
    { media: "(prefers-color-scheme: dark)", color: "#004d26" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LegalSearch Pakistan",
    url: "https://legalsearch.pk",
    description:
      "Free legal search engine for Pakistan. Search Supreme Court judgments, High Court decisions, and legal citations.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://legalsearch.pk/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "LegalSearch Pakistan",
      url: "https://legalsearch.pk",
    },
  };

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LegalSearch Pakistan",
    url: "https://legalsearch.pk",
    logo: "https://legalsearch.pk/logo.png",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Urdu"],
    },
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('plse-theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
