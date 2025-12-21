import type { Metadata } from 'next'
import './globals.css'
import { MarketingHeader } from './components/MarketingHeader'
import { MarketingFooter } from './components/MarketingFooter'

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
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '73px' }}>
        <MarketingHeader />
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <MarketingFooter />
      </body>
    </html>
  )
}

