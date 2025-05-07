import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RPG Marketplace",
  description: "A marketplace for tabletop RPG sessions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'fantasy-border',
            style: {
              background: 'var(--parchment)',
              color: 'var(--ink)',
              border: '2px solid var(--ink-light)',
              borderRadius: '4px',
              fontFamily: 'var(--font-sans)',
            },
            success: {
              iconTheme: {
                primary: 'var(--forest)',
                secondary: 'var(--parchment)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--ruby)',
                secondary: 'var(--parchment)',
              },
            },
            loading: {
              iconTheme: {
                primary: 'var(--amber)',
                secondary: 'var(--parchment)',
              },
            },
          }}
        />
        <header className="border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-xl font-bold text-primary">
                RPG Marketplace
              </Link>
              <div className="flex items-center gap-4">
                <nav className="flex items-center gap-4">
                  <Link 
                    href="/" 
                    className="text-ink hover:text-ink-light font-bold"
                  >
                    Home
                  </Link>
                </nav>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </body>
    </html>
  );
}
