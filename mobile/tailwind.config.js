/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './features/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E0F7F4', 100: '#B2EBE4', 200: '#80DECD', 300: '#4DD0B6',
          400: '#26C6A1', 500: '#00BFA5', 600: '#00A895', 700: '#008F7E',
          800: '#007668', 900: '#004F46',
        },
        secondary: {
          50: '#E8F1FF', 100: '#C5D9FF', 200: '#9EBFFF', 300: '#74A4FF',
          400: '#4D8EFF', 500: '#2979FF', 600: '#1A6AFF', 700: '#0055FF',
          800: '#0047E0', 900: '#002DAD',
        },
        accent: {
          50: '#FFF0F0', 100: '#FFD6D6', 200: '#FFB0B0', 300: '#FF8585',
          400: '#FF6B6B', 500: '#FF5252', 600: '#F44336', 700: '#E53935',
          800: '#C62828', 900: '#B71C1C',
        },
        success: '#4CAF50', warning: '#FF9800', error: '#F44336',
        neutral: {
          50: '#F8FAFB', 100: '#F1F4F6', 200: '#E4E9EE', 300: '#CDD5DE',
          400: '#9AAAB8', 500: '#6B7E93', 600: '#4A5D70', 700: '#334455',
          800: '#1E2D3D', 900: '#0F1923',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
      borderRadius: {
        '2xl': '16px', '3xl': '24px', '4xl': '32px',
      },
    },
  },
  plugins: [],
};