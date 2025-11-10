/**
 * Theme configuration with multiple light and dark theme variants
 */

export type ThemeVariant = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'slate' | 'amber'

export interface ThemeConfig {
  id: string
  name: string
  variant: ThemeVariant
  mode: 'light' | 'dark'
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
  }
}

export const lightThemes: ThemeConfig[] = [
  {
    id: 'light-default',
    name: 'Default Light',
    variant: 'default',
    mode: 'light',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      popover: '0 0% 100%',
      popoverForeground: '222.2 84% 4.9%',
      primary: '221.2 83.2% 53.3%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96%',
      secondaryForeground: '222.2 84% 4.9%',
      muted: '210 40% 96%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      accentForeground: '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '221.2 83.2% 53.3%',
    },
  },
  {
    id: 'light-blue',
    name: 'Blue Light',
    variant: 'blue',
    mode: 'light',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 47.4% 11.2%',
      card: '0 0% 100%',
      cardForeground: '222.2 47.4% 11.2%',
      popover: '0 0% 100%',
      popoverForeground: '222.2 47.4% 11.2%',
      primary: '217.2 91.2% 59.8%',
      primaryForeground: '222.2 47.4% 11.2%',
      secondary: '210 40% 96.1%',
      secondaryForeground: '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96.1%',
      accentForeground: '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '217.2 91.2% 59.8%',
    },
  },
  {
    id: 'light-green',
    name: 'Green Light',
    variant: 'green',
    mode: 'light',
    colors: {
      background: '0 0% 100%',
      foreground: '142.1 76.2% 36.3%',
      card: '0 0% 100%',
      cardForeground: '142.1 76.2% 36.3%',
      popover: '0 0% 100%',
      popoverForeground: '142.1 76.2% 36.3%',
      primary: '142.1 70.6% 45.3%',
      primaryForeground: '355.7 100% 97.3%',
      secondary: '210 40% 96.1%',
      secondaryForeground: '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96.1%',
      accentForeground: '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '142.1 70.6% 45.3%',
    },
  },
  {
    id: 'light-purple',
    name: 'Purple Light',
    variant: 'purple',
    mode: 'light',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 47.4% 11.2%',
      card: '0 0% 100%',
      cardForeground: '222.2 47.4% 11.2%',
      popover: '0 0% 100%',
      popoverForeground: '222.2 47.4% 11.2%',
      primary: '262.1 83.3% 57.8%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96.1%',
      secondaryForeground: '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96.1%',
      accentForeground: '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '262.1 83.3% 57.8%',
    },
  },
  {
    id: 'light-orange',
    name: 'Orange Light',
    variant: 'orange',
    mode: 'light',
    colors: {
      background: '0 0% 100%',
      foreground: '20 14.3% 4.1%',
      card: '0 0% 100%',
      cardForeground: '20 14.3% 4.1%',
      popover: '0 0% 100%',
      popoverForeground: '20 14.3% 4.1%',
      primary: '24.6 95% 53.1%',
      primaryForeground: '60 9.1% 97.8%',
      secondary: '60 4.8% 95.9%',
      secondaryForeground: '24 9.8% 10%',
      muted: '60 4.8% 95.9%',
      mutedForeground: '25 5.3% 44.7%',
      accent: '60 4.8% 95.9%',
      accentForeground: '24 9.8% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '60 9.1% 97.8%',
      border: '20 5.9% 90%',
      input: '20 5.9% 90%',
      ring: '24.6 95% 53.1%',
    },
  },
  {
    id: 'light-slate',
    name: 'Slate Light',
    variant: 'slate',
    mode: 'light',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 47.4% 11.2%',
      card: '0 0% 100%',
      cardForeground: '222.2 47.4% 11.2%',
      popover: '0 0% 100%',
      popoverForeground: '222.2 47.4% 11.2%',
      primary: '222.2 47.4% 11.2%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96.1%',
      secondaryForeground: '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96.1%',
      accentForeground: '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '222.2 47.4% 11.2%',
    },
  },
]

