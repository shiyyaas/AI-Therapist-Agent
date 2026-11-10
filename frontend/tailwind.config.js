/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#101014',
        paper: '#ffffff',
        sky: '#59acff',
        grass: '#62d962',
        daylight: '#f2f2ff',
        bubblegum: '#ff8cbc',
        tangerine: '#ff7040',
        sunshine: '#ffe359',
        ink: '#0a0a0a',
      },
      borderRadius: {
        'slab': '32px',
        'card': '32px',
        'pill': '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
