import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        skybrand: "#2F7BFF",
        mintbrand: "#43D48A",
        sunbrand: "#FFC247",
        coralbrand: "#FF875C",
        violetbrand: "#8B6CFF",
        ink: "#122047"
      },
      boxShadow: {
        soft: "0 18px 48px rgba(47, 123, 255, 0.18)",
        float: "0 18px 36px rgba(18, 32, 71, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
