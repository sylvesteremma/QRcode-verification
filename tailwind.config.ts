import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
        },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)",
        popover: "0 10px 15px -3px rgba(15,23,42,0.1)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #FFFFFF 100%)",
        "brand-gradient":
          "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
