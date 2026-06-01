import type { Config } from "tailwindcss";

/**
 * Forest dark-green theme for Rose Restaurant.
 * Mobile-first, minimal, high-contrast on a deep evergreen background.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        canvas: "#0a1410", // near-black forest
        surface: "#10221a", // card background
        "surface-2": "#16302440", // subtle raised
        elevated: "#152c21",
        border: "#244a37",
        "border-soft": "#1c3a2b",
        // Text
        ink: "#e8f2ec",
        "ink-muted": "#9fb8aa",
        "ink-faint": "#6f8b7c",
        // Brand greens
        forest: {
          50: "#edfdf3",
          100: "#d3f8e0",
          200: "#a8efc4",
          300: "#6fe0a3",
          400: "#37c97e",
          500: "#14ae60",
          600: "#0a8c4d",
          700: "#0a6f40",
          800: "#0c5734",
          900: "#0b482c",
          950: "#04271a",
        },
        // Channel accents (income sources)
        channel: {
          z: "#37c97e", // Z report / in-house
          justeat: "#f59e0b", // Just Eat (orange)
          ubereats: "#34d399", // Uber Eats (green)
          deliveroo: "#22d3ee", // Deliveroo (teal/cyan)
        },
        danger: "#f0635a",
        warning: "#f3b341",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
