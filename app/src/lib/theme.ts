/**
 * Futisveikkaus design tokens (football / pitch palette).
 *
 * Values are HSL channels without the `hsl()` wrapper — used as
 * `hsl(var(--primary))` in app.postcss and Tailwind theme.extend.
 *
 * - Primary: deep pitch green (nav, CTAs)
 * - Background / card: white and soft neutrals
 * - Accent: light / deep green (highlights, hovers, active nav)
 * - Muted: subtle greens for borders and secondary text
 */
export const themeTokens = {
  light: {
    background: '0 0% 99%',
    foreground: '160 55% 12%',
    card: '0 0% 100%',
    cardForeground: '160 55% 12%',
    popover: '0 0% 100%',
    popoverForeground: '160 55% 12%',
    primary: '158 64% 18%',
    primaryForeground: '0 0% 100%',
    secondary: '152 28% 92%',
    secondaryForeground: '160 45% 18%',
    muted: '152 20% 94%',
    mutedForeground: '160 12% 38%',
    accent: '152 38% 90%',
    accentForeground: '158 55% 18%',
    destructive: '0 72% 51%',
    destructiveForeground: '0 0% 100%',
    border: '152 18% 86%',
    input: '152 18% 86%',
    ring: '158 55% 32%',
    radius: '0.5rem',
    fontSans:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  dark: {
    background: '158 55% 8%',
    foreground: '152 20% 96%',
    card: '158 45% 11%',
    cardForeground: '152 20% 96%',
    popover: '158 45% 11%',
    popoverForeground: '152 20% 96%',
    primary: '152 45% 42%',
    primaryForeground: '158 55% 8%',
    secondary: '158 30% 16%',
    secondaryForeground: '152 20% 96%',
    muted: '158 25% 14%',
    mutedForeground: '152 12% 62%',
    accent: '158 28% 16%',
    accentForeground: '152 20% 96%',
    destructive: '0 62% 45%',
    destructiveForeground: '0 0% 100%',
    border: '158 25% 20%',
    input: '158 25% 20%',
    ring: '152 45% 42%',
    radius: '0.5rem',
    fontSans:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
} as const;

/** @deprecated Use themeTokens */
export const pitchTheme = themeTokens.light;
