/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /** Super-admin console (dark sidebar + light canvas) */
        admin: {
          sidebar: '#0a0d0c',
          sidebarElevated: '#101514',
          canvas: '#f4f6f5',
          accent: '#16a34a',
          'accent-bright': '#22c55e',
          'accent-dim': '#14532d',
        },
        brand: {
          50: '#eef4ff',
          100: '#d9e5ff',
          200: '#bcd0ff',
          300: '#8eaeff',
          400: '#5b82fb',
          500: '#3b5bef',
          600: '#2642e3',
          700: '#1f33cc',
          800: '#1e2aa5',
          900: '#1e2883',
          950: '#12184d',
        },
        surface: {
          850: '#0f1629',
          900: '#0c1222',
          950: '#080c18',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        admin: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.35)',
        card: '0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 40px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
};
