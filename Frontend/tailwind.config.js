/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'theme-bg': '#071A1D',
        'theme-card': '#0B2426',
        'theme-surface': '#0f2f32',
        'theme-accent': '#35E6A1',
        'theme-accent-mint': '#4FFFC0',
        'theme-secondary': '#B9C9C6',
        'theme-border': '#214A47',
      },
    },
  },
  plugins: [],
}
