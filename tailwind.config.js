/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'acubat': {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d4ff',
          300: '#a5b8ff',
          400: '#8190ff',
          500: '#6b5bff',
          600: '#5a3dff',
          700: '#4c2fe6',
          800: '#3f28b8',
          900: '#352594',
        },
        'acubat-purple': '#6b5bff',
        'acubat-blue': '#3b82f6',
        'acubat-green': '#10b981',
        'acubat-orange': '#f59e0b',
        'acubat-red': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
