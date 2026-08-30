/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09090B",
        panel: "#121215",
        card: "#18181B",
        edge: "#27272A",
        brand: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
        },
        victory: "#10B981",
        defeat: "#EF4444",
      },
      fontFamily: {
        display: ['"Fira Sans Condensed"', "Arial Narrow", "sans-serif"],
        body: ['"Fira Sans"', "Segoe UI", "sans-serif"],
        mono: ['"Fira Code"', "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
