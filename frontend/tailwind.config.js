/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#22c55e', // Green-500 for Consumer actions
        'secondary': '#3b82f6', // Blue-500 for Manufacturer actions
        'accent': '#6366f1', // Indigo-500 for Logistics actions
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