export const darkThemes: ThemeConfig[] = [
  {
    id: 'dark-default',
    name: 'Default Dark',
    variant: 'default',
    mode: 'dark',
    colors: {
      background: '0 0% 9%',
      foreground: '210 40% 98%',
      card: '0 0% 9%',
      cardForeground: '210 40% 98%',
      popover: '0 0% 9%',
      popoverForeground: '210 40% 98%',
      primary: '217.2 91.2% 59.8%',
      primaryForeground: '0 0% 9%',
      secondary: '0 0% 15%',
      secondaryForeground: '210 40% 98%',
      muted: '0 0% 15%',
      mutedForeground: '215 20.2% 65.1%',
      accent: '0 0% 15%',
      accentForeground: '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      border: '0 0% 15%',
      input: '0 0% 15%',
      ring: '224.3 76.3% 94.1%',
    },
  },
  {
    id: 'dark-blue',
    name: 'Blue Dark',
    variant: 'blue',
    mode: 'dark',
    colors: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      cardForeground: '210 40% 98%',
      popover: '222.2 84% 4.9%',
      popoverForeground: '210 40% 98%',
      primary: '217.2 91.2% 59.8%',
      primaryForeground: '222.2 47.4% 11.2%',
      secondary: '217.2 32.6% 17.5%',
      secondaryForeground: '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      mutedForeground: '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      accentForeground: '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '224.3 76.3% 94.1%',
    },
  },
  {
    id: 'dark-green',
    name: 'Green Dark',
    variant: 'green',
    mode: 'dark',
    colors: {
      background: '20 14.3% 4.1%',
      foreground: '0 0% 98%',
      card: '20 14.3% 4.1%',
      cardForeground: '0 0% 98%',
      popover: '20 14.3% 4.1%',
      popoverForeground: '0 0% 98%',
      primary: '142.1 70.6% 45.3%',
      primaryForeground: '144.9 80.4% 10%',
      secondary: '240 3.7% 15.9%',
      secondaryForeground: '0 0% 98%',
      muted: '240 3.7% 15.9%',
      mutedForeground: '240 5% 64.9%',
      accent: '240 3.7% 15.9%',
      accentForeground: '0 0% 98%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '0 0% 98%',
      border: '240 3.7% 15.9%',
      input: '240 3.7% 15.9%',
      ring: '142.4 71.8% 29.2%',
    },
  },
  {
    id: 'dark-purple',
    name: 'Purple Dark',
    variant: 'purple',
    mode: 'dark',
    colors: {
      background: '224 71.4% 4.1%',
      foreground: '210 20% 98%',
      card: '224 71.4% 4.1%',
      cardForeground: '210 20% 98%',
      popover: '224 71.4% 4.1%',
      popoverForeground: '210 20% 98%',
      primary: '263.4 70% 50.4%',
      primaryForeground: '210 20% 98%',
      secondary: '215 27.9% 16.9%',
      secondaryForeground: '210 20% 98%',
      muted: '215 27.9% 16.9%',
      mutedForeground: '217.9 10.6% 64.9%',
      accent: '215 27.9% 16.9%',
      accentForeground: '210 20% 98%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 20% 98%',
      border: '215 27.9% 16.9%',
      input: '215 27.9% 16.9%',
      ring: '263.4 70% 50.4%',
    },
  },
  {
    id: 'dark-orange',
    name: 'Orange Dark',
    variant: 'orange',
    mode: 'dark',
    colors: {
      background: '20 14.3% 4.1%',
      foreground: '60 9.1% 97.8%',
      card: '20 14.3% 4.1%',
      cardForeground: '60 9.1% 97.8%',
      popover: '20 14.3% 4.1%',
      popoverForeground: '60 9.1% 97.8%',
      primary: '20.5 90.2% 48.2%',
      primaryForeground: '60 9.1% 97.8%',
      secondary: '12 6.5% 15.1%',
      secondaryForeground: '60 9.1% 97.8%',
      muted: '12 6.5% 15.1%',
      mutedForeground: '24 5.4% 63.9%',
      accent: '12 6.5% 15.1%',
      accentForeground: '60 9.1% 97.8%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '60 9.1% 97.8%',
      border: '12 6.5% 15.1%',
      input: '12 6.5% 15.1%',
      ring: '20.5 90.2% 48.2%',
    },
  },
  {
    id: 'dark-slate',
    name: 'Slate Dark',
    variant: 'slate',
    mode: 'dark',
    colors: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      cardForeground: '210 40% 98%',
      popover: '222.2 84% 4.9%',
      popoverForeground: '210 40% 98%',
      primary: '210 40% 98%',
      primaryForeground: '222.2 47.4% 11.2%',
      secondary: '217.2 32.6% 17.5%',
      secondaryForeground: '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      mutedForeground: '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      accentForeground: '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '212.7 26.8% 83.9%',
    },
  },
  {
    id: 'dark-amber',
    name: 'Amber Dark',
    variant: 'amber',
    mode: 'dark',
    colors: {
      background: '20 14.3% 4.1%',
      foreground: '60 9.1% 97.8%',
      card: '20 14.3% 4.1%',
      cardForeground: '60 9.1% 97.8%',
      popover: '20 14.3% 4.1%',
      popoverForeground: '60 9.1% 97.8%',
      primary: '47.9 95.8% 53.1%',
      primaryForeground: '26 83.3% 14.1%',
      secondary: '12 6.5% 15.1%',
      secondaryForeground: '60 9.1% 97.8%',
      muted: '12 6.5% 15.1%',
      mutedForeground: '24 5.4% 63.9%',
      accent: '12 6.5% 15.1%',
      accentForeground: '60 9.1% 97.8%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '60 9.1% 97.8%',
      border: '12 6.5% 15.1%',
      input: '12 6.5% 15.1%',
      ring: '47.9 95.8% 53.1%',
    },
  },
]

export const allThemes: ThemeConfig[] = [...lightThemes, ...darkThemes]

export function getThemeById(id: string): ThemeConfig | undefined {
  return allThemes.find(theme => theme.id === id)
}

export function getThemesByMode(mode: 'light' | 'dark'): ThemeConfig[] {
  return allThemes.filter(theme => theme.mode === mode)
}

export function getThemeByVariant(variant: ThemeVariant, mode: 'light' | 'dark'): ThemeConfig | undefined {
  return allThemes.find(theme => theme.variant === variant && theme.mode === mode)
}


