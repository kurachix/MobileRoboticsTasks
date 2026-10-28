/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#09090b',
          surface: '#121217',
          card: '#181822',
          border: '#262636',
          muted: '#2e2e42',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          DEFAULT: '#8b5cf6',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          glow: 'rgba(139, 92, 246, 0.15)',
        },
      },
    },
  },
  plugins: [],
};

