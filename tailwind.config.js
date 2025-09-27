/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fbf6f6",
          100: "#f2e4e4",
          200: "#e5c4c4",
          300: "#d39a9a",
          400: "#b96060",
          500: "#a13b3b",
          600: "#7a1d1d",   // pumpjack maroon
          700: "#611616",
          800: "#471010",
          900: "#2b0707"
        },
        sand:   "#e9dfcf",
        rust:   "#b45309",
        diesel: "#0b1220"   // deep night
      }
    }
  },
  plugins: []
};