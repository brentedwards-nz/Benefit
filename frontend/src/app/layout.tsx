import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import Providers from "@/components/query-provider/QueryProvider";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Bene-Fit Wellness Solutions",
    template: "%s | Bene-Fit Wellness Solutions",
  },
  description: "Changing lives through wellness. Feel the Bene-Fit",
  keywords: [
    "wellness",
    "fitness",
    "health",
    "nutrition",
    "coaching",
    "therapy",
  ],
  authors: [{ name: "Bene-Fit Wellness Solutions" }],
  creator: "Bene-Fit Wellness Solutions",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: defaultUrl,
    title: "Bene-Fit Wellness Solutions",
    description: "Changing lives through wellness. Feel the Bene-Fit",
    siteName: "Bene-Fit Wellness Solutions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bene-Fit Wellness Solutions",
    description: "Changing lives through wellness. Feel the Bene-Fit",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <main className="min-h-screen flex flex-col items-center">
          <NextAuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Providers>{children}</Providers>
              <Toaster />
            </ThemeProvider>
          </NextAuthProvider>
        </main>
      </body>
    </html>
  );
}
