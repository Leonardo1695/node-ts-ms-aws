/** @type {import('tailwindcss').Config} */
const path = require('node:path');

module.exports = {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        verdiron: {
          primary: '#1F9D55',
          'primary-dark': '#15724A',
          accent: '#F2A516',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['1.875rem', { lineHeight: '2.25rem' }],
        'display-sm': ['1.5rem', { lineHeight: '2rem' }],
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shiny-sweep': {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        'aurora-drift': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(12%, 8%, 0) scale(1.08)' },
        },
        'aurora-drift-reverse': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(-10%, -6%, 0) scale(1.05)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'shiny-sweep': 'shiny-sweep 4s linear infinite',
        'aurora-drift': 'aurora-drift 14s ease-in-out infinite',
        'aurora-drift-reverse': 'aurora-drift-reverse 18s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.45s ease-out',
      },
    },
  },
  plugins: [],
};
