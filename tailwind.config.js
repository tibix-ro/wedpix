/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#FDF8F0',
        // Deep bronze-gold: brightest gold that still meets WCAG AA (4.5:1)
        // for text on ivory and white text on gold buttons.
        'rose-gold': '#8A6E34',
        blush: '#F2D7D0',
        charcoal: '#3D3535',
        // Darkened for AA-compliant muted text on ivory (~5:1).
        taupe: '#736767',
        cream: '#F5EFE6',
        'gold-light': '#E8D5A3',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 2s linear infinite',
        'toast-in': 'toastIn 0.35s ease forwards',
        'toast-out': 'toastOut 0.3s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        toastOut: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      boxShadow: {
        'gold': '0 4px 24px rgba(201,169,110,0.25)',
        'gold-lg': '0 8px 40px rgba(201,169,110,0.35)',
        'card': '0 2px 16px rgba(61,53,53,0.08)',
        'card-lg': '0 8px 32px rgba(61,53,53,0.12)',
      },
    },
  },
  plugins: [],
}
