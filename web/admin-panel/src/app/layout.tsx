import type { Metadata } from "next";
import "./globals.css";
import "../styles/skeleton.css";
import { StoreProvider } from "@/store/StoreProvider";

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
      <body className="antialiased">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
