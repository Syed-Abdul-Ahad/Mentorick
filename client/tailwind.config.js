/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#EEF6F2',
          100: '#D6EADF',
          200: '#AED6C0',
          300: '#7DB89A',
          400: '#4E8F6F',
          500: '#0A3A24', // MAIN PRIMARY
          600: '#082F1D',
          700: '#062515',
          800: '#041B0F',
          900: '#021109',
          950: '#010805'
        },
      },
    },
  },
  plugins: [],
}
