import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata = {
  title: "A CHIP-8 Emulator - Adityaa Mehra",
  description: "Play classic CHIP-8 games in your browser",

  openGraph: {
    type: "website",
    url: "https://chip8.adityaamehra.me/",
    title: "A CHIP-8 Emulator - Adityaa Mehra",
    description: "Play classic CHIP-8 games in your browser",
    images: [
      {
        url: "https://metatags.io/images/meta-tags.png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "A CHIP-8 Emulator - Adityaa Mehra",
    description: "Play classic CHIP-8 games in your browser",
    images: ["https://metatags.io/images/meta-tags.png"],
  },

   icons: {
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
