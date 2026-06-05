/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Luxury Golden Accents
        gold: {
          50: '#fdfbf7',
          100: '#fbf7ed',
          500: '#d4af37',
          600: '#b89626',
        },
        // Ethereal Commerce Design Palette
        surface: '#fcf8fa',
        'surface-dim': '#dcd9db',
        'surface-bright': '#fcf8fa',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f6f3f4',
        'surface-container': '#f0edee',
        'surface-container-high': '#eae7e9',
        'surface-container-highest': '#e5e2e3',
        'on-surface': '#1b1b1d',
        'on-surface-variant': '#45464c',
        'inverse-surface': '#303031',
        'inverse-on-surface': '#f3f0f1',
        outline: '#76777d',
        'outline-variant': '#c6c6cd',
        primary: '#000000',
        'on-primary': '#ffffff',
        'primary-container': '#141b2b',
        'on-primary-container': '#7d8497',
        'inverse-primary': '#c0c6db',
        secondary: '#5c5f60',
        'on-secondary': '#ffffff',
        'secondary-container': '#dee0e2',
        'on-secondary-container': '#606365',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        metropolis: ['Metropolis', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
