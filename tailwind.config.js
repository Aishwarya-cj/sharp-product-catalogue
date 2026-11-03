/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#000000',
          900: '#0a0a0a',
          850: '#121212',
          800: '#181818',
          700: '#222222',
          600: '#2e2e2e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-white': '0 0 25px -5px rgba(255, 255, 255, 0.25)',
        'glow-subtle': '0 0 15px -3px rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}
