import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import "./globals.css"
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import AppRouteGuard from "@/components/auth/AppRouteGuard";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Quantum - Your AI-Powered Gateway to News",
  description:
    "Stay informed, explore perspectives, and understand the context — instantly.",
  icons: {
    icon: "/quantum-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Oxanium:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <AuthProvider>
            <AppRouteGuard>{children}</AppRouteGuard>
            <Toaster />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
