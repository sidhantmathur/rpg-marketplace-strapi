import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
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
  title: "Adarle 20",
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
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </body>
    </html>
  );
}
