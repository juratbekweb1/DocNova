import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { SubscriptionProvider } from "@/components/providers/subscription-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserSubscription } from "@/lib/billing/subscription";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://docnova.uz"),
  title: {
    default: "DocNova | AI yordamida Rezyume va Intervyu tayyorlash",
    template: "%s | DocNova",
  },
  description: "DocNova bilan aqlli rezyume yarating, ATS formatlash, va AI yordamida intervyularga (Mock Test) tayyorgarlik ko'ring. Uzb/Rus tillarida yordam beradi.",
  keywords: ["rezyume builder", "AI resume", "ATS resume", "mock test", "intervyu tayyorgarlik", "karyera yordamchisi"],
  authors: [{ name: "DocNova Team" }],
  openGraph: {
    title: "DocNova | AI yordamida Rezyume va Intervyu",
    description: "DocNova bilan aqlli rezyume yarating, ATS formatlash, va AI yordamida intervyularga tayyorgarlik ko'ring.",
    url: "https://docnova.uz",
    siteName: "DocNova",
    type: "website",
    images: [
      {
        url: "https://docnova.uz/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DocNova Platformasi",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "DocNova | AI Karyera Yordamchisi",
    description: "O'z karyerangizni DocNova bilan boshlang.",
    images: ["https://docnova.uz/og-image.jpg"],
  },
  alternates: { canonical: "https://docnova.uz" },
};

import { cookies } from "next/headers";
import { Lang } from "@/components/providers/language-provider";
import { ThemeEnforcer } from "@/components/providers/theme-enforcer";
import { AppLayoutWrapper } from "@/components/layout/app-layout-wrapper";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  let subscription = undefined;
  if (session?.user?.id) {
    subscription = await getUserSubscription(session.user.id);
  }

  const cookieStore = await cookies();
  const initialLang = (cookieStore.get("NEXT_LOCALE")?.value as Lang) || "uz";

  return (
    <html
      lang={initialLang}
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="google" content="notranslate" />
      </head>
      <body className="flex min-h-full flex-col overflow-x-hidden" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (!window.location.pathname.startsWith('/dashboard') && 
                  !window.location.pathname.startsWith('/admin') && 
                  !window.location.pathname.startsWith('/super-admin') && 
                  !window.location.pathname.startsWith('/tools')) {
                document.body.classList.add('dark');
              }
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <ThemeEnforcer />
          <AuthSessionProvider>
            <SubscriptionProvider initialData={subscription}>
              <LanguageProvider initialLang={initialLang}>
                <AppLayoutWrapper>{children}</AppLayoutWrapper>
              </LanguageProvider>
            </SubscriptionProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

