export const theme = {
  colors: {
    primary: '#3B82F6',
    primaryDark: '#1D4ED8',
    accent: '#3CB043',
    accentDark: '#237A2C',
    gold: '#FFC531',
    goldDark: '#C98A0C',
    bg: '#CFE8FF',
    surface: '#FFFDF6',
    border: '#C9D6E3',
    outline: '#1B1B2F',
    text: '#1B1B2F',
    textMuted: '#5A5A72',
    success: '#3CB043',
    error: '#E5383B',
  },
  radius: {
    sm: '0px',
    md: '0px',
    lg: '0px',
  },
  shadow: {
    card: '5px 5px 0 rgba(27, 27, 47, 0.9)',
    cardSm: '3px 3px 0 rgba(27, 27, 47, 0.9)',
  },
  fonts: {
    heading: "'Press Start 2P', 'Black Han Sans', sans-serif",
    body: "'Black Han Sans', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Segoe UI', sans-serif",
  },
} as const

export type AppTheme = typeof theme
