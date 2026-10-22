import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "media",
  theme: { extend: {
    colors: { ink: "#0B2E21", green: "#0E3B2C", gold: "#FFC83D", red: "#E4402F", mint: "#CFE9DB", page: "#F2F7F3", muted: "#4B5F55", line: "#D5E2DA" },
    fontFamily: { heading: ["Familjen Grotesk", "Arial", "sans-serif"], body: ["Hanken Grotesk", "Arial", "sans-serif"] },
    boxShadow: { green: "0 24px 46px -24px #0b2e218c" },
    borderRadius: { card: "20px" }
  }}, plugins: [require("@tailwindcss/forms")]
};
export default config;
