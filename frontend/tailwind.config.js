/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#14181c',
          card: '#1b2228',
          accent: '#00e054', // Letterboxd green vibe
          text: '#9ab',
          light: '#e1e7ed'
        }
      }
    },
  },
  plugins: [],
}
