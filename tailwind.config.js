/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#003883",
          blueDark: "#002b63",
          blueLight: "#e9f1ff",
        },
        blue: {
          50: "#edf5ff",
          100: "#dfeeff",
          200: "#bfd7ff",
          300: "#8ab0f8",
          400: "#5a88df",
          500: "#003883",
          600: "#002f6f",
          700: "#00255d",
          800: "#001d49",
          900: "#001633",
        },
      },
    },
  },
  plugins: [],
};
