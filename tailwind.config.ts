import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        swiss: {
          red: "#FF0000",
          white: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};

export default config;
