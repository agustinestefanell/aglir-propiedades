import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        soil: "#8f6b4f",
        ink: "#1f2933",
        leaf: "#2f6f4e",
        paper: "#f7f5ef"
      }
    }
  },
  plugins: []
};

export default config;
