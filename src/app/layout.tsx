import type { Metadata } from "next"
import { DM_Sans, DM_Mono, Fraunces } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
  weight: ["300", "400", "500"],
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "MenuMate — Digital Menu & Ordering",
  description: "Premium digital menu and ordering platform for Indian restaurants. Manage your menu, take orders, and grow your business.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍽️</text></svg>",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${dmMono.variable} ${fraunces.variable}`}>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <body className="antialiased font-body">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1A1A18',
              color: '#FAFAF8',
              fontSize: '14px',
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 500,
              borderRadius: '14px',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              borderLeft: '3px solid #22C55E',
            },
            success: {
              style: {
                borderLeftColor: '#22C55E',
              },
            },
            error: {
              style: {
                borderLeftColor: '#EF4444',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
