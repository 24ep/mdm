import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MDM Plugin Hub',
  description: 'Plugin repository for MDM Marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

