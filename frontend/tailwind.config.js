/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#090B11',
        surface: '#151A22',
        current: { DEFAULT: '#2DD4BF', end: '#5EEAD4', violet: '#A78BFA' },
      },
      fontFamily: {
        sans: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Hanken Grotesk', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'radar-sweep': 'wt-sweep 2.6s linear infinite',
        'wt-drift': 'wt-drift 16s ease-in-out infinite',
        'wt-pulse': 'wt-pulse 1.6s ease-in-out infinite',
        'wt-ring': 'wt-ring 2.6s ease-out infinite',
        'fade-rise': 'fade-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scan-reveal': 'scan-reveal 1.1s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'wt-sweep': {
          to: { transform: 'rotate(360deg)' },
        },
        'wt-drift': {
          '0%': { transform: 'translate(-50%, 0) scale(1)', opacity: '0.85' },
          '50%': { transform: 'translate(-48%, -2%) scale(1.06)', opacity: '1' },
          '100%': { transform: 'translate(-50%, 0) scale(1)', opacity: '0.85' },
        },
        'wt-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.78)' },
        },
        'wt-ring': {
          '0%': { transform: 'scale(0.6)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        'fade-rise': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scan-reveal': {
          '0%': { transform: 'scale(0.82)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
