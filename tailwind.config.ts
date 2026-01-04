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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // PowerPoint Theme 2 Colors
        primary: {
          DEFAULT: "#156082",
          hover: "#0F9ED5",
          dark: "#0E2841",
        },
        secondary: {
          DEFAULT: "#E97132",
        },
        accent: {
          1: "#156082",
          2: "#E97132",
          3: "#196B24",
          4: "#0F9ED5",
          5: "#A02B93",
          6: "#4EA72E",
        },
        ppt: {
          dark1: "#000000",
          light1: "#FFFFFF",
          dark2: "#0E2841",
          dark3: "#0E1729", // Primary Dark Background from presentation
          light2: "#E8E8E8",
          accent1: "#156082",
          accent2: "#E97132",
          accent3: "#196B24",
          accent4: "#0F9ED5", // Neon blue for processing highlights
          accent5: "#A02B93",
          accent6: "#4EA72E", // Neon green for efficiency highlights
          accent7: "#0d9487", // Active/Selected button color
          hyperlink: "#467886",
          // Presentation secondary accents
          slate1: "#465469", // Slate Gray
          slate2: "#334054", // Dark Slate Blue
          slate3: "#606C7E", // Muted Blue-Gray
          // Neon variants with glow
          neonGreen: "#4EA72E",
          neonBlue: "#0F9ED5",
          neonGreenGlow: "rgba(78, 167, 46, 0.5)",
          neonBlueGlow: "rgba(15, 158, 213, 0.5)",
        },
      },
    },
  },
  plugins: [],
};
export default config;

