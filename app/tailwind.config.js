const defaultTheme = require('tailwindcss/defaultTheme');
const Colors = require('tailwindcss/colors');

module.exports = {
  corePlugins: {
    preflight: true
  },
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      borderColor: {
        default: Colors.black
      },
      fontFamily: {
        sans: ['Poppins', ...defaultTheme.fontFamily.sans]
      },
      backgroundColor: ['active'],
    }
  },
  variants: {
    extend: {},
  },
  plugins: [],
}

