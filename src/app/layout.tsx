import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { SpaceProvider } from '@/contexts/space-context'
import { DynamicFavicon } from '@/components/ui/dynamic-favicon'
import { Toaster } from 'sonner'
import { Suspense } from 'react'
import { LoadingPage } from '@/components/ui/loading-spinner'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Customer Data Management',
  description: 'Comprehensive customer data management system for event organizations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <DynamicFavicon />
          <SidebarProvider>
            <Suspense fallback={<LoadingPage />}>
              <SpaceProvider>
                {children}
              </SpaceProvider>
            </Suspense>
          </SidebarProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
