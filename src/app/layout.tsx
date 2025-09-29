import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmashBoard - Badminton Club Manager",
  description: "The Ultimate Badminton Club Manager - Track players, manage matches, courts, and calculate ELO ratings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Electron renderer polyfills for Node.js APIs
              if (typeof global === 'undefined') {
                var global = globalThis;
              }
              if (typeof require === 'undefined') {
                var require = function(id) {
                  console.warn('require() blocked for browser compatibility:', id);
                  return {};
                };
                require.resolve = function(id) { return id; };
                require.cache = {};
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
