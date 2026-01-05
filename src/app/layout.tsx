import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { SpaceProvider } from '@/contexts/space-context'
import { DynamicFavicon } from '@/components/ui/dynamic-favicon'
import { Suspense } from 'react'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { GlobalErrorHandler } from '@/components/global-error-handler'
import { SecurityProvider } from '@/components/providers/SecurityProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Unified Data Platform',
  description: 'Comprehensive unified data platform for event organizations',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <GlobalErrorHandler />
        <Providers>
          <DynamicFavicon />
             <SecurityProvider>
              <SidebarProvider>
                <Suspense fallback={<LoadingPage />}>
                  <SpaceProvider>
                    {children}
                  </SpaceProvider>
                </Suspense>
              </SidebarProvider>
             </SecurityProvider>
        </Providers>
      </body>
    </html>
  )
}
