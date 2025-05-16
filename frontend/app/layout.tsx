import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from './providers';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  weight: "400", // Assuming regular weight, adjust if needed
  display: "swap",
})

export const metadata: Metadata = {
  title: "DeepLever | Bring CEX-grade leverage to Sui",
  description: "Borrow and lend on Sui safely and transparently with DeepLever",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geist.variable} font-sans bg-slate-900 text-white`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
