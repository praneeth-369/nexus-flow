/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#09090B',
          darker: '#050506',
          subtle: '#101013',
        },
        panel: {
          DEFAULT: '#121215',
          card: '#18181B',
          hover: '#202024',
          border: '#27272A',
          borderLight: '#3F3F46',
        },
        status: {
          completed: '#10B981',
          ready: '#14B8A6',
          inProgress: '#6366F1',
          atRisk: '#F59E0B',
          blocked: '#F43F5E',
          critical: '#F59E0B',
          gold: '#FBBF24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
        'glow-subtle': '0 0 20px -3px rgba(255, 255, 255, 0.08)',
        'glow-amber': '0 0 22px -2px rgba(245, 158, 11, 0.35)',
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.25s ease-out forwards',
        'slide-left': 'slideLeft 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
