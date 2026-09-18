import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: { 1: "var(--surface-1)", 2: "var(--surface-2)", card: "var(--surface-card)" },
        line: { DEFAULT: "var(--border)", strong: "var(--border-strong)", soft: "var(--border-soft)" },
        track: "var(--track)",
        chart: { strong: "var(--chart-strong)", base: "var(--chart-base)", tint: "var(--chart-tint)" },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        fill: { primary: "var(--fill-primary)", subtle: "var(--bg-subtle)" },
        on: { primary: "var(--on-primary)" },
        accent: { text: "var(--text-accent)", border: "var(--border-accent)", bg: "var(--bg-accent)" },
        danger: { bg: "var(--bg-danger)" },
        warning: { bg: "var(--bg-warning)" },
        risk: {
          low: "var(--risk-low)",
          moderate: "var(--risk-moderate)",
          high: "var(--risk-high)",
        },
      },
      borderWidth: { hair: "0.5px" },
      borderRadius: { card: "12px", control: "8px" },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontWeight: { normal: "400", medium: "500" },
    },
  },
  plugins: [],
};

export default config;
