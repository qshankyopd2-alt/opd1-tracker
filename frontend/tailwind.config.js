/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Colors are defined through RGB channel variables so Tailwind can
      // synthesize opacity variants (bg-inset/40, border-edge/60, …).
      colors: {
        app: "rgb(var(--bg-app-rgb) / <alpha-value>)",
        canvas: "rgb(var(--bg-app-rgb) / <alpha-value>)",
        panel: "rgb(var(--bg-panel-rgb) / <alpha-value>)",
        card: "rgb(var(--bg-card-rgb) / <alpha-value>)",
        "card-hover": "rgb(var(--bg-card-hover-rgb) / <alpha-value>)",
        inset: "rgb(var(--bg-inset-rgb) / <alpha-value>)",
        edge: "rgb(var(--border-subtle-rgb) / <alpha-value>)",
        subtle: "rgb(var(--border-subtle-rgb) / <alpha-value>)",
        "border-subtle": "rgb(var(--border-subtle-rgb) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong-rgb) / <alpha-value>)",
        ink: "rgb(var(--bg-app-rgb) / <alpha-value>)",
        "text-primary": "rgb(var(--text-primary-rgb) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary-rgb) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted-rgb) / <alpha-value>)",
        ally: {
          DEFAULT: "rgb(var(--ally-rgb) / <alpha-value>)",
          subtle: "rgba(76, 194, 255, 0.12)",
          ring: "rgba(76, 194, 255, 0.45)",
        },
        enemy: {
          DEFAULT: "rgb(var(--enemy-rgb) / <alpha-value>)",
          subtle: "rgba(255, 70, 85, 0.12)",
          ring: "rgba(255, 70, 85, 0.45)",
        },
        victory: {
          DEFAULT: "rgb(var(--win-rgb) / <alpha-value>)",
          subtle: "rgba(67, 209, 124, 0.12)",
          ring: "rgba(67, 209, 124, 0.45)",
        },
        defeat: {
          DEFAULT: "rgb(var(--loss-rgb) / <alpha-value>)",
          subtle: "rgba(255, 70, 85, 0.12)",
          ring: "rgba(255, 70, 85, 0.45)",
        },
        win: {
          DEFAULT: "rgb(var(--win-rgb) / <alpha-value>)",
          subtle: "rgba(67, 209, 124, 0.12)",
          ring: "rgba(67, 209, 124, 0.45)",
        },
        loss: {
          DEFAULT: "rgb(var(--loss-rgb) / <alpha-value>)",
          subtle: "rgba(255, 70, 85, 0.12)",
          ring: "rgba(255, 70, 85, 0.45)",
        },
        draw: {
          DEFAULT: "rgb(var(--draw-rgb) / <alpha-value>)",
          subtle: "rgba(138, 147, 162, 0.14)",
          ring: "rgba(138, 147, 162, 0.4)",
        },
        gold: {
          DEFAULT: "rgb(var(--gold-rgb) / <alpha-value>)",
          subtle: "rgba(240, 180, 41, 0.12)",
          ring: "rgba(240, 180, 41, 0.45)",
        },
        warn: "rgb(var(--warn-rgb) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          soft: "var(--accent-soft)",
        },
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          hover: "rgb(var(--brand-hover-rgb) / <alpha-value>)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      transitionDuration: {
        fast: "var(--dur-fast)",
        normal: "var(--dur-normal)",
      },
      transitionTimingFunction: {
        ease: "var(--ease)",
      },
      fontFamily: {
        sans: ['"Segoe UI Variable Text"', '"Segoe UI"', "system-ui", "sans-serif"],
        display: ['Bahnschrift', '"Segoe UI Variable Display"', '"Segoe UI"', "system-ui", "sans-serif"],
        body: ['"Segoe UI Variable Text"', '"Segoe UI"', "system-ui", "sans-serif"],
        // Telemetry / score numerals — Bahnschrift with tabular figures.
        mono: ['Bahnschrift', '"Segoe UI Variable Text"', '"Segoe UI"', "system-ui", "sans-serif"],
        code: ['"Cascadia Mono"', "Consolas", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
