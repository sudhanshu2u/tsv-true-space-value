import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:  "#0d0d0d",
        sand: "#f5f0e8",
        brand: { DEFAULT: "#b08840", light: "#d4aa5a", dark: "#8a6820" },
        gold:  { DEFAULT: "#b08840", light: "#d4aa5a", dark: "#8a6820" },
        forest: "#1c1a17",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans:  ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
