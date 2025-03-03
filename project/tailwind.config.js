/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#9810FA',
        'primary-dark': '#8228E5',
        'background-light': '#F9FAFB',
        'background-dark': '#0F1F2A',
      },
    },
  },
  plugins: [],
};