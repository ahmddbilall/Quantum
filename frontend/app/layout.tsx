import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
// import "./globals.css"
import "@/styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NewsAI - Your AI-Powered Gateway to News",
  description: "Stay informed, explore perspectives, and understand the context — instantly.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
