export const theme = {
  colors: {
    primary: '#eab308', // yellow-500
    primaryDark: '#a16207', // yellow-700
    bg: '#030712', // gray-950
    panel: '#111827', // gray-900
    surface: '#1f2937', // gray-800
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#ffffff', // max contrast
    textMuted: '#d1d5db', // gray-300 (lighter than gray-400)
    fold: '#ef4444', // red-500 (lighter than red-800)
    call: '#60a5fa', // blue-400 (lighter than blue-800)
    raise: '#facc15', // yellow-400 (lighter than yellow-700)
    success: '#22c55e', // green-500
    error: '#ef4444', // red-500
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    premium: '0 0 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(234, 179, 8, 0.1)',
    glow: '0 0 20px rgba(234, 179, 8, 0.3)',
  },
  radius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
}
