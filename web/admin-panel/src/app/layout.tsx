import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/skeleton.css";
import { StoreProvider } from "@/store/StoreProvider";

// Configure fonts with fallback and timeout settings to prevent build failures
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Use font-display: swap for better loading
  fallback: ["system-ui", "arial"], // Fallback fonts if Google Fonts fail
  adjustFontFallback: true, // Automatically adjust font metrics
  preload: true, // Preload fonts
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["monospace"], // Fallback to system monospace
  adjustFontFallback: true,
  preload: true,
});

export const metadata: Metadata = {
  title: "FAYO Admin Panel",
  description: "FAYO Healthcare Admin Panel",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
