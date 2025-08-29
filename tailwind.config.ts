import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dialogue: {
          bg: 'rgba(20, 20, 28, 0.72)',
          border: '#3a3a46',
        },
      },
    },
  },
  plugins: [],
}

export default config

