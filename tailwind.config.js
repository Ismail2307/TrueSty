/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf8',
          500: '#0F9D8A',
          600: '#0b7d6e',
          700: '#096357',
        },
      },
    },
  },
  plugins: [],
};
