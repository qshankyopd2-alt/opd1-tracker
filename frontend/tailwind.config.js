/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: "var(--bg-app)",
        canvas: "var(--bg-app)",
        panel: "var(--bg-panel)",
        card: "var(--bg-card)",
        "card-hover": "var(--bg-card-hover)",
        edge: "var(--border-subtle)",
        subtle: "var(--border-subtle)",
        "border-subtle": "var(--border-subtle)",
        surface: {
          panel: "var(--bg-panel)",
          modal: "var(--bg-panel)",
          popover: "var(--bg-card)",
        },
        ink: "var(--bg-app)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "team-a": "var(--accent-team-a)",
        "team-b": "var(--accent-team-b)",
        victory: "var(--accent-team-a)",
        defeat: "var(--accent-team-b)",
        brand: {
          DEFAULT: "#eeeeee",
          hover: "#FFFFFF",
        },
        "accent-gold": "var(--accent-gold)",
        "accent-info": "var(--accent-info)",
        win: {
          DEFAULT: "var(--accent-team-a)",
          subtle: "#132a23",
          ring: "#2c7a61",
        },
        loss: {
          DEFAULT: "var(--accent-team-b)",
          subtle: "#32171c",
          ring: "#9f3e49",
        },
        flag: {
          DEFAULT: "var(--accent-gold)",
          subtle: "#321c22",
          ring: "#843245",
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
        display: ['"Segoe UI Variable Display"', '"Segoe UI"', "system-ui", "sans-serif"],
        body: ['"Segoe UI Variable Text"', '"Segoe UI"', "system-ui", "sans-serif"],
        mono: ['"Segoe UI Variable Text"', '"Segoe UI"', "system-ui", "sans-serif"],
        code: ['"Cascadia Mono"', "Consolas", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
