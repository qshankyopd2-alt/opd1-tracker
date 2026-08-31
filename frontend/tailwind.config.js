/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0A0D12",
        surface: {
          panel: "#0F131A",
          modal: "#12161D",
          popover: "#161B23",
        },
        ink: "#0A0D12",
        panel: "#0F131A",
        card: "#12161D",
        edge: "rgba(255,255,255,0.10)",
        brand: {
          DEFAULT: "#F5A623",
          hover: "#D98B12",
        },
        win: {
          DEFAULT: "#34D399",
          subtle: "rgba(52,211,153,0.10)",
          ring: "rgba(52,211,153,0.25)",
        },
        loss: {
          DEFAULT: "#FB7185",
          subtle: "rgba(251,113,133,0.10)",
          ring: "rgba(251,113,133,0.25)",
        },
        flag: {
          DEFAULT: "#FACC15",
          subtle: "rgba(250,204,21,0.10)",
          ring: "rgba(250,204,21,0.25)",
        },
        victory: "#34D399",
        defeat: "#FB7185",
      },
      backdropBlur: {
        panel: "24px",
        modal: "40px",
      },
      boxShadow: {
        panel: "0 20px 60px -15px rgba(0,0,0,0.5)",
        modal: "0 25px 80px -20px rgba(0,0,0,0.6)",
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        display: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        body: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
        code: ['"Cascadia Mono"', "Consolas", "ui-monospace", "monospace"],
      },
      fontWeight: {
        extrabold: "700",
        black: "700",
      },
    },
  },
  plugins: [],
};
