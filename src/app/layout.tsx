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
  metadataBase: new URL("https://DocNova.example.com"),
  title: {
    default: "DocNova | AI-Powered Resume Builder",
    template: "%s | DocNova",
  },
  description:
    "Create polished resumes with AI guidance, ATS-ready formatting, and export-ready templates.",
  keywords: ["resume builder", "AI resume", "ATS resume", "career tools"],
  authors: [{ name: "DocNova" }],
  openGraph: {
    title: "DocNova | AI-Powered Resume Builder",
    description:
      "Create polished resumes with AI guidance, ATS-ready formatting, and export-ready templates.",
    url: "https://DocNova.example.com",
    siteName: "DocNova",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocNova | AI-Powered Resume Builder",
    description:
      "Create polished resumes with AI guidance, ATS-ready formatting, and export-ready templates.",
  },
  alternates: { canonical: "https://DocNova.example.com" },
};

import { cookies } from "next/headers";
import { Lang } from "@/components/providers/language-provider";

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          value={{ dark: "dark", light: "light" }}
        >
          <AuthSessionProvider>
            <SubscriptionProvider initialData={subscription}>
              <LanguageProvider initialLang={initialLang}>
                <Navbar />
                <main className="flex-1 pt-20">{children}</main>
              </LanguageProvider>
            </SubscriptionProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
