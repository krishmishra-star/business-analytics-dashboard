/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 900: '#0b1b3a', 700: '#1e3358', 500: '#51607e', 400: '#7a87a3', 300: '#a8b2c7' },
        surface: { DEFAULT: '#f4f6fb', card: '#ffffff', line: '#e4e8f1' },
        brand: { 50: '#eef3ff', 100: '#dbe6ff', 500: '#2f64f0', 600: '#2352d6', 700: '#1c43b0' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(11,27,58,0.04), 0 4px 14px rgba(11,27,58,0.04)' },
    },
  },
  plugins: [],
};
