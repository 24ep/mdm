"use client"

// Polyfill for crypto.randomUUID in non-secure contexts (HTTP)
// crypto.randomUUID() only works in secure contexts (HTTPS or localhost)
if (typeof window !== 'undefined' && typeof crypto !== 'undefined' && !crypto.randomUUID) {
  (crypto as any).randomUUID = function(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { useThemeSafe } from "@/hooks/use-theme-safe"
import { Toaster } from "react-hot-toast"
import { NotificationProvider } from "@/contexts/notification-context"
import { QueryProvider } from "@/lib/providers/query-provider"
import { ThemeProvider } from "@/contexts/theme-context"
import { BrandingInitializer } from "@/components/branding/BrandingInitializer"
import { useEffect, useState } from "react"


function ThemedToaster() {
  const { isDark, mounted } = useThemeSafe()

  if (!mounted) {
    return (
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    )
  }

  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#fff' : '#000',
          border: '1px solid hsl(var(--border))',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: isDark ? '#1f2937' : '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: isDark ? '#1f2937' : '#ffffff',
          },
        },
      }}
    />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <ThemeProvider>
          <BrandingInitializer />
          <QueryProvider>
            <NotificationProvider>
              {children}
              <ThemedToaster />
            </NotificationProvider>
          </QueryProvider>
        </ThemeProvider>
      </NextThemeProvider>
    </SessionProvider>
  )
}
